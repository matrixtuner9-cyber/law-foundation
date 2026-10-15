import 'dart:js_interop';

@JS('mqPush.enable')
external JSPromise<JSString> _enable(JSString code);

@JS('mqPush.status')
external JSString _status();

/// يطلب إذن الإشعارات ويسجّل هذا الجهاز لدى المكتب لاستقبال التنبيهات حتى والتطبيق مغلق
Future<String> enablePush(String code) async {
  try {
    return (await _enable(code.toJS).toDart).toDart;
  } catch (_) {
    return 'error';
  }
}

/// granted | default | denied | unsupported
String pushStatus() {
  try {
    return _status().toDart;
  } catch (_) {
    return 'unsupported';
  }
}
