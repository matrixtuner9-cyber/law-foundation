/// على الويب تتولى إشعارات المتصفح (Web Push) التنبيه، فلا خدمة خلفية هنا
Future<void> initBackground() async {}
Future<void> setForeground(bool v) async {}
Future<bool> ensureNotify() async => true;
Future<bool> notifyEnabled() async => true;
Future<void> testNotify() async {}
Future<bool> powerOk() async => true;
Future<void> powerRequest() async {}
Future<bool> openAutostart() async => false;
Future<String> phoneMaker() async => '';
