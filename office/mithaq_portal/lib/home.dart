import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'store.dart';
import 'push.dart';
import 'theme.dart';
import 'util.dart';

typedef GoTo = void Function(int i, {String? action});

class HomeTab extends StatelessWidget {
  const HomeTab({super.key, required this.onGo});
  final GoTo onGo;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final next = store.nextHearing;
        final fromLawyer = store.msgs.where((m) => !m.mine).toList().reversed.take(3).toList();
        return RefreshIndicator(
          color: MQ.pine,
          onRefresh: () => store.load(),
          child: CustomScrollView(slivers: [
            SliverToBoxAdapter(child: _Hero(next: next, onGo: onGo)),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              sliver: SliverToBoxAdapter(child: _Kpis(next: next, onGo: onGo)),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
              sliver: SliverToBoxAdapter(child: _QuickActions(onGo: onGo)),
            ),
            const SliverPadding(padding: EdgeInsets.fromLTRB(16, 14, 16, 0), sliver: SliverToBoxAdapter(child: PushPrompt())),
            _title('قضاياي', '${store.cases.length}', () => onGo(1)),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList.separated(
                itemCount: store.cases.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => CaseSummary(kase: store.cases[i], onTap: () => onGo(1)),
              ),
            ),
            if (fromLawyer.isNotEmpty) ...[
              _title('من المحامي', '', () => onGo(2)),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Panel(
                    padding: EdgeInsets.zero,
                    onTap: () => onGo(2),
                    child: Column(children: [
                      for (final (i, m) in fromLawyer.indexed) ...[
                        if (i > 0) const Divider(height: 1),
                        ListTile(
                          leading: CircleAvatar(
                              backgroundColor: m.seen ? MQ.pineSoft : MQ.pine,
                              child: Icon(
                                  m.type == 'notice'
                                      ? Icons.notifications_active_outlined
                                      : m.type == 'voice'
                                      ? Icons.mic
                                      : m.type == 'image'
                                          ? Icons.image_outlined
                                          : m.type == 'file'
                                              ? Icons.description_outlined
                                              : Icons.chat_bubble_outline,
                                  size: 18,
                                  color: m.seen ? MQ.pine : MQ.onGold)),
                          title: Text(
                              m.type == 'voice'
                                  ? 'رسالة صوتية · ${mmss(m.dur)}'
                                  : m.type == 'text' || m.type == 'notice'
                                      ? m.text
                                      : (m.name ?? 'مرفق'),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: MQ.body(14, weight: m.seen ? FontWeight.w400 : FontWeight.w700)),
                          subtitle: Text('${relDay(m.time)} · ${hhmm(m.time)}', style: MQ.body(12, color: MQ.muted)),
                        ),
                      ],
                    ]),
                  ),
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 28)),
          ]),
        );
      },
    );
  }

  Widget _title(String t, String n, VoidCallback onMore) => SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 26, 12, 10),
        sliver: SliverToBoxAdapter(
          child: Row(children: [
            Text(t, style: MQ.display(24)),
            if (n.isNotEmpty) ...[const SizedBox(width: 8), Chip2(n, bg: MQ.line, fg: MQ.muted)],
            const Spacer(),
            TextButton(onPressed: onMore, child: Text('عرض الكل', style: MQ.body(13, color: MQ.pine, weight: FontWeight.w600))),
          ]),
        ),
      );
}

