import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// نظام تصميم «ميثاق» لتطبيق الموكل
/// ─ سلّم الخطوط: مأخوذ من Apple HIG (Dynamic Type) ومعايَر للعربية (ارتفاع سطر 1.5 للنصوص، 1.3 للعناوين)
/// ─ المسافات: شبكة 4/8 نقاط (Material 3 / HIG)، وأهداف لمس لا تقل عن 48 نقطة
/// ─ الألوان: كحلي وذهبي هوية المكتب، بتباين WCAG AA على الأقل لكل نص
/// ─ الخط: IBM Plex Sans Arabic مضمّن في التطبيق (لا تحميل من الإنترنت)، وIBM Plex Mono للأرقام والرموز
class MQ {
  // ── الهوية
  static const forest = Color(0xFF0B1B2B); // الكحلي الأساسي
  static const forestDeep = Color(0xFF07131F);
  static const navy2 = Color(0xFF1C2B3D);
  static const pine = Color(0xFF0B1B2B); // لون الإجراءات الأساسية
  static const pineSoft = Color(0xFFE9EDF2);
  static const onGold = Color(0xFFFFFFFF); // النص فوق اللون الأساسي
  static const gold = Color(0xFFC9A55A); // ذهبي للزخرفة والحدود
  static const goldLo = Color(0xFF8B6F3D);
  static const brass = Color(0xFF7A5C24); // ذهبي مقروء على الفاتح (تباين 5.6:1)
  static const brassHi = Color(0xFFE3C98E); // ذهبي مقروء على الكحلي
  static const brassSoft = Color(0xFFF6EEDC);
  // ── الأسطح
  static const ivory = Color(0xFFF1F4F8); // خلفية الشاشات
  static const surface = Color(0xFFFFFFFF); // البطاقات والقوائم
  static const surfaceAlt = Color(0xFFF6F8FB); // الحقول
  static const sunk = Color(0xFFE9EEF4);
  static const line = Color(0xFFE0E6EE); // الحدود والفواصل
  // ── النصوص
  static const ink = Color(0xFF111B27); // أساسي (16:1)
  static const muted = Color(0xFF55606E); // ثانوي (6.4:1)
  static const faint = Color(0xFF7B8491); // ثالثي للتلميحات (4.5:1)
  static const soft = Color(0xFFB8C0CC); // ثانوي فوق الكحلي
  static const mine = Color(0xFF0B1B2B); // فقاعة الموكل
  // ── الحالات
  static const mint = Color(0xFF2E7D5B);
  static const ok = Color(0xFF1E6B4B);
  static const okSoft = Color(0xFFE3F1EA);
  static const warn = Color(0xFF9A5A07);
  static const warnSoft = Color(0xFFFBEED6);
  static const danger = Color(0xFFB42318);
  static const dangerSoft = Color(0xFFFBE7E5);
  static const docBlue = Color(0xFF1D4E89);

