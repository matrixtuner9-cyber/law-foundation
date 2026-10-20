/// منصات بلا إشعارات دفع من هذا النوع
Future<String> enablePush(String code) async => 'unsupported';
String pushStatus() => 'unsupported';
Future<String> pushRefresh() async => 'unsupported';
Future<void> pushResume(String code) async {}
Future<void> pushForget(String code) async {}
