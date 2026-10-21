import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';

/// تحديد مكتب المحاماة في تطبيق واحد لكل المكاتب:
/// رابط الدعوة  https://office.palgaz.net/p/MQ-XXXX  ← المكتب + رمز الدخول معاً
/// أو رمز المكتب القصير  office  ← https://office.palgaz.net
/// أو عنوان كامل لخادم المكتب  https://law.example.ps
class OfficePick {
  static const domain = 'palgaz.net';
  static final _code = RegExp(r'MQ-[A-Za-z0-9]{3,12}', caseSensitive: false);
  static final _slug = RegExp(r'^[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?$');

  /// يحلل ما أدخله الموكل أو ما وصل من رابط: يعيد عنوان المكتب ورمز الدخول إن وُجد
  static ({String base, String? code})? parse(String raw) {
    var s = raw.trim();
    if (s.isEmpty) return null;
    // رسالة واتساب كاملة: نلتقط الرابط منها
    final link = RegExp(r'https?://[^\s<>"]+').firstMatch(s);
    if (link != null) s = link.group(0)!;
    final code = _code.firstMatch(s)?.group(0)?.toUpperCase();
    if (s.contains('://')) {
      final u = Uri.tryParse(s);
      if (u == null || u.host.isEmpty) return null;
      if (u.scheme != 'https' && !_localNet(u.host)) return null;
      return (base: '${u.scheme}://${u.host}${u.hasPort ? ':${u.port}' : ''}', code: code);
    }
    s = s.toLowerCase().replaceAll(RegExp(r'/.*$'), '');
    if (s.contains('.')) {
      if (!RegExp(r'^[a-z0-9.-]+(:\d+)?$').hasMatch(s)) return null;
      return (base: '${_localNet(s.split(':').first) ? 'http' : 'https'}://$s', code: code);
    }
    if (_slug.hasMatch(s)) return (base: 'https://$s.$domain', code: code);
    return null;
  }

  static bool _localNet(String h) => RegExp(r'^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|localhost$)').hasMatch(h);

  /// رمز موكل فقط دون مكتب؟
  static bool isBareCode(String raw) => _code.hasMatch(raw) && !raw.contains('.') && !raw.contains('/');

  /// يتحقق أن العنوان خادم «ميثاق» ويعيد اسم المكتب
  static Future<String> verify(String base) async {
    final j = await Api.officeInfo(base);
    if (j['app'] != 'mithaq') throw ApiError('هذا العنوان ليس خادم مكتب يعمل بنظام ميثاق.');
    return '${j['name'] ?? ''}';
  }

  static Future<void> save(String base, String name) async {
    Api.base = base;
    final p = await SharedPreferences.getInstance();
    await p.setString('api', base);
    await p.setString('office_name', name);
    await p.setString('api_for', const String.fromEnvironment('API', defaultValue: ''));
  }

  static Future<void> forget() async {
    final p = await SharedPreferences.getInstance();
    await p.remove('api');
    await p.remove('office_name');
    Api.base = const String.fromEnvironment('API', defaultValue: '');
  }

  static Future<String> savedName() async => (await SharedPreferences.getInstance()).getString('office_name') ?? '';
}
