/// على الويب تتولى إشعارات المتصفح (Web Push) التنبيه، فلا خدمة خلفية هنا
Future<void> initBackground() async {}
Future<void> setForeground(bool v) async {}
Future<bool> ensureNotify() async => true;
Future<bool> notifyEnabled() async => true;
Future<void> testNotify() async {}