  static const goldGradient = LinearGradient(begin: Alignment.centerRight, end: Alignment.centerLeft, colors: [gold, goldLo]);
  static const navyGradient = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [navy2, forest]);
  /// الذهبي اللامع (العنصر المختار في شريط التنقل)
  static const shine = LinearGradient(
      begin: Alignment.topRight,
      end: Alignment.bottomLeft,
      colors: [Color(0xFF8A6420), Color(0xFFD9B45E), Color(0xFFFFF0BF), Color(0xFFD3A94F), Color(0xFF9A7226)],
      stops: [0, .28, .5, .72, 1]);

  // ── الخطوط المضمّنة
  static const bodyFont = 'Plex';
  static const monoFont = 'PlexMono';

  static TextStyle _t(double size, FontWeight w, double h, Color c) =>
      TextStyle(fontFamily: bodyFont, fontSize: size, fontWeight: w, height: h, color: c, letterSpacing: 0);

  /// سلّم الخطوط (أسماء Apple HIG)
  static TextStyle largeTitle({Color color = ink}) => _t(30, FontWeight.w700, 1.25, color);
  static TextStyle title1({Color color = ink}) => _t(24, FontWeight.w700, 1.3, color);
  static TextStyle title2({Color color = ink}) => _t(20, FontWeight.w700, 1.35, color);
  static TextStyle title3({Color color = ink}) => _t(18, FontWeight.w600, 1.4, color);
  static TextStyle headline({Color color = ink}) => _t(16, FontWeight.w600, 1.45, color);
  static TextStyle bodyL({Color color = ink, FontWeight weight = FontWeight.w400}) => _t(16, weight, 1.55, color);
  static TextStyle callout({Color color = ink, FontWeight weight = FontWeight.w400}) => _t(15, weight, 1.5, color);
  static TextStyle subhead({Color color = ink, FontWeight weight = FontWeight.w400}) => _t(14, weight, 1.5, color);
  static TextStyle footnote({Color color = muted, FontWeight weight = FontWeight.w400}) => _t(13, weight, 1.45, color);
  static TextStyle caption({Color color = muted, FontWeight weight = FontWeight.w500}) => _t(12, weight, 1.4, color);

  /// توافق مع الشاشات السابقة: حجم صريح بنفس العائلة
  static TextStyle display(double size, {Color color = ink, FontWeight weight = FontWeight.w700}) =>
      _t(size * .9, weight == FontWeight.w800 ? FontWeight.w700 : weight, 1.3, color);
  static TextStyle body(double size, {Color color = ink, FontWeight weight = FontWeight.w400, double height = 1.5}) =>
      _t(size, weight, height, color);
  static TextStyle mono(double size, {Color color = ink, FontWeight weight = FontWeight.w500, double spacing = 0}) => TextStyle(
      fontFamily: monoFont,
      fontSize: size,
      fontWeight: weight == FontWeight.w700 ? FontWeight.w600 : weight,
      color: color,
      letterSpacing: spacing,
      height: 1.3,
      fontFeatures: const [FontFeature.tabularFigures()]);

  static ThemeData theme() {
    final scheme = ColorScheme.fromSeed(seedColor: forest, brightness: Brightness.light).copyWith(
      primary: forest,
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
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light, colorScheme: scheme, scaffoldBackgroundColor: Colors.transparent, fontFamily: bodyFont);
    OutlineInputBorder border(Color c, [double w = 1]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(R.control), borderSide: BorderSide(color: c, width: w));
    return base.copyWith(
      // العنوان الكبير للصفحة (موسّع) والعنوان المنكمش
      textTheme: base.textTheme.apply(fontFamily: bodyFont, bodyColor: ink, displayColor: ink).copyWith(
            headlineMedium: largeTitle(),
            titleLarge: title3(),
            bodyLarge: bodyL(),
            bodyMedium: subhead(),
            labelLarge: subhead(weight: FontWeight.w600),
          ),
      appBarTheme: AppBarTheme(
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: .5,
          shadowColor: line,
          foregroundColor: ink,
          systemOverlayStyle: SystemUiOverlayStyle.dark,
          centerTitle: false,
          titleTextStyle: title3()),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        isDense: false,
        hintStyle: callout(color: faint),
        labelStyle: subhead(color: muted),
        floatingLabelBehavior: FloatingLabelBehavior.never,
        helperStyle: caption(color: muted, weight: FontWeight.w400),
        errorStyle: caption(color: danger, weight: FontWeight.w500),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: border(line),
        enabledBorder: border(line),
        disabledBorder: border(sunk),
        focusedBorder: border(forest, 1.6),
        errorBorder: border(danger, 1.2),
        focusedErrorBorder: border(danger, 1.6),
        prefixIconColor: muted,
      ),
      filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
              backgroundColor: forest,
              foregroundColor: onGold,
              disabledBackgroundColor: sunk,
              minimumSize: const Size(48, 52),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.control)),
              textStyle: headline())),
      outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
              foregroundColor: forest,
              minimumSize: const Size(48, 52),
              padding: const EdgeInsets.symmetric(horizontal: 18),
              side: const BorderSide(color: line, width: 1.2),
              backgroundColor: surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.control)),
              textStyle: headline())),
      textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(foregroundColor: brass, minimumSize: const Size(48, 44), textStyle: subhead(weight: FontWeight.w600))),
      iconButtonTheme: IconButtonThemeData(style: IconButton.styleFrom(minimumSize: const Size(48, 48), foregroundColor: ink)),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        minVerticalPadding: 10,
        minTileHeight: 56,
        iconColor: muted,
        titleTextStyle: callout(weight: FontWeight.w500),
        subtitleTextStyle: footnote(),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? surface : null),
        trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? ok : null),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
          style: SegmentedButton.styleFrom(
              backgroundColor: surface,
              selectedBackgroundColor: forest,
              selectedForegroundColor: onGold,
              foregroundColor: ink,
              side: const BorderSide(color: line),
              minimumSize: const Size(48, 44),
              textStyle: subhead(weight: FontWeight.w600))),
      snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          backgroundColor: forest,
          contentTextStyle: subhead(color: onGold),
          actionTextColor: brassHi,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.control))),
      dialogTheme: DialogThemeData(
          backgroundColor: surface,
          surfaceTintColor: Colors.transparent,
          titleTextStyle: title3(),
          contentTextStyle: callout(color: muted),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.sheet))),
      dividerTheme: const DividerThemeData(color: line, thickness: 1, space: 1),
      bottomSheetTheme: const BottomSheetThemeData(
          backgroundColor: surface, surfaceTintColor: Colors.transparent, showDragHandle: true, dragHandleColor: line),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
          backgroundColor: forest,
          foregroundColor: onGold,
          extendedTextStyle: headline(color: onGold),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.card))),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: forest, linearTrackColor: sunk),
    );
  }
}

