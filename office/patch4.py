import io,re
lib=r'D:\Mithaq\mithaq_portal\lib'
def rd(p): return io.open(p,encoding='utf-8').read()
def wr(p,s): io.open(p,'w',encoding='utf-8',newline='\n').write(s)
# bg_io: دوال الإذن والتجربة + فحص أسرع (كل 10 ثوانٍ)
p=lib+r'\platform\bg_io.dart'; s=rd(p)
a="Timer.periodic(const Duration(seconds: 15), (_) => _poll(n));"
assert s.count(a)==1,'timer'
s=s.replace(a,"Timer.periodic(const Duration(seconds: 10), (_) => _poll(n));")
s+='''

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
          color: const Color(0xFFC9A24B)),
    ),
  );
}
'''
s=s.replace("color: const Color(0xFF0D5848),","color: const Color(0xFFC9A24B),")
wr(p,s)
# main.dart: طلب الإذن بعد ظهور الواجهة
p=lib+r'\main.dart'; s=rd(p)
a="    setForeground(true);\n  }"
assert s.count(a)==1,'fg'
s=s.replace(a,"    setForeground(true);\n    WidgetsBinding.instance.addPostFrameCallback((_) => ensureNotify());\n  }")
wr(p,s)
# settings.dart: لوحة التنبيهات
p=lib+r'\settings.dart'; s=rd(p)
s,c=re.subn(r"            Row\(children: \[\n              const Icon\(Icons\.notifications_active.*?MQ\.body\(13\.5\)\)\),\n            \]\),\n","            const NotifyPanel(),\n",s,count=1,flags=re.S)
assert c==1,'settings'
s=s.replace("import 'push.dart';","import 'notify_panel.dart';\nimport 'push.dart';",1)
wr(p,s)
print('OK')
