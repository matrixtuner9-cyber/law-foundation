import re,io,os,glob
root=r'D:\Mithaq\mithaq_portal'
lib=os.path.join(root,'lib')
def rd(p): return io.open(p,encoding='utf-8').read()
def wr(p,s): io.open(p,'w',encoding='utf-8',newline='\n').write(s)
# 1) إصلاح const قبل ثوابت MQ
for p in glob.glob(lib+'/*.dart'):
    s=rd(p); n=re.sub(r'\bconst (MQ\.(?:soft|navy2|surfaceAlt|line|danger)\b)',r'\1',s)
    if n!=s: wr(p,n); print('fixed const',os.path.basename(p))
# 2) شاشة الدخول
p=os.path.join(lib,'main.dart'); s=rd(p)
if 'login_scene.dart' not in s:
    s=s.replace("import 'theme.dart';","import 'login_scene.dart';\nimport 'theme.dart';",1)
a=s.index("        AnimatedBuilder(\n          animation: glow,")
mk="alpha: .06))),\n"
b=s.index(mk,a)+len(mk)
s=s[:a]+"        const Positioned.fill(child: JusticeScene()),\n"+s[b:]
assert 'const Seal(size: 86),' in s
s=s.replace('const Seal(size: 86),','const ScalesOfJustice(size: 230),',1)
s,c=re.subn(r"color: MQ\.surface,(\s*)borderRadius: BorderRadius\.circular\(26\),",r"color: MQ.surface.withValues(alpha: .9),\1border: Border.all(color: MQ.pine.withValues(alpha: .35)),\1borderRadius: BorderRadius.circular(26),",s,count=1)
print('card border',c)
wr(p,s)
# 3) الأصول
os.makedirs(os.path.join(root,'assets','images'),exist_ok=True)
io.open(os.path.join(root,'assets','images','README.txt'),'w',encoding='utf-8').write('ضع هنا login_bg.jpg (صورة خلفية شاشة الدخول) وسيظهر تلقائياً تحت طبقات التصميم.\n')
p=os.path.join(root,'pubspec.yaml'); s=rd(p)
if 'assets/images/' not in s:
    s=s.replace("    - assets/chime.wav","    - assets/chime.wav\n    - assets/images/",1); wr(p,s)
print('DONE')