/// شبكة المسافات (4/8)
class Sp {
  static const xs = 4.0, s = 8.0, m = 12.0, l = 16.0, xl = 24.0, xxl = 32.0;
  static const page = 16.0; // الهامش الجانبي للشاشات
}

/// أنصاف الأقطار
class R {
  static const control = 12.0, card = 16.0, sheet = 24.0, pill = 99.0;
}

/// بطاقة بيضاء بحد خفيف (لا ظلال ثقيلة)
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(Sp.l), this.color, this.onTap});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final r = BorderRadius.circular(R.card);
    return Material(
      color: color ?? MQ.surface,
      shape: RoundedRectangleBorder(borderRadius: r, side: const BorderSide(color: MQ.line)),
      clipBehavior: Clip.antiAlias,
      child: onTap == null ? Padding(padding: padding, child: child) : InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
    );
  }
}

/// شارة حالة صغيرة
class Chip2 extends StatelessWidget {
  const Chip2(this.text, {super.key, this.bg = MQ.pineSoft, this.fg = MQ.forest, this.icon, this.mono = false});
  final String text;
  final Color bg, fg;
  final IconData? icon;
  final bool mono;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(R.pill)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 14, color: fg), const SizedBox(width: 4)],
          Flexible(
            child: Text(text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: mono ? MQ.mono(12, color: fg) : MQ.caption(color: fg, weight: FontWeight.w600)),
          ),
        ]),
      );
}

/// شعار الميزان
class Seal extends StatelessWidget {
  const Seal({super.key, this.size = 56, this.color = MQ.brassHi, this.filled = false});
  final double size;
  final Color color;
  final bool filled;
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, color: filled ? MQ.forest : null, border: filled ? null : Border.all(color: color, width: 1.5)),
        child: Icon(Icons.balance, color: color, size: size * .52),
      );
}
