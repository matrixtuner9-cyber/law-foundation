import io
p = r'D:\Mithaq\mithaq_portal\lib\theme.dart'
s = io.open(p, encoding='utf-8').read()
s = s.replace("  static const bodyFont = 'Cairo'; // خط واجهات التطبيق", "  static const bodyFont = 'IBM Plex Sans Arabic';", 1)
s = s.replace("      GoogleFonts.getFont('Cairo', fontSize: size, fontWeight: weight == FontWeight.w700 ? FontWeight.w800 : weight, color: color, height: 1.35);\n"
              "  /// النصوص القانونية والعقود: Traditional Arabic على ويندوز، وAmiri (نسخ مشابه) على الهاتف\n"
              "  static TextStyle doc(double size, {Color color = ink}) =>\n"
              "      GoogleFonts.getFont('Amiri', fontSize: size, color: color, height: 1.9).copyWith(fontFamilyFallback: const ['Traditional Arabic']);",
              "      GoogleFonts.getFont('Amiri', fontSize: size, fontWeight: weight, color: color, height: 1.3);", 1)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('REVERTED', 'Cairo' not in s)
