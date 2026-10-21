import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// هوية ميثاق المعتمدة (نفس واجهة المحامي «prestige»):
/// خلفية عاجية، كحلي للعناصر الأساسية والأشرطة، ذهبي هادئ للمسات، برونزي للنصوص الذهبية، وخط Cairo
/// (أسماء الثوابت القديمة محفوظة كي تنتقل كل الشاشات للهوية دفعة واحدة)
class MQ {
  // الكحلي: الأشرطة والرؤوس الداكنة (مثل الشريط الجانبي في واجهة المحامي)
  static const forest = Color(0xFF0B1B2B); // navy
  static const forestDeep = Color(0xFF07131F);
  static const navy2 = Color(0xFF1F2D3D); // navy2
  // اللون الأساسي للأزرار والروابط والتحديد (accent في واجهة المحامي)
  static const pine = Color(0xFF1F2D3D);
  static const pineSoft = Color(0xFFE8E9EA);
  static const onGold = Color(0xFFF9F6EF); // النص فوق اللون الأساسي
  // الذهبي والبرونزي
  static const gold = Color(0xFFC9A55A);
  static const goldLo = Color(0xFF8B6F3D);
  static const brass = Color(0xFF7A5F2F); // bronze: نص ذهبي مقروء على العاجي
  static const brassHi = Color(0xFFE3C98E); // ذهبي على الخلفيات الكحلية
  static const brassSoft = Color(0xFFF7ECD8);
  // الأسطح والنصوص
  static const ivory = Color(0xFFF6F2EA); // خلفية التطبيق (تحت الرخام)
  static const surface = Color(0xFFFFFFFF); // البطاقات
  static const surfaceAlt = Color(0xFFF9F6EF); // الحقول
  static const sunk = Color(0xFFF3ECDF); // شارات داخل البطاقات
  static const ink = Color(0xFF111B27);
  static const muted = Color(0xFF5C6470);
  static const soft = Color(0xFFB7BFCB); // نص ثانوي فوق الكحلي
  static const line = Color(0xFFE8DDC9); // beige
  static const mine = Color(0xFF1F2D3D); // فقاعة الموكل
  // الحالات
  static const mint = Color(0xFF3FA57C);
  static const danger = Color(0xFFDC2626);
  static const dangerSoft = Color(0xFFFBE5E2);
  static const ok = Color(0xFF15803D);
  static const okSoft = Color(0xFFE4F2E8);
  static const warn = Color(0xFFB45309);
  static const warnSoft = Color(0xFFFBEFD6);
  static const docBlue = Color(0xFF2563EB);

