import 'dart:io';

/// مسار مؤقت لحفظ التسجيل الصوتي على الهاتف أو سطح المكتب
Future<String> tempPath(String ext) async => '${Directory.systemTemp.path}/mq_${DateTime.now().millisecondsSinceEpoch}.$ext';
