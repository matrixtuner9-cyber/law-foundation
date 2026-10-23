import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// قناة رسائل المكتب: صوت ميثاق وتنبيه بأولوية عالية
const _msgChannel = AndroidNotificationChannel(
  'mithaq_messages',
  'رسائل المكتب',
  description: 'رسائل المحامي وإشعارات المكتب',
  importance: Importance.high,
  playSound: true,
  sound: RawResourceAndroidNotificationSound('chime'),
);

/// قناة الخدمة الدائمة (هادئة)
const _svcChannel = AndroidNotificationChannel(
  'mithaq_service',
  'اتصال البوابة',
  description: 'يبقي البوابة متصلة لاستقبال رسائل المكتب',
  importance: Importance.low,
  playSound: false,
);

const _icon = AndroidInitializationSettings('@mipmap/ic_launcher');

/// تُستدعى عند تشغيل التطبيق: تهيئة الإشعارات وتشغيل خدمة الاستقبال في الخلفية
Future<void> initBackground() async {
  if (!Platform.isAndroid) return;
  try {
    final n = FlutterLocalNotificationsPlugin();
    await n.initialize(const InitializationSettings(android: _icon));
    final android = n.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(_msgChannel);
    await android?.createNotificationChannel(_svcChannel);
    await android?.requestNotificationsPermission();

    final svc = FlutterBackgroundService();
    await svc.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onBackgroundStart,
        autoStart: true,
        autoStartOnBoot: true,
        isForegroundMode: true,
        notificationChannelId: _svcChannel.id,
        initialNotificationTitle: 'بوابة ميثاق',
        initialNotificationContent: 'متصلة لاستقبال رسائل المكتب',
        foregroundServiceNotificationId: 7001,
        foregroundServiceTypes: [AndroidForegroundType.remoteMessaging],
      ),
      iosConfiguration: IosConfiguration(autoStart: false),
    );
    if (!await svc.isRunning()) await svc.startService();
  } catch (_) {}
}

/// التطبيق ظاهر أمام الموكل؟ عندها يصدر التطبيق التنبيه بنفسه ولا تكرّره الخدمة
Future<void> setForeground(bool v) async {
  if (!Platform.isAndroid) return;
  final p = await SharedPreferences.getInstance();
  await p.setBool('fg', v);
}

@pragma('vm:entry-point')
Future<void> onBackgroundStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  final n = FlutterLocalNotificationsPlugin();
  await n.initialize(const InitializationSettings(android: _icon));
  await _poll(n);
  Timer.periodic(const Duration(seconds: 15), (_) => _poll(n));
}

bool _busy = false;

/// يسأل خادم المكتب عن رسائل المحامي الجديدة، وينبّه بكل رسالة مرة واحدة
Future<void> _poll(FlutterLocalNotificationsPlugin n) async {
  if (_busy) return;
  _busy = true;
  try {
    final p = await SharedPreferences.getInstance();
    await p.reload();
    final code = p.getString('code');
    if (code == null) return;
    /// عنوان المكتب الذي اختاره الموكل عند الدخول (التطبيق واحد لكل المكاتب، فلا عنوان مبنيّ فيه)
    const built = String.fromEnvironment('API', defaultValue: '');
    final saved = p.getString('api');
    final base = (saved != null && saved.isNotEmpty) ? saved : built;
    if (base.isEmpty) return;
    final r = await http
        .get(Uri.parse('$base/api/portal/messages?peek=1'), headers: {'x-client': code})
        .timeout(const Duration(seconds: 12));
    if (r.statusCode != 200) return;
    final list = (jsonDecode(utf8.decode(r.bodyBytes)) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    final fresh = list.where((m) => m['from'] == 'lawyer' && m['seen'] != true).toList();
    final first = !p.containsKey('notified');
    final done = (p.getStringList('notified') ?? <String>[]).toSet();
    final fg = p.getBool('fg') ?? false;
    for (final m in fresh) {
      final id = '${m['id']}';
      if (done.contains(id)) continue;
      done.add(id);
      if (fg) continue;
      final type = '${m['type']}';
      final title = type == 'notice' ? 'إشعار من المكتب' : 'رسالة من المحامي';
      final text = '${m['text'] ?? ''}';
      final body = switch (type) {
        'voice' => 'رسالة صوتية جديدة',
        'image' => text.isEmpty ? 'أرسل لك صورة' : 'صورة: $text',
        'file' => 'أرسل لك مستنداً: ${m['name'] ?? ''}',
        _ => text,
      };
      await n.show(
        id.hashCode & 0x7fffffff,
        title,
        body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _msgChannel.id,
            _msgChannel.name,
            channelDescription: _msgChannel.description,
            importance: Importance.high,
            priority: Priority.high,
            playSound: true,
            sound: const RawResourceAndroidNotificationSound('chime'),
            styleInformation: BigTextStyleInformation(body),
            color: const Color(0xFFB9965A),
            category: AndroidNotificationCategory.message,
            visibility: NotificationVisibility.private,
          ),
        ),
      );
    }
    if (first || fresh.isNotEmpty) {
      final keep = done.toList();
      await p.setStringList('notified', keep.length > 400 ? keep.sublist(keep.length - 400) : keep);
    }
  } catch (_) {
    // لا اتصال بالخادم الآن؛ نعيد المحاولة في الدورة التالية
  } finally {
    _busy = false;
  }
}


