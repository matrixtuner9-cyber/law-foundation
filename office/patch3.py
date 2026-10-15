import io,re
root=r'D:\Mithaq\mithaq_portal'
def rd(p): return io.open(p,encoding='utf-8').read()
def wr(p,s): io.open(p,'w',encoding='utf-8',newline='\n').write(s)
# main.dart: العنوان المحفوظ يُعتمد فقط إن حُفظ لنفس نسخة البناء
p=root+r'\lib\main.dart'; s=rd(p)
a="    final api = p.getString('api');\n    if (api != null && api.isNotEmpty && !kIsWeb) Api.base = api;"
assert s.count(a)==1,'main anchor'
s=s.replace(a,"""    final api = p.getString('api');
    const built = String.fromEnvironment('API', defaultValue: '');
    if (api != null && api.isNotEmpty && !kIsWeb && (built.isEmpty || p.getString('api_for') == built)) {
      Api.base = api;
    } else if (api != null) {
      await p.remove('api'); // عنوان قديم من نسخة سابقة
    }""")
b="    await p.setString('api', url);"
assert s.count(b)==1,'save anchor'
s=s.replace(b,b+"\n    await p.setString('api_for', const String.fromEnvironment('API', defaultValue: ''));")
wr(p,s)
# bg_io.dart
p=root+r'\lib\platform\bg_io.dart'; s=rd(p)
c="    final base = p.getString('api') ?? const String.fromEnvironment('API', defaultValue: 'http://10.0.2.2:8080');"
assert s.count(c)==1,'bg anchor'
s=s.replace(c,"""    const built = String.fromEnvironment('API', defaultValue: 'http://10.0.2.2:8080');
    final saved = p.getString('api');
    final base = (saved != null && p.getString('api_for') == built) ? saved : built;""")
wr(p,s)
# منع استرجاع الإعدادات القديمة تلقائياً بعد إعادة التثبيت
p=root+r'\android\app\src\main\AndroidManifest.xml'; s=rd(p)
if 'android:allowBackup' not in s:
    s=s.replace('<application','<application\n        android:allowBackup="false"\n        android:fullBackupContent="false"',1)
    wr(p,s)
print('OK')
