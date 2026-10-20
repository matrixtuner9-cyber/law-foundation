import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// هوية ميثاق المعتمدة (نفس واجهة المحامي «prestige»):
/// خلفية عاجية، كحلي للعناصر الأساسية والأشرطة، ذهبي هادئ للمسات، برونزي للنصوص الذهبية، وخط Cairo
/// (أسماء الثوابت القديمة محفوظة كي تنتقل كل الشاشات للهوية دفعة واحدة)
class MQ {
  // الكحلي: الأشرطة والرؤوس الداكنة (مثل الشريط الجانبي في واجهة المحامي)
  static const forest = Color(0xFF0B182B); // navy
  static const forestDeep = Color(0xFF07111F);
  static const navy2 = Color(0xFF13243A); // navy2
  // اللون الأساسي للأزرار والروابط والتحديد (accent في واجهة المحامي)
  static const pine = Color(0xFF13243A);
  static const pineSoft = Color(0xFFE8E9EA);
  static const onGold = Color(0xFFF9F6EF); // النص فوق اللون الأساسي
  // الذهبي والبرونزي
  static const gold = Color(0xFFD4AF37);
  static const goldLo = Color(0xFFB8863D);
  static const brass = Color(0xFF8B6F47); // bronze: نص ذهبي مقروء على العاجي
  static const brassHi = Color(0xFFD4AF37); // ذهبي على الخلفيات الكحلية
  static const brassSoft = Color(0xFFF1E3C6);
  // الأسطح والنصوص
  static const ivory = Color(0xFFF8F6F0); // خلفية التطبيق
  static const surface = Color(0xFFFFFDF8); // البطاقات
  static const surfaceAlt = Color(0xFFFFFDF8); // الحقول
  static const sunk = Color(0xFFF7EAD0); // شارات داخل البطاقات
  static const ink = Color(0xFF1A1209);
  static const muted = Color(0xFF6F5B3E);
  static const soft = Color(0xFFC9BBA3); // نص ثانوي فوق الكحلي
  static const line = Color(0xFFE6D5B8); // beige
  static const mine = Color(0xFF13243A); // فقاعة الموكل
  // الحالات
  static const mint = Color(0xFF3FA57C);
  static const danger = Color(0xFFDC2626);
  static const dangerSoft = Color(0xFFFBE5E2);
  static const ok = Color(0xFF15803D);
  static const okSoft = Color(0xFFE4F2E8);
  static const warn = Color(0xFFB45309);
  static const warnSoft = Color(0xFFFBEFD6);
  static const docBlue = Color(0xFF2563EB);

  static const goldHi = Color(0xFFE2C46A);
  static const goldGradient =
      LinearGradient(begin: Alignment.topRight, end: Alignment.bottomLeft, colors: [goldHi, gold, goldLo]);
  static const navyGradient = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [navy2, forest]);

  static const bodyFont = 'Cairo';

  /// العناوين بخط Cairo العريض كما في واجهة المحامي (المقاسات معايرة على العناوين السابقة)
  static TextStyle display(double size, {Color color = ink, FontWeight weight = FontWeight.w800}) =>
      GoogleFonts.getFont('Cairo', fontSize: size * .84, fontWeight: weight, color: color, height: 1.4);
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
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light, colorScheme: scheme, scaffoldBackgroundColor: ivory);
    OutlineInputBorder border(Color c, [double w = 1]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: c, width: w));
    return base.copyWith(
      textTheme: base.textTheme.apply(fontFamily: GoogleFonts.getFont(bodyFont).fontFamily, bodyColor: ink, displayColor: ink),
      appBarTheme: AppBarTheme(
          backgroundColor: ivory, surfaceTintColor: Colors.transparent, elevation: 0, foregroundColor: ink,
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
        focusedBorder: border(gold, 1.6),
        errorBorder: border(danger, 1.4),
        focusedErrorBorder: border(danger, 1.8),
      ),
      filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
              backgroundColor: gold,
              foregroundColor: ink,
              disabledBackgroundColor: gold.withValues(alpha: .45),
              disabledForegroundColor: ink.withValues(alpha: .6),
              minimumSize: const Size(0, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              textStyle: body(15, weight: FontWeight.w800))),
      outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
              foregroundColor: brass,
              minimumSize: const Size(0, 48),
              side: const BorderSide(color: gold, width: 1.5),
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

/// زر ذهبي متدرّج (الزر الرئيسي في التصميم الجديد)
class GoldButton extends StatelessWidget {
  const GoldButton({super.key, required this.label, this.onPressed, this.icon, this.busy = false, this.height = 54});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool busy;
  final double height;
  @override
  Widget build(BuildContext context) {
    final on = onPressed != null && !busy;
    return Opacity(
      opacity: on || busy ? 1 : .55,
      child: Material(
        color: Colors.transparent,
        child: Ink(
          height: height,
          decoration: BoxDecoration(
              gradient: MQ.goldGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: MQ.goldLo.withValues(alpha: .35), blurRadius: 22, offset: const Offset(0, 9))]),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: on ? onPressed : null,
            child: Center(
              child: busy
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: MQ.ink))
                  : Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(label, style: MQ.body(16.5, weight: FontWeight.w800, color: MQ.ink, height: 1.2)),
                      if (icon != null) ...[const SizedBox(width: 8), Icon(icon, color: MQ.ink, size: 20)],
                    ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// شعار المكتب داخل ختم كحلي بحلقة ذهبية
class OfficeLogo extends StatelessWidget {
  const OfficeLogo({super.key, this.size = 84});
  final double size;
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const RadialGradient(center: Alignment(0, -.3), colors: [Color(0xFF1B2E47), MQ.forest]),
          border: Border.all(color: MQ.gold, width: size > 50 ? 2 : 1.5),
          boxShadow: size > 50
              ? [
                  BoxShadow(color: MQ.gold.withValues(alpha: .18), spreadRadius: 6),
                  const BoxShadow(color: Color(0x73000000), blurRadius: 30, offset: Offset(0, 10)),
                ]
              : null,
        ),
        child: Image.asset('assets/images/logo.jpg',
            fit: BoxFit.cover,
            cacheWidth: (size * 3).round(),
            errorBuilder: (_, __, ___) => Icon(Icons.balance, color: MQ.gold, size: size * .52)),
      );
}

/// خلفية فوتوغرافية (صورة التمثال) مع تدرّج كحلي يضمن وضوح النص
class PhotoBackdrop extends StatelessWidget {
  const PhotoBackdrop(
      {super.key, required this.asset, this.alignment = Alignment.center, this.shade = .45, this.opacity = 1});
  final String asset;
  final Alignment alignment;
  final double shade;

  /// شفافية الصورة نفسها (أقل = صورة أهدأ والكحلي أوضح)
  final double opacity;
  @override
  Widget build(BuildContext context) => Stack(fit: StackFit.expand, children: [
        const DecoratedBox(decoration: BoxDecoration(gradient: MQ.navyGradient)),
        Image.asset(asset,
            fit: BoxFit.cover,
            alignment: alignment,
            opacity: AlwaysStoppedAnimation(opacity),
            cacheWidth: (MediaQuery.sizeOf(context).width * MediaQuery.devicePixelRatioOf(context)).round().clamp(400, 1200),
            errorBuilder: (_, __, ___) => const SizedBox()),
        DecoratedBox(
            decoration: BoxDecoration(
                gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [
          MQ.forest.withValues(alpha: shade * .7),
          MQ.forest.withValues(alpha: shade * .35),
          MQ.forest.withValues(alpha: shade),
        ]))),
      ]);
}