/// يطلب إذن الإشعارات (بعد ظهور الواجهة) ويتأكد من تشغيل خدمة الاستقبال
Future<bool> ensureNotify() async {
  if (!Platform.isAndroid) return true;
  try {
    final n = FlutterLocalNotificationsPlugin();
    await n.initialize(const InitializationSettings(android: _icon));
    final android = n.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(_msgChannel);
    final ok = await android?.requestNotificationsPermission() ?? true;
    final svc = FlutterBackgroundService();
    if (!await svc.isRunning()) await svc.startService();
    return ok;
  } catch (_) {
    return false;
  }
}

Future<bool> notifyEnabled() async {
  if (!Platform.isAndroid) return true;
  try {
    final n = FlutterLocalNotificationsPlugin();
    await n.initialize(const InitializationSettings(android: _icon));
    final android = n.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    return await android?.areNotificationsEnabled() ?? true;
  } catch (_) {
    return true;
  }
}

/// تنبيه تجريبي بنفس صوت وقناة رسائل المحامي
Future<void> testNotify() async {
  if (!Platform.isAndroid) return;
  final n = FlutterLocalNotificationsPlugin();
  await n.initialize(const InitializationSettings(android: _icon));
  await n.show(
    9001,
    'تجربة التنبيه',
    'هكذا تصلك رسائل المحامي وإشعارات المكتب',
    NotificationDetails(
      android: AndroidNotificationDetails(_msgChannel.id, _msgChannel.name,
          channelDescription: _msgChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          playSound: true,
          sound: const RawResourceAndroidNotificationSound('chime'),
          color: const Color(0xFFB9965A)),
    ),
  );
}

/* ── موثوقية التنبيهات دون Google ── */
const _power = MethodChannel('mithaq/power');
/// هل التطبيق مستثنى من توفير البطارية؟
Future<bool> powerOk() async {
  if (!Platform.isAndroid) return true;
  try { return await _power.invokeMethod('ignoring') == true; } catch (_) { return true; }
}
/// يطلب استثناء التطبيق من توفير البطارية (نافذة النظام)
Future<void> powerRequest() async {
  if (!Platform.isAndroid) return;
  try { await _power.invokeMethod('request'); } catch (_) {}
}
/// يفتح شاشة «التشغيل التلقائي» لدى الشركة المصنّعة (شاومي، هواوي، أوبو، فيفو، سامسونج…)
Future<bool> openAutostart() async {
  if (!Platform.isAndroid) return false;
  try { return await _power.invokeMethod('autostart') == true; } catch (_) { return false; }
}
Future<String> phoneMaker() async {
  if (!Platform.isAndroid) return '';
  try { return '${await _power.invokeMethod('maker') ?? ''}'; } catch (_) { return ''; }
}
