import io, sys
p = r'D:\Mithaq\mithaq_portal\lib\theme.dart'
s = io.open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    if b in s: return
    if s.count(a) != 1: print('ANCHOR', a[:60]); sys.exit(1)
    s = s.replace(a, b, 1)
rep("  static const bodyFont = 'IBM Plex Sans Arabic';", "  static const bodyFont = 'Cairo'; // خط واجهات التطبيق")
rep("      GoogleFonts.getFont('Amiri', fontSize: size, fontWeight: weight, color: color, height: 1.3);",
    "      GoogleFonts.getFont('Cairo', fontSize: size, fontWeight: weight == FontWeight.w700 ? FontWeight.w800 : weight, color: color, height: 1.35);\n"
    "  /// النصوص القانونية والعقود: Traditional Arabic على ويندوز، وAmiri (نسخ مشابه) على الهاتف\n"
    "  static TextStyle doc(double size, {Color color = ink}) =>\n"
    "      GoogleFonts.getFont('Amiri', fontSize: size, color: color, height: 1.9).copyWith(fontFamilyFallback: const ['Traditional Arabic']);")
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('OK')
