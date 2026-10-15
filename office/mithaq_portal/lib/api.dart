import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'util.dart';

class ApiError implements Exception {
  ApiError(this.message);
  final String message;
  @override
  String toString() => message;
}

/// الاتصال بخادم المكتب
class Api {
  /// على الويب: نفس عنوان الصفحة. على الهاتف: يُمرَّر عند البناء
  /// flutter build apk --dart-define=API=http://192.168.1.20:8080
  static String base = kIsWeb ? Uri.base.origin : const String.fromEnvironment('API', defaultValue: 'http://10.0.2.2:8080');
  static String? code;

  static Map<String, String> get _h => {'x-client': code ?? ''};
  static String url(String p) => p.startsWith('http') ? p : '$base$p';

  static Future<dynamic> _j(Future<http.Response> f) async {
    late http.Response r;
    try {
      r = await f.timeout(const Duration(seconds: 60));
    } catch (_) {
      throw ApiError('تعذّر الاتصال بالمكتب. تأكد من اتصالك بالإنترنت.');
    }
    dynamic b;
    try {
      b = r.bodyBytes.isEmpty ? {} : jsonDecode(utf8.decode(r.bodyBytes));
    } catch (_) {
      b = {};
    }
    if (r.statusCode >= 400) throw ApiError(b is Map && b['error'] != null ? '${b['error']}' : 'حدث خطأ، حاول مجدداً.');
    return b;
  }

  static Future<Map<String, dynamic>> login(String c) async {
    final j = await _j(http.post(Uri.parse(url('/api/portal/login')),
        headers: {'content-type': 'application/json'}, body: jsonEncode({'code': c.trim()})));
    code = j['code'];
    return Map<String, dynamic>.from(j);
  }

  static Future<Map<String, dynamic>> profile(Map<String, String> body) async => Map<String, dynamic>.from(await _j(http.post(
      Uri.parse(url('/api/portal/profile')),
      headers: {..._h, 'content-type': 'application/json'},
      body: jsonEncode(body))));

  static Future<Map<String, dynamic>> home() async =>
      Map<String, dynamic>.from(await _j(http.get(Uri.parse(url('/api/portal/home')), headers: _h)));

  static Future<List<Msg>> messages({bool peek = false}) async {
    final l = await _j(http.get(Uri.parse(url('/api/portal/messages${peek ? '?peek=1' : ''}')), headers: _h)) as List;
    return l.map((e) => Msg.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  static Future<Msg> sendText(String t) async => Msg.fromJson(Map<String, dynamic>.from(await _j(http.post(
      Uri.parse(url('/api/portal/messages')),
      headers: {..._h, 'content-type': 'application/json'},
      body: jsonEncode({'text': t})))));

  static Future<Msg> sendVoice(Uint8List bytes, String mime, double dur) async =>
      Msg.fromJson(Map<String, dynamic>.from(await _j(http.post(
          Uri.parse(url('/api/portal/voice?dur=${dur.toStringAsFixed(1)}')),
          headers: {..._h, 'content-type': mime},
          body: bytes))));

  static Future<Msg> sendFile(Uint8List bytes, String name, String mime, {String caption = ''}) async =>
      Msg.fromJson(Map<String, dynamic>.from(await _j(http.post(
          Uri.parse(url('/api/portal/file')).replace(queryParameters: {'name': name, 'caption': caption}),
          headers: {..._h, 'content-type': mime},
          body: bytes))));
}

/// رسالة في المحادثة
class Msg {
  Msg({required this.id, required this.from, required this.type, this.text = '', required this.at, this.file,
      this.name, this.ext, this.dur = 0, this.size = 0, this.seen = false, this.pending = false, this.local});
  final String id, from, type, text, at;
  final String? file, name, ext;
  final num dur, size;
  final bool seen;
  bool pending, failed = false;
  final Uint8List? local;
  String? mime;
  String? caption;

  factory Msg.fromJson(Map<String, dynamic> j) => Msg(
      id: '${j['id']}', from: '${j['from']}', type: '${j['type'] ?? 'text'}', text: '${j['text'] ?? ''}',
      at: '${j['at'] ?? ''}', file: j['file'], name: j['name'], ext: j['ext'], dur: j['dur'] ?? 0,
      size: j['size'] ?? 0, seen: j['seen'] == true);

  factory Msg.local(String type, {String text = '', String? name, Uint8List? bytes, num dur = 0, String? mime}) {
    final n = DateTime.now();
    final at = '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')} ${hhmm(n)}';
    return Msg(
        id: 'tmp-${n.microsecondsSinceEpoch}', from: 'client', type: type, text: text, at: at, name: name,
        ext: name == null ? null : extOf(name), dur: dur, size: bytes?.length ?? 0, pending: true, local: bytes)
      ..mime = mime;
  }

  bool get mine => from == 'client';
  DateTime get time => parseStamp(at);
}
