import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'push.dart' show pushResume, pushForget;
import 'util.dart';

/// حالة التطبيق: بيانات الموكل والمحادثة، مع تحديث دوري من الخادم
class PortalStore extends ChangeNotifier {
  Map<String, dynamic>? home;
  List<Msg> msgs = [];
  final List<Msg> outbox = [];
  bool chatOpen = false;
  Timer? _timer;
  int _tick = 0;
  bool _loaded = false;

  /// يُستدعى عند وصول رسالة أو إشعار جديد من المحامي (للتنبيه الصوتي والنصي)
  void Function(Msg m)? onIncoming;

  Map<String, dynamic> get client => Map<String, dynamic>.from(home?['client'] ?? {});
  Map<String, dynamic> get office => Map<String, dynamic>.from(home?['office'] ?? {});
  List<Map<String, dynamic>> get cases =>
      ((home?['cases'] ?? []) as List).map((e) => Map<String, dynamic>.from(e)).toList();
  List<Map<String, dynamic>> get docs => ((home?['docs'] ?? []) as List).map((e) => Map<String, dynamic>.from(e)).toList();
  List<String> get steps => ((home?['steps'] ?? []) as List).map((e) => '$e').toList();
  List<Msg> get all => [...msgs, ...outbox];
  int get unread => msgs.where((m) => !m.mine && !m.seen).length;

  String get firstName {
    final n = '${client['name'] ?? ''}';
    return client['type'] == 'فرد' ? n.split(' ').first : n;
  }

  /// الجلسة القادمة عبر كل القضايا
  ({Map<String, dynamic> kase, Map<String, dynamic> h, DateTime t})? get nextHearing {
    final now = DateTime.now();
    final all = <({Map<String, dynamic> kase, Map<String, dynamic> h, DateTime t})>[];
    for (final k in cases) {
      for (final h in (k['hearings'] as List)) {
        final m = Map<String, dynamic>.from(h);
        final t = parseDate(m['date'], m['time']);
        if (t.isAfter(now)) all.add((kase: k, h: m, t: t));
      }
    }
    all.sort((a, b) => a.t.compareTo(b.t));
    return all.isEmpty ? null : all.first;
  }

  Future<void> load() async {
    home = await Api.home();
    msgs = await Api.messages(peek: !chatOpen);
    _loaded = true;
    notifyListeners();
  }

  Future<void> refreshMessages() async {
    final n = await Api.messages(peek: !chatOpen);
    final sig = n.map((m) => '${m.id}${m.seen}').join();
    if (sig != msgs.map((m) => '${m.id}${m.seen}').join()) {
      final known = msgs.map((m) => m.id).toSet();
      final fresh = n.where((m) => !m.mine && !known.contains(m.id)).toList();
      msgs = n;
      if (_loaded && fresh.isNotEmpty) onIncoming?.call(fresh.last);
      notifyListeners();
    }
  }

  void setChatOpen(bool v) {
    chatOpen = v;
    if (v) refreshMessages().catchError((_) {});
  }

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) async {
      _tick++;
      try {
        await refreshMessages();
        if (_tick % 8 == 0) {
          home = await Api.home();
          notifyListeners();
        }
      } catch (_) {}
    });
  }

  Future<void> _send(Msg tmp, Future<Msg> Function() call) async {
    tmp.failed = false;
    tmp.pending = true;
    if (!outbox.contains(tmp)) outbox.add(tmp);
    notifyListeners();
    try {
      final m = await call();
      outbox.remove(tmp);
      if (!msgs.any((x) => x.id == m.id)) msgs.add(m);
    } catch (e) {
      tmp.failed = true;
      tmp.pending = false;
    }
    notifyListeners();
  }

  /// حفظ أرقام التواصل لدى المكتب
  Future<void> saveProfile({required String phone, required String phone2, required String whatsapp}) async {
    final c = await Api.profile({'phone': phone, 'phone2': phone2, 'whatsapp': whatsapp});
    home = {...?home, 'client': {...client, ...c}};
    notifyListeners();
  }

  Future<void> sendText(String t) {
    final tmp = Msg.local('text', text: t);
    return _send(tmp, () => Api.sendText(t));
  }

  Future<void> sendVoice(Uint8List bytes, String mime, double secs) {
    final tmp = Msg.local('voice', bytes: bytes, dur: secs, mime: mime);
    return _send(tmp, () => Api.sendVoice(bytes, mime, secs));
  }

  Future<void> sendFile(Uint8List bytes, String name, String mime, {String caption = '', bool image = false}) {
    final tmp = Msg.local(image ? 'image' : 'file', text: caption, name: name, bytes: bytes, mime: mime)
      ..caption = caption;
    return _send(tmp, () => Api.sendFile(bytes, name, mime, caption: caption));
  }

  Future<void> retry(Msg m) {
    if (m.type == 'text') return _send(m, () => Api.sendText(m.text));
    if (m.type == 'voice') return _send(m, () => Api.sendVoice(m.local!, m.mime ?? 'audio/webm', m.dur.toDouble()));
    return _send(m, () => Api.sendFile(m.local!, m.name ?? 'مرفق', m.mime ?? mimeOf(m.name ?? ''), caption: m.caption ?? ''));
  }

  Future<void> logout() async {
    _timer?.cancel();
    final p = await SharedPreferences.getInstance();
    await p.remove('code');
    await pushForget(Api.code ?? '').timeout(const Duration(seconds: 8), onTimeout: () {});
    Api.code = null;
    _loaded = false;
    home = null;
    msgs = [];
    outbox.clear();
    notifyListeners();
  }
}

final store = PortalStore();
