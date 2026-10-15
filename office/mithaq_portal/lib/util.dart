import 'package:flutter/material.dart';
import 'theme.dart';

const _days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

DateTime parseDate(String d, [String t = '00:00']) {
  final p = d.split('-').map(int.parse).toList();
  final q = t.split(':').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2], q[0], q[1]);
}

DateTime parseStamp(String s) => s.length >= 16 ? parseDate(s.substring(0, 10), s.substring(11, 16)) : DateTime.now();
String dmy(DateTime d) => '${d.day}/${d.month}/${d.year}';
String dayName(DateTime d) => _days[d.weekday - 1];
String fmtDate(DateTime d) => '${dayName(d)} ${dmy(d)}';
String hhmm(DateTime d) => '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
String daysW(int n) => n == 1 ? 'يوم' : n == 2 ? 'يومين' : (n >= 3 && n <= 10) ? '$n أيام' : '$n يوماً';

int dayDiff(DateTime d) {
  final n = DateTime.now();
  return DateTime(d.year, d.month, d.day).difference(DateTime(n.year, n.month, n.day)).inDays;
}

String relDay(DateTime d) {
  final n = dayDiff(d);
  if (n == 0) return 'اليوم';
  if (n == 1) return 'غداً';
  if (n == -1) return 'أمس';
  return n > 0 ? 'بعد ${daysW(n)}' : 'قبل ${daysW(-n)}';
}

String mmss(num s) {
  final t = s.round();
  return '${t ~/ 60}:${(t % 60).toString().padLeft(2, '0')}';
}

String group(num n) {
  final s = n.round().abs().toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return (n < 0 ? '-' : '') + b.toString();
}

String money(num n) => '${group(n)} ₪';

String fileSize(num? n) {
  if (n == null || n == 0) return '';
  if (n < 1048576) return '${(n / 1024).ceil()} ك.ب';
  return '${(n / 1048576).toStringAsFixed(1)} م.ب';
}

String extOf(String name) => name.contains('.') ? name.split('.').last.toLowerCase() : '';

String mimeOf(String name) =>
    const {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'heic': 'image/heic',
      'gif': 'image/gif', 'pdf': 'application/pdf', 'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'txt': 'text/plain',
    }[extOf(name)] ??
    'application/octet-stream';

/// لون ووسم نوع الملف
(Color, String) extStyle(String? ext) {
  switch (ext) {
    case 'pdf':
      return (const Color(0xFFC2410C), 'PDF');
    case 'doc':
    case 'docx':
    case 'odt':
      return (MQ.docBlue, 'Word');
    case 'xls':
    case 'xlsx':
      return (const Color(0xFF15803D), 'Excel');
    default:
      return (const Color(0xFF57534E), (ext ?? 'ملف').toUpperCase());
  }
}

String greeting() {
  final h = DateTime.now().hour;
  return h < 12 ? 'صباح الخير' : h < 17 ? 'نهارك سعيد' : 'مساء الخير';
}

void snack(BuildContext context, String msg) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(msg)));
}
