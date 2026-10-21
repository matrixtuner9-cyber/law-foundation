import 'package:flutter/material.dart';
import 'theme.dart';

/// مكوّنات الواجهة الموحّدة: صفحة بعنوان كبير، أقسام قوائم مجمّعة، صفوف معلومات وتنقل، حقول إدخال، حالة فارغة

/// صفحة بعنوان كبير ينكمش عند التمرير (iOS Large Title / Material 3 large app bar)
class LargeTitlePage extends StatelessWidget {
  const LargeTitlePage({super.key, required this.title, required this.slivers, this.actions, this.fab, this.leading, this.bottomPad = Sp.xxl});
  final String title;
  final List<Widget> slivers;
  final List<Widget>? actions;
  final Widget? fab;
  final Widget? leading;
  final double bottomPad;
  @override
  Widget build(BuildContext context) => Scaffold(
        floatingActionButton: fab,
        body: CustomScrollView(slivers: [
          SliverAppBar.large(
            title: Text(title),
            leading: leading,
            actions: actions,
            expandedHeight: 120,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
          ),
          ...slivers,
          SliverToBoxAdapter(child: SizedBox(height: bottomPad)),
        ]),
      );
}

/// عنوان قسم صغير فوق مجموعة
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.trailing, this.padding = const EdgeInsets.fromLTRB(Sp.page + 4, Sp.xl, Sp.page + 4, Sp.s)});
  final String text;
  final Widget? trailing;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Padding(
        padding: padding,
        child: Row(children: [
          Expanded(child: Text(text, style: MQ.footnote(weight: FontWeight.w600))),
          if (trailing != null) trailing!,
        ]),
      );
}

/// مجموعة صفوف داخل بطاقة واحدة بفواصل (قائمة مجمّعة)
class Group extends StatelessWidget {
  const Group({super.key, required this.children, this.footer, this.margin = const EdgeInsets.symmetric(horizontal: Sp.page)});
  final List<Widget> children;
  final String? footer;
  final EdgeInsets margin;
  @override
  Widget build(BuildContext context) {
    final items = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) items.add(const Divider(indent: Sp.l, endIndent: Sp.l));
      items.add(children[i]);
    }
    return Padding(
      padding: margin,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Material(
          color: MQ.surface,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.card), side: const BorderSide(color: MQ.line)),
          child: Column(children: items),
        ),
        if (footer != null)
          Padding(padding: const EdgeInsets.fromLTRB(4, Sp.s, 4, 0), child: Text(footer!, style: MQ.footnote())),
      ]),
    );
  }
}

/// أيقونة داخل مربع ملوّن خفيف (مقاس موحّد)
class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.color = MQ.forest, this.size = 40});
  final IconData icon;
  final Color color;
  final double size;
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(R.control - 2)),
        child: Icon(icon, color: color, size: size * .55),
      );
}

/// صف معلومة: عنوان صغير وقيمة
class InfoRow extends StatelessWidget {
  const InfoRow({super.key, required this.label, required this.value, this.icon, this.mono = false, this.onTap, this.trailing});
  final String label, value;
  final IconData? icon;
  final bool mono;
  final VoidCallback? onTap;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 56),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Sp.l, vertical: 10),
            child: Row(children: [
              if (icon != null) ...[Icon(icon, size: 22, color: MQ.muted), const SizedBox(width: Sp.m)],
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(label, style: MQ.footnote()),
                  const SizedBox(height: 2),
                  Text(value.isEmpty ? '—' : value,
                      textDirection: mono ? TextDirection.ltr : null,
                      textAlign: TextAlign.start,
                      style: mono ? MQ.mono(15) : MQ.callout(weight: FontWeight.w500)),
                ]),
              ),
              if (trailing != null) trailing! else if (onTap != null) const Icon(Icons.chevron_left_rounded, color: MQ.faint),
            ]),
          ),
        ),
      );
}

/// صف تنقل أو إجراء: أيقونة، عنوان، وصف، وسهم أو عنصر جانبي
class NavRow extends StatelessWidget {
  const NavRow({super.key, required this.title, this.subtitle, this.icon, this.iconColor = MQ.forest, this.onTap, this.trailing, this.destructive = false});
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Color iconColor;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool destructive;
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Sp.l, vertical: 10),
            child: Row(children: [
              if (icon != null) ...[IconTile(icon!, color: destructive ? MQ.danger : iconColor, size: 36), const SizedBox(width: Sp.m)],
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(title, style: MQ.callout(weight: FontWeight.w600, color: destructive ? MQ.danger : MQ.ink)),
                  if (subtitle != null) Text(subtitle!, style: MQ.footnote()),
                ]),
              ),
              if (trailing != null) trailing! else if (onTap != null && !destructive) const Icon(Icons.chevron_left_rounded, color: MQ.faint),
            ]),
          ),
        ),
      );
}

/// حقل إدخال موحّد: عنوان فوق الحقل، ونص مساعد أو خطأ تحته
class AppField extends StatelessWidget {
  const AppField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.helper,
    this.error,
    this.icon,
    this.keyboardType,
    this.ltr = false,
    this.mono = false,
    this.enabled = true,
    this.onSubmitted,
    this.textInputAction,
    this.maxLines = 1,
    this.textAlign = TextAlign.start,
    this.autofocus = false,
    this.big = false,
  });
  final String label;
  final TextEditingController controller;
  final String? hint, helper, error;
  final IconData? icon;
  final TextInputType? keyboardType;
  final bool ltr, mono, enabled, autofocus, big;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;
  final int maxLines;
  final TextAlign textAlign;
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 6, right: 2, left: 2),
          child: Text(label, style: MQ.subhead(weight: FontWeight.w600)),
        ),
        TextField(
          controller: controller,
          enabled: enabled,
          autofocus: autofocus,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          maxLines: maxLines,
          autocorrect: !mono,
          textAlign: textAlign,
          textDirection: ltr ? TextDirection.ltr : null,
          textCapitalization: mono ? TextCapitalization.characters : TextCapitalization.none,
          style: mono ? MQ.mono(big ? 20 : 16, spacing: big ? 2 : 0) : MQ.bodyL(),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: mono ? MQ.mono(big ? 20 : 16, color: MQ.faint, spacing: big ? 2 : 0) : null,
            errorText: error,
            helperText: error == null ? helper : null,
            helperMaxLines: 3,
            errorMaxLines: 3,
            prefixIcon: icon == null ? null : Icon(icon, size: 22),
            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: big ? 16 : 14),
          ),
        ),
      ]);
}

/// حالة فارغة: أيقونة، عنوان، شرح، وإجراء اختياري
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.message, this.action});
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: Sp.xl, vertical: Sp.xl),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(color: MQ.sunk, shape: BoxShape.circle),
            child: Icon(icon, color: MQ.muted, size: 30),
          ),
          const SizedBox(height: Sp.m),
          Text(title, textAlign: TextAlign.center, style: MQ.headline()),
          if (message != null) ...[const SizedBox(height: Sp.xs), Text(message!, textAlign: TextAlign.center, style: MQ.subhead(color: MQ.muted))],
          if (action != null) ...[const SizedBox(height: Sp.l), action!],
        ]),
      );
}

/// ألوان حالة القضية
(Color, Color) caseStatusColors(String s) {
  if (s.contains('منته') || s.contains('مغلق')) return (MQ.sunk, MQ.muted);
  if (s.contains('تنفيذ')) return (MQ.warnSoft, MQ.warn);
  if (s.contains('موقوف') || s.contains('معلق')) return (MQ.dangerSoft, MQ.danger);
  return (MQ.okSoft, MQ.ok);
}