/* ── رأس الشاشة الداكن مع العدّاد ── */
class _Hero extends StatelessWidget {
  const _Hero({required this.next, required this.onGo});
  final ({Map<String, dynamic> kase, Map<String, dynamic> h, DateTime t})? next;
  final GoTo onGo;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return AnnotatedRegion<SystemUiOverlayStyle>(value: SystemUiOverlayStyle.light, child: Container(
      clipBehavior: Clip.antiAlias,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
        color: MQ.forest,
      ),
      child: Stack(children: [
        const Positioned.fill(
            child: PhotoBackdrop(asset: 'assets/images/hero.jpg', alignment: Alignment.centerLeft, shade: .78)),
        Padding(
          padding: EdgeInsets.fromLTRB(20, top + 18, 20, 22),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const OfficeLogo(size: 40),
              const SizedBox(width: 10),
              Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${store.office['name'] ?? ''}',
                    style: MQ.body(14, color: Colors.white, weight: FontWeight.w700, height: 1.3),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                Text('${store.client['code'] ?? ''}', style: MQ.mono(11, color: MQ.brassSoft)),
              ])),
              _iconBtn(Icons.notifications_none_rounded, store.unread, () => onGo(2)),
            ]),
            const SizedBox(height: 18),
            Text('${greeting()}،', style: MQ.body(15, color: MQ.brassSoft)),
            Text(store.firstName, style: MQ.display(32, color: Colors.white), maxLines: 2),
            const SizedBox(height: 16),
            if (next == null)
              _glass(Text('لا جلسات قادمة حالياً. سنبلغك فور تحديد موعد جديد.', style: MQ.body(14, color: Colors.white)))
            else
              _glass(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('جلستك القادمة', style: MQ.body(12, color: MQ.soft)),
                  const Spacer(),
                  Text('${fmtDate(next!.t)} · ', style: MQ.body(12, color: Colors.white)),
                  Text(next!.h['time'], style: MQ.mono(12, color: Colors.white)),
                ]),
                const SizedBox(height: 10),
                Countdown(target: next!.t),
                const SizedBox(height: 12),
                Text('${next!.h['purpose']}', style: MQ.body(16, color: Colors.white, weight: FontWeight.w700)),
                Text('${next!.kase['court']} · القضية ${next!.kase['no']}', style: MQ.body(12.5, color: MQ.soft)),
                const SizedBox(height: 10),
                next!.h['attend'] == true
                    ? const Chip2('حضورك شخصياً مطلوب', bg: MQ.gold, fg: MQ.forest, icon: Icons.priority_high)
                    : Chip2('يحضر المحامي نيابة عنك', bg: MQ.mint.withValues(alpha: .2), fg: MQ.mint, icon: Icons.check),
              ])),
          ]),
        ),
      ]),
    ));
  }

  Widget _iconBtn(IconData icon, int badge, VoidCallback onTap) => Material(
        color: MQ.forest.withValues(alpha: .35),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14), side: BorderSide(color: MQ.brassSoft.withValues(alpha: .35))),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Badge(
              isLabelVisible: badge > 0,
              label: Text('$badge'),
              backgroundColor: const Color(0xFFEF4444),
              offset: const Offset(-4, 4),
              child: Center(child: Icon(icon, color: Colors.white, size: 22)),
            ),
          ),
        ),
      );

  Widget _glass(Widget child) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: MQ.forest.withValues(alpha: .55),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: MQ.gold.withValues(alpha: .35))),
        child: child,
      );
}

/// عدّاد تنازلي حي
class Countdown extends StatefulWidget {
  const Countdown({super.key, required this.target});
  final DateTime target;
  @override
  State<Countdown> createState() => _CountdownState();
}

class _CountdownState extends State<Countdown> {
  late Timer t;
  @override
  void initState() {
    super.initState();
    t = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    t.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    var s = widget.target.difference(DateTime.now()).inSeconds;
    if (s < 0) s = 0;
    final parts = [(s ~/ 86400, 'يوم'), (s % 86400 ~/ 3600, 'ساعة'), (s % 3600 ~/ 60, 'دقيقة'), (s % 60, 'ثانية')];
    return Row(children: [
      for (final (i, p) in parts.indexed) ...[
        if (i > 0) const SizedBox(width: 8),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(color: Colors.black.withValues(alpha: .22), borderRadius: BorderRadius.circular(14)),
            child: Column(children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (c, a) => SlideTransition(
                    position: Tween(begin: const Offset(0, -.4), end: Offset.zero).animate(a),
                    child: FadeTransition(opacity: a, child: c)),
                child: Text(i == 0 ? '${p.$1}' : p.$1.toString().padLeft(2, '0'),
                    key: ValueKey(p.$1), style: MQ.mono(26, color: i == 3 ? MQ.brassHi : Colors.white)),
              ),
              Text(p.$2, style: MQ.body(11, color: MQ.soft)),
            ]),
          ),
        ),
      ],
    ]);
  }
}

/* ── بطاقات المؤشرات ── */
class _Kpis extends StatelessWidget {
  const _Kpis({required this.next, required this.onGo});
  final ({Map<String, dynamic> kase, Map<String, dynamic> h, DateTime t})? next;
  final GoTo onGo;
  @override
  Widget build(BuildContext context) {
    final days = next == null ? null : next!.t.difference(DateTime.now()).inDays;
    final items = [
      (Icons.gavel_rounded, '${store.cases.length}', 'قضاياي', MQ.goldLo, MQ.brassSoft, () => onGo(1)),
      (Icons.event_rounded, days == null ? '—' : (days == 0 ? 'اليوم' : '$days'), days == null || days == 0 ? 'الجلسة القادمة' : 'يوم للجلسة',
          const Color(0xFF2563EB), const Color(0xFFE0EAFD), () => onGo(1)),
      (Icons.mark_chat_unread_outlined, '${store.unread}', 'رسائل جديدة', MQ.danger, const Color(0xFFFDE7E7), () => onGo(2)),
      (Icons.folder_copy_outlined, '${store.docs.length}', 'المستندات', const Color(0xFF047857), const Color(0xFFDDF5EA), () => onGo(3)),
    ];
    return Row(children: [
      for (final (i, it) in items.indexed) ...[
        if (i > 0) const SizedBox(width: 8),
        Expanded(
          child: Material(
            color: MQ.surface,
            borderRadius: BorderRadius.circular(18),
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: it.$6,
              child: Container(
                padding: const EdgeInsets.fromLTRB(4, 10, 4, 8),
                decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: MQ.line),
                    boxShadow: const [BoxShadow(color: Color(0x0D3E2F21), blurRadius: 10, offset: Offset(0, 3))]),
                child: Column(children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(color: it.$5, borderRadius: BorderRadius.circular(10)),
                    child: Icon(it.$1, color: it.$4, size: 18),
                  ),
                  const SizedBox(height: 4),
                  FittedBox(child: Text(it.$2, style: MQ.body(19, weight: FontWeight.w800, height: 1.25))),
                  Text(it.$3,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: MQ.body(10.5, color: MQ.muted, weight: FontWeight.w700, height: 1.3)),
                ]),
              ),
            ),
          ),
        ),
      ],
    ]);
  }
}

