import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// الهوية الفخمة لميثاق: كحلي وأسود وفحمي مع لمسات ذهبية ونحاسية
/// (أسماء الثوابت القديمة محفوظة كي تنتقل كل الشاشات للهوية الجديدة دفعة واحدة)
class MQ {
  static const forest = Color(0xFF0F1B33); // كحلي ملكي
  static const forestDeep = Color(0xFF050709); // أسود
  static const navy2 = Color(0xFF16264A);
  static const pine = Color(0xFFC9A24B); // ذهبي (اللون الأساسي)
  static const pineSoft = Color(0xFF2A2315); // ذهبي خافت
  static const goldLo = Color(0xFFB8923A);
  static const mint = Color(0xFF4CB38A);
  static const brass = Color(0xFFC77B43); // نحاسي
  static const brassHi = Color(0xFFE6C77A); // ذهبي لامع
  static const brassSoft = Color(0xFF2B2415);
  static const ivory = Color(0xFF090D16); // خلفية التطبيق
  static const surface = Color(0xFF121926);
  static const surfaceAlt = Color(0xFF1A2335);
  static const ink = Color(0xFFF3EEE2);
  static const muted = Color(0xFF8D96A8);
  static const soft = Color(0xFFA9B3C6);
  static const line = Color(0xFF252F45);
  static const mine = Color(0xFF1F3A6B); // فقاعة الموكل
  static const onGold = Color(0xFF0A0E17);
  static const danger = Color(0xFFE5605A);
  static const dangerSoft = Color(0xFF2D1718);
  static const ok = Color(0xFF4CB38A);
  static const okSoft = Color(0xFF12291F);
  static const warn = Color(0xFFE6C77A);
  static const warnSoft = Color(0xFF2B2415);
  static const docBlue = Color(0xFF6B93F0);

  static const goldGradient = LinearGradient(begin: Alignment.centerRight, end: Alignment.centerLeft, colors: [brassHi, goldLo]);
  static const navyGradient = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [navy2, forestDeep]);

  static const bodyFont = 'IBM Plex Sans Arabic';

  static TextStyle display(double size, {Color color = ink, FontWeight weight = FontWeight.w700}) =>
      GoogleFonts.getFont('Amiri', fontSize: size, fontWeight: weight, color: color, height: 1.3);
  static TextStyle body(double size, {Color color = ink, FontWeight weight = FontWeight.w400, double height = 1.55}) =>
      GoogleFonts.getFont(bodyFont, fontSize: size, fontWeight: weight, color: color, height: height);
  static TextStyle mono(double size, {Color color = ink, FontWeight weight = FontWeight.w500, double spacing = 0}) =>
      GoogleFonts.getFont('IBM Plex Mono', fontSize: size, fontWeight: weight, color: color, letterSpacing: spacing,
          fontFeatures: const [FontFeature.tabularFigures()]);

  static ThemeData theme() {
    final scheme = ColorScheme.fromSeed(seedColor: pine, brightness: Brightness.dark).copyWith(
      primary: pine,
      onPrimary: onGold,
      secondary: brass,
      surface: surface,
      onSurface: ink,
      surfaceContainerHighest: surfaceAlt,
      outline: line,
      error: danger,
    );
    final base = ThemeData(useMaterial3: true, brightness: Brightness.dark, colorScheme: scheme, scaffoldBackgroundColor: ivory);
    OutlineInputBorder border(Color c, [double w = 1]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: c, width: w));
    return base.copyWith(
      textTheme: base.textTheme.apply(fontFamily: GoogleFonts.getFont(bodyFont).fontFamily, bodyColor: ink, displayColor: ink),
      appBarTheme: AppBarTheme(
          backgroundColor: ivory, surfaceTintColor: Colors.transparent, elevation: 0, foregroundColor: ink,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          centerTitle: false, titleTextStyle: display(26, color: brassHi)),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: pineSoft,
        surfaceTintColor: Colors.transparent,
        height: 70,
        labelTextStyle: WidgetStateProperty.resolveWith((s) => body(12,
            weight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: s.contains(WidgetState.selected) ? pine : muted)),
        iconTheme: WidgetStateProperty.resolveWith(
            (s) => IconThemeData(color: s.contains(WidgetState.selected) ? pine : muted, size: 24)),
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
          backgroundColor: surfaceAlt,
          contentTextStyle: body(14, color: ink),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: line))),
      dialogTheme: DialogThemeData(backgroundColor: surface, surfaceTintColor: Colors.transparent),
      dividerColor: line,
      bottomSheetTheme: const BottomSheetThemeData(backgroundColor: surface, surfaceTintColor: Colors.transparent),
    );
  }
}

/// بطاقة داكنة بحافة رفيعة
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
          boxShadow: const [BoxShadow(color: Color(0x66000000), blurRadius: 18, offset: Offset(0, 6))]),
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