  static const goldGradient = LinearGradient(begin: Alignment.centerRight, end: Alignment.centerLeft, colors: [gold, goldLo]);
  static const navyGradient = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [navy2, forest]);

  /// الذهبي اللامع (شريط الأدوات والعناصر المختارة)
  static const shine = LinearGradient(
      begin: Alignment.topRight,
      end: Alignment.bottomLeft,
      colors: [Color(0xFF8A6420), Color(0xFFD9B45E), Color(0xFFFFF0BF), Color(0xFFD3A94F), Color(0xFF9A7226)],
      stops: [0, .28, .5, .72, 1]);

  /// خلفيات الرخام: عاجي بعروق ذهبية للصفحات، وكحلي بعروق ذهبية للأسطح الداكنة
  static const marbleIvory = AssetImage('assets/images/marble-ivory.jpg');
  static const marbleNavy = AssetImage('assets/images/marble-navy.jpg');
  static BoxDecoration stone({bool navy = false, double radius = 0, bool border = true}) => BoxDecoration(
        color: navy ? forest : ivory,
        image: DecorationImage(image: navy ? marbleNavy : marbleIvory, fit: BoxFit.cover),
        borderRadius: radius > 0 ? BorderRadius.circular(radius) : null,
        border: border && navy ? Border.all(color: gold.withValues(alpha: .45)) : null,
        boxShadow: navy && radius > 0 ? const [BoxShadow(color: Color(0x470B1B2B), blurRadius: 30, offset: Offset(0, 14))] : null,
      );

  static const bodyFont = 'IBM Plex Sans Arabic';

  /// العناوين والأسماء بخط «أميري» المحرف (هيبة الوثيقة القانونية)، والواجهة بخط IBM Plex Sans Arabic
  static TextStyle display(double size, {Color color = ink, FontWeight weight = FontWeight.w700}) =>
      GoogleFonts.getFont('Amiri', fontSize: size * .95, fontWeight: weight == FontWeight.w800 ? FontWeight.w700 : weight, color: color, height: 1.3);
  static TextStyle body(double size, {Color color = ink, FontWeight weight = FontWeight.w400, double height = 1.55}) =>
      GoogleFonts.getFont(bodyFont, fontSize: size, fontWeight: weight, color: color, height: height);
  static TextStyle mono(double size, {Color color = ink, FontWeight weight = FontWeight.w500, double spacing = 0}) =>
      GoogleFonts.getFont('IBM Plex Mono', fontSize: size, fontWeight: weight, color: color, letterSpacing: spacing,
          fontFeatures: const [FontFeature.tabularFigures()]);

  static ThemeData theme() {
    final scheme = ColorScheme.fromSeed(seedColor: forest, brightness: Brightness.light).copyWith(
      primary: pine,
      onPrimary: onGold,
      secondary: gold,
      onSecondary: forest,
      surface: surface,
      onSurface: ink,
      onSurfaceVariant: muted,
      surfaceContainerLowest: surface,
      surfaceContainerLow: surface,
      surfaceContainer: surface,
      surfaceContainerHigh: surface,
      surfaceContainerHighest: surfaceAlt,
      outline: line,
      outlineVariant: line,
      error: danger,
    );
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light, colorScheme: scheme, scaffoldBackgroundColor: Colors.transparent);
    OutlineInputBorder border(Color c, [double w = 1]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: c, width: w));
    return base.copyWith(
      textTheme: base.textTheme.apply(fontFamily: GoogleFonts.getFont(bodyFont).fontFamily, bodyColor: ink, displayColor: ink),
      appBarTheme: AppBarTheme(
          backgroundColor: Colors.transparent, surfaceTintColor: Colors.transparent, elevation: 0, scrolledUnderElevation: 0, foregroundColor: ink,
          systemOverlayStyle: SystemUiOverlayStyle.dark,
          centerTitle: false, titleTextStyle: display(26, color: forest)),
      // شريط التنقل كحلي بلمسة ذهبية مثل الشريط الجانبي في واجهة المحامي
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: forest,
        indicatorColor: navy2,
        surfaceTintColor: Colors.transparent,
        height: 70,
        labelTextStyle: WidgetStateProperty.resolveWith((s) => body(12,
            weight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: s.contains(WidgetState.selected) ? gold : soft)),
        iconTheme: WidgetStateProperty.resolveWith(
            (s) => IconThemeData(color: s.contains(WidgetState.selected) ? gold : soft, size: 24)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceAlt,
        hintStyle: body(14, color: muted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: border(line),
        enabledBorder: border(line),
        focusedBorder: border(pine, 1.8),
        errorBorder: border(danger, 1.4),
        focusedErrorBorder: border(danger, 1.8),
      ),
      filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
              backgroundColor: pine,
              foregroundColor: onGold,
              minimumSize: const Size(0, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              textStyle: body(15, weight: FontWeight.w700))),
      outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
              foregroundColor: pine,
              minimumSize: const Size(0, 48),
              side: const BorderSide(color: pine),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              textStyle: body(14, weight: FontWeight.w700))),
      textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: pine)),
      snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          backgroundColor: forest,
          contentTextStyle: body(14, color: onGold),
          actionTextColor: gold,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14), side: BorderSide(color: gold.withValues(alpha: .35)))),
      dialogTheme: DialogThemeData(backgroundColor: surface, surfaceTintColor: Colors.transparent),
      dividerColor: line,
      bottomSheetTheme: const BottomSheetThemeData(backgroundColor: surface, surfaceTintColor: Colors.transparent),
    );
  }
}

/// بطاقة عاجية بحافة بيج وظل خفيف (مثل .panel في واجهة المحامي)
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.color, this.onTap});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
          color: color ?? MQ.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: MQ.line),
          boxShadow: const [
            BoxShadow(color: Color(0x080B1B2B), blurRadius: 0, offset: Offset(0, 1)),
            BoxShadow(color: Color(0x0F0B1B2B), blurRadius: 24, offset: Offset(0, 8)),
          ]),
      child: child,
    );
    if (onTap == null) return box;
    return Material(
        color: Colors.transparent,
        child: InkWell(borderRadius: BorderRadius.circular(20), onTap: onTap, child: box));
  }
}

/// شارة صغيرة ملونة
class Chip2 extends StatelessWidget {
  const Chip2(this.text, {super.key, this.bg = MQ.pineSoft, this.fg = MQ.pine, this.icon, this.mono = false});
  final String text;
  final Color bg, fg;
  final IconData? icon;
  final bool mono;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 14, color: fg), const SizedBox(width: 4)],
          Text(text,
              style: mono ? MQ.mono(12, color: fg) : MQ.body(12, color: fg, weight: FontWeight.w600, height: 1.4)),
        ]),
      );
}

/// ختم الميزان
class Seal extends StatelessWidget {
  const Seal({super.key, this.size = 56, this.color = MQ.brassHi});
  final double size;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: color, width: 1.5)),
        child: Icon(Icons.balance, color: color, size: size * .52),
      );
}