/* ── أزرار سريعة ── */
class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onGo});
  final GoTo onGo;
  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.chat_bubble_outline, 'رسالة', MQ.goldLo, () => onGo(2)),
      (Icons.mic_none, 'رسالة صوتية', MQ.danger, () => onGo(2, action: 'voice')),
      (Icons.photo_camera_outlined, 'تصوير وثيقة', MQ.brass, () => onGo(2, action: 'camera')),
      (Icons.upload_file_outlined, 'رفع مستند', MQ.docBlue, () => onGo(2, action: 'file')),
    ];
    return Row(children: [
      for (final (i, it) in items.indexed) ...[
        if (i > 0) const SizedBox(width: 10),
        Expanded(
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(18),
            child: Ink(
              decoration: BoxDecoration(
                  gradient: i == 0 ? MQ.goldGradient : null,
                  color: i == 0 ? null : MQ.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: i == 0 ? null : Border.all(color: MQ.line),
                  boxShadow: i == 0
                      ? [BoxShadow(color: MQ.goldLo.withValues(alpha: .3), blurRadius: 16, offset: const Offset(0, 6))]
                      : null),
              child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: it.$4,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
                child: Column(children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                        color: i == 0 ? MQ.forest : it.$3.withValues(alpha: .1), shape: BoxShape.circle),
                    child: Icon(it.$1, color: i == 0 ? MQ.gold : it.$3, size: 22),
                  ),
                  const SizedBox(height: 8),
                  Text(it.$2, textAlign: TextAlign.center, style: MQ.body(12, weight: FontWeight.w700, height: 1.3)),
                ]),
              ),
              ),
            ),
          ),
        ),
      ],
    ]);
  }
}

/* ── ملخص قضية مع شريط المراحل ── */
class CaseSummary extends StatelessWidget {
  const CaseSummary({super.key, required this.kase, this.onTap});
  final Map<String, dynamic> kase;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final steps = store.steps;
    final step = (kase['step'] as num).toInt();
    return Panel(
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Chip2('${kase['no']}', bg: MQ.sunk, fg: MQ.ink, mono: true),
          const SizedBox(width: 6),
          Chip2('${kase['type']}', bg: MQ.brassSoft, fg: MQ.brass),
          const Spacer(),
          const Icon(Icons.chevron_left, color: MQ.muted),
        ]),
        const SizedBox(height: 10),
        Text('${kase['subject']}', style: MQ.body(15.5, weight: FontWeight.w700, height: 1.45)),
        const SizedBox(height: 2),
        Text('${kase['court']} · ضد ${(kase['opponents'] as List).join(' و')}', style: MQ.body(12.5, color: MQ.muted)),
        const SizedBox(height: 14),
        StageBar(steps: steps, step: step),
      ]),
    );
  }
}

class StageBar extends StatelessWidget {
  const StageBar({super.key, required this.steps, required this.step, this.labels = false});
  final List<String> steps;
  final int step;
  final bool labels;
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        for (var i = 0; i < steps.length; i++) ...[
          if (i > 0) const SizedBox(width: 4),
          Expanded(
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: i <= step ? 1 : 0),
              duration: Duration(milliseconds: 500 + i * 120),
              curve: Curves.easeOutCubic,
              builder: (_, v, __) => Container(
                height: 7,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(9), color: MQ.line),
                alignment: AlignmentDirectional.centerStart,
                child: FractionallySizedBox(
                  widthFactor: v,
                  child: Container(
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(9), color: i == step ? MQ.brass : MQ.pine)),
                ),
              ),
            ),
          ),
        ],
      ]),
      const SizedBox(height: 8),
      if (labels)
        Row(children: [
          for (var i = 0; i < steps.length; i++)
            Expanded(
                child: Text(steps[i],
                    textAlign: TextAlign.center,
                    style: MQ.body(10.5,
                        color: i == step ? MQ.brass : (i < step ? MQ.pine : MQ.muted),
                        weight: i == step ? FontWeight.w700 : FontWeight.w500,
                        height: 1.3))),
        ])
      else
        Text.rich(TextSpan(children: [
          TextSpan(text: 'المرحلة الحالية: ', style: MQ.body(12.5, color: MQ.muted)),
          TextSpan(text: steps.isEmpty ? '' : steps[step.clamp(0, steps.length - 1)], style: MQ.body(12.5, color: MQ.brass, weight: FontWeight.w700)),
          TextSpan(text: '  ·  ${step + 1} من ${steps.length}', style: MQ.body(12.5, color: MQ.muted)),
        ])),
    ]);
  }
}
