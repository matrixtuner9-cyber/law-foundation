import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api.dart';

/// إشعارات الآيفون عبر خدمة Apple (APNs): يطلب الإذن، ويأخذ رمز الجهاز، ويسجّله لدى خادم المكتب
/// على أندرويد تبقى خدمة الاستقبال في الخلفية كما هي (bg_io.dart)
const _ch = MethodChannel('mithaq/push');
String _st = Platform.isIOS ? 'default' : 'unsupported';

/// أجهزة الاختبار من Xcode تستخدم خادم Apple التجريبي، ونسخ TestFlight والمتجر الخادم الرسمي
const _env = kReleaseMode ? 'prod' : 'sandbox';

Future<bool> _register(String code, String token, {bool off = false}) async {
  try {
    final r = await http
        .post(Uri.parse(Api.url('/api/portal/apns-register')),
            headers: {'x-client': code, 'content-type': 'application/json'},
            body: jsonEncode({'token': token, 'env': _env, if (off) 'off': true}))
        .timeout(const Duration(seconds: 20));
    if (r.statusCode != 200) return false;
    final j = jsonDecode(utf8.decode(r.bodyBytes));
    return off || j['ready'] == true;
  } catch (_) {
    return false;
  }
}

Future<Map?> _token() async {
  final r = await _ch.invokeMethod('enable');
  return r is Map ? r : null;
}

/// granted | denied | server | error | unsupported
Future<String> enablePush(String code) async {
  if (!Platform.isIOS) return 'unsupported';
  try {
    final r = await _token();
    final st = '${r?['status'] ?? 'error'}';
    if (st != 'granted') {
      if (st == 'denied') _st = 'denied';
      return st == 'denied' ? 'denied' : 'error';
    }
    _st = 'granted';
    final t = '${r!['token']}';
    final p = await _prefs();
    await p?.setString('apns_token', t);
    return await _register(code, t) ? 'granted' : 'server';
  } catch (_) {
    return 'error';
  }
}

/// granted | default | denied | unsupported
String pushStatus() => _st;

Future<String> pushRefresh() async {
  if (!Platform.isIOS) return _st;
  try {
    _st = '${await _ch.invokeMethod('status')}';
  } catch (_) {}
  return _st;
}

/// عند فتح التطبيق: إن كان الإذن ممنوحاً نجدد تسجيل الجهاز بصمت (قد يتغير الرمز بعد تحديث iOS)
Future<void> pushResume(String code) async {
  if (!Platform.isIOS || code.isEmpty) return;
  if (await pushRefresh() != 'granted') return;
  try {
    final r = await _token();
    if (r?['status'] == 'granted') {
      final t = '${r!['token']}';
      await (await _prefs())?.setString('apns_token', t);
      await _register(code, t);
    }
    await _ch.invokeMethod('clearBadge');
  } catch (_) {}
}

/// عند تسجيل الخروج: لا تصل رسائل هذا الموكل إلى الهاتف بعد الآن
Future<void> pushForget(String code) async {
  if (!Platform.isIOS || code.isEmpty) return;
  final p = await _prefs();
  final t = p?.getString('apns_token');
  if (t == null) return;
  await _register(code, t, off: true);
  await p?.remove('apns_token');
}

Future<SharedPreferences?> _prefs() async {
  try {
    return await SharedPreferences.getInstance();
  } catch (_) {
    return null;
  }
}
