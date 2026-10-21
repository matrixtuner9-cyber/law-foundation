import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'store.dart';
import 'push.dart';
import 'theme.dart';
import 'ui.dart';
import 'lawyer_avatar.dart';
import 'util.dart';

typedef GoTo = void Function(int i, {String? action});

/// الرئيسية: التحية، الجلسة القادمة، إجراءات سريعة، المحامي، القضايا، آخر الرسائل
class HomeTab extends StatelessWidget {
  const HomeTab({super.key, required this.onGo});
  final GoTo onGo;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: ListenableBuilder(
        listenable: store,
        builder: (context, _) {
          final next = store.nextHearing;
          final fromLawyer = store.msgs.where((m) => !m.mine).toList().reversed.take(3).toList();
          return Column(children: [
            _Header(onGo: onGo),
            Expanded(
              child: RefreshIndicator(
            color: MQ.forest,
            onRefresh: () => store.load(),
            child: CustomScrollView(slivers: [
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: Sp.page),
                sliver: SliverToBoxAdapter(child: _NextHearing(next: next)),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(Sp.page, Sp.l, Sp.page, 0),
                sliver: SliverToBoxAdapter(child: _QuickActions(onGo: onGo)),
              ),
              if ('${store.office['lawyer'] ?? ''}'.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(Sp.page, Sp.l, Sp.page, 0),
                  sliver: SliverToBoxAdapter(child: _LawyerCard(onChat: () => onGo(2))),
                ),
              const SliverPadding(padding: EdgeInsets.fromLTRB(Sp.page, Sp.l, Sp.page, 0), sliver: SliverToBoxAdapter(child: PushPrompt())),
              SliverToBoxAdapter(
                child: SectionLabel('قضاياي (${store.cases.length})',
                    trailing: TextButton(onPressed: () => onGo(1), child: const Text('عرض الكل'))),
              ),
              if (store.cases.isEmpty)
                const SliverToBoxAdapter(child: EmptyState(icon: Icons.balance_outlined, title: 'لا قضايا بعد', message: 'تظهر هنا قضاياك فور تسجيلها لدى المكتب.'))
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: Sp.page),
                  sliver: SliverList.separated(
                    itemCount: store.cases.length,
                    separatorBuilder: (_, __) => const SizedBox(height: Sp.m),
                    itemBuilder: (_, i) => CaseSummary(kase: store.cases[i], onTap: () => onGo(1)),
                  ),
                ),
              if (fromLawyer.isNotEmpty) ...[
                SliverToBoxAdapter(
                    child: SectionLabel('آخر رسائل المكتب', trailing: TextButton(onPressed: () => onGo(2), child: const Text('فتح المحادثة')))),
                SliverToBoxAdapter(
                  child: Group(children: [
                    for (final m in fromLawyer)
                      NavRow(
                        icon: m.type == 'notice'
                            ? Icons.campaign_outlined
                            : m.type == 'voice'
                                ? Icons.mic_none_rounded
                                : m.type == 'image'
                                    ? Icons.image_outlined
                                    : m.type == 'file'
                                        ? Icons.description_outlined
                                        : Icons.chat_bubble_outline_rounded,
                        iconColor: m.type == 'notice' ? MQ.brass : MQ.forest,
                        title: m.type == 'voice'
                            ? 'رسالة صوتية · ${mmss(m.dur)}'
                            : m.type == 'text' || m.type == 'notice'
                                ? (m.text.length > 70 ? '${m.text.substring(0, 70)}…' : m.text)
                                : (m.name ?? 'مرفق'),
                        subtitle: '${relDay(m.time)} · ${hhmm(m.time)}',
                        trailing: m.seen ? null : Container(width: 10, height: 10, decoration: const BoxDecoration(color: MQ.danger, shape: BoxShape.circle)),
                        onTap: () => onGo(2),
                      ),
                  ]),
                ),
              ],
              const SliverToBoxAdapter(child: SizedBox(height: Sp.xl)),
            ]),
          )),
          ]);
        },
      ),
    );
  }
}

/* ── الرأس: المكتب والتحية ── */
class _Header extends StatelessWidget {
  const _Header({required this.onGo});
  final GoTo onGo;
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final unread = store.unread;
    return Container(
      padding: EdgeInsets.fromLTRB(Sp.page, top + Sp.s, Sp.page, Sp.l),
      decoration: BoxDecoration(
        color: MQ.forest,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(R.sheet)),
        image: const DecorationImage(image: AssetImage('assets/images/hdr.jpg'), fit: BoxFit.cover, alignment: Alignment.centerRight),
        boxShadow: [BoxShadow(color: MQ.forest.withValues(alpha: .25), blurRadius: 16, offset: const Offset(0, 6))],
        border: const Border(bottom: BorderSide(color: MQ.gold, width: 1.5)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Stack(clipBehavior: Clip.none, children: [
            IconButton(
              tooltip: 'الإشعارات',
              onPressed: () => onGo(2),
              style: IconButton.styleFrom(side: BorderSide(color: MQ.gold.withValues(alpha: .7)), minimumSize: const Size(44, 44)),
              icon: const Icon(Icons.notifications_none_rounded, color: MQ.brassHi),
            ),
            if (unread > 0) PositionedDirectional(top: 6, end: 6, child: Container(width: 10, height: 10, decoration: const BoxDecoration(color: MQ.gold, shape: BoxShape.circle))),
          ]),
          const SizedBox(width: Sp.m),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('بوابة الموكل', style: MQ.title1(color: MQ.brassHi)),
              Text('${store.office['name'] ?? ''}', style: MQ.footnote(color: MQ.soft), maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
          const SizedBox(width: 56),
        ]),
        const SizedBox(height: Sp.m),
        Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: .08), border: Border.all(color: MQ.gold.withValues(alpha: .7))),
            child: const Icon(Icons.person_outline_rounded, color: MQ.brassHi),
          ),
          const SizedBox(width: Sp.m),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${greeting()}، ${store.firstName}', style: MQ.headline(color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('نحن هنا لدعمك في كل خطوة من قضيتك', style: MQ.footnote(color: MQ.soft)),
            ]),
          ),
        ]),
      ]),
    );
  }
}

/* ── الجلسة القادمة ── */
class _NextHearing extends StatelessWidget {
  const _NextHearing({required this.next});
  final ({Map<String, dynamic> kase, Map<String, dynamic> h, DateTime t})? next;
  static const _months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  @override
  Widget build(BuildContext context) {
    if (next == null) {
      return Panel(
        child: Row(children: [
          const IconTile(Icons.event_available_outlined, color: MQ.ok),
          const SizedBox(width: Sp.m),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('لا جلسات قادمة', style: MQ.headline()),
              Text('سنبلغك فور تحديد موعد جديد.', style: MQ.footnote()),
            ]),
          ),
        ]),
      );
    }
    final n = next!;
    final attend = n.h['attend'] == true;
    return Container(
      decoration: BoxDecoration(color: MQ.forest, borderRadius: BorderRadius.circular(R.card + 4)),
      padding: const EdgeInsets.all(Sp.l),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text('الجلسة القادمة', style: MQ.footnote(color: MQ.soft, weight: FontWeight.w600))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(color: attend ? MQ.brassHi : Colors.white.withValues(alpha: .12), borderRadius: BorderRadius.circular(R.pill)),
            child: Text(attend ? 'حضورك مطلوب' : 'يحضر المحامي عنك',
                style: MQ.caption(color: attend ? MQ.forest : MQ.onGold, weight: FontWeight.w700)),
          ),
        ]),
        const SizedBox(height: Sp.m),
        IntrinsicHeight(
          child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(
              width: 72,
              padding: const EdgeInsets.symmetric(vertical: Sp.s),
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(R.control), border: Border.all(color: MQ.brassHi.withValues(alpha: .5))),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(dayName(n.t), style: MQ.caption(color: MQ.brassHi)),
                Text('${n.t.day}', style: MQ.title1(color: MQ.onGold)),
                Text(_months[n.t.month - 1], style: MQ.caption(color: MQ.soft, weight: FontWeight.w400)),
              ]),
            ),
            const SizedBox(width: Sp.m),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                Text('${n.h['time']}', style: MQ.mono(18, color: MQ.brassHi, weight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('${n.h['purpose']}', style: MQ.headline(color: MQ.onGold), maxLines: 2, overflow: TextOverflow.ellipsis),
                Text('${n.kase['court']} · القضية ${n.kase['no']}', style: MQ.footnote(color: MQ.soft), maxLines: 2, overflow: TextOverflow.ellipsis),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: Sp.m),
        Countdown(target: n.t),
      ]),
    );
  }
}

/// عدّاد تنازلي حي (أيام · ساعات · دقائق)
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
    t = Timer.periodic(const Duration(seconds: 30), (_) => setState(() {}));
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
    final parts = [(s ~/ 86400, 'يوم'), (s % 86400 ~/ 3600, 'ساعة'), (s % 3600 ~/ 60, 'دقيقة')];
    return Row(children: [
      for (final (i, p) in parts.indexed) ...[
        if (i > 0) const SizedBox(width: Sp.s),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: Sp.s),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: .08), borderRadius: BorderRadius.circular(R.control)),
            child: Column(children: [
              Text('${p.$1}', style: MQ.mono(20, color: MQ.onGold, weight: FontWeight.w600)),
              Text(p.$2, style: MQ.caption(color: MQ.soft, weight: FontWeight.w400)),
            ]),
          ),
        ),
      ],
    ]);
  }
}

/* ── إجراءات سريعة ── */
class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onGo});
  final GoTo onGo;
  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.chat_outlined, 'رسالة', () => onGo(2)),
      (Icons.mic_none_rounded, 'تسجيل صوتي', () => onGo(2, action: 'voice')),
      (Icons.photo_camera_outlined, 'تصوير وثيقة', () => onGo(2, action: 'camera')),
      (Icons.upload_file_outlined, 'رفع مستند', () => onGo(2, action: 'file')),
    ];
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      for (final (i, it) in items.indexed) ...[
        if (i > 0) const SizedBox(width: Sp.s),
        Expanded(
          child: Semantics(
            button: true,
            label: it.$2,
            child: Material(
              color: MQ.surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.card), side: const BorderSide(color: MQ.line)),
              child: InkWell(
                borderRadius: BorderRadius.circular(R.card),
                onTap: it.$3,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(Sp.xs, Sp.m, Sp.xs, Sp.m),
                  child: Column(children: [
                    IconTile(it.$1, size: 44),
                    const SizedBox(height: Sp.s),
                    Text(it.$2, textAlign: TextAlign.center, maxLines: 2, style: MQ.caption(color: MQ.ink, weight: FontWeight.w600)),
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

/* ── المحامي المسؤول ── */
class _LawyerCard extends StatelessWidget {
  const _LawyerCard({required this.onChat});
  final VoidCallback onChat;
  @override
  Widget build(BuildContext context) => Panel(
        onTap: onChat,
        padding: const EdgeInsets.all(Sp.m + 2),
        child: Row(children: [
          const LawyerAvatar(size: 52, dark: false),
          const SizedBox(width: Sp.m),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('محاميك المسؤول', style: MQ.caption()),
              Text('${store.office['lawyer']}', style: MQ.headline(), maxLines: 2, overflow: TextOverflow.ellipsis),
              if ('${store.office['hours'] ?? ''}'.isNotEmpty)
                Text('${store.office['hours']}', style: MQ.footnote(), maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
          const SizedBox(width: Sp.s),
          IconButton.filled(
            onPressed: onChat,
            tooltip: 'مراسلة المحامي',
            style: IconButton.styleFrom(backgroundColor: MQ.forest, foregroundColor: MQ.onGold),
            icon: const Icon(Icons.chat_bubble_outline_rounded, size: 22),
          ),
        ]),
      );
}

/// بطاقة قضية مختصرة
class CaseSummary extends StatelessWidget {
  const CaseSummary({super.key, required this.kase, this.onTap});
  final Map<String, dynamic> kase;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final steps = store.steps;
    final step = (kase['step'] as num? ?? 0).toInt();
    final (sb, sf) = caseStatusColors('${kase['status'] ?? ''}');
    return Panel(
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('قضية ${kase['no']}', style: MQ.mono(13, color: MQ.muted)),
          const Spacer(),
          if ('${kase['status'] ?? ''}'.isNotEmpty) Chip2('${kase['status']}', bg: sb, fg: sf),
        ]),
        const SizedBox(height: Sp.s),
        Text('${kase['subject']}', style: MQ.headline(), maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 2),
        Text('${kase['court']} · ضد ${(kase['opponents'] as List? ?? []).join(' و')}',
            style: MQ.footnote(), maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: Sp.m),
        StageBar(steps: steps, step: step),
      ]),
    );
  }
}

/// شريط مراحل القضية
class StageBar extends StatelessWidget {
  const StageBar({super.key, required this.steps, required this.step, this.labels = false});
  final List<String> steps;
  final int step;
  final bool labels;
  @override
  Widget build(BuildContext context) {
    if (steps.isEmpty) return const SizedBox.shrink();
    final cur = step.clamp(0, steps.length - 1);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        for (var i = 0; i < steps.length; i++) ...[
          if (i > 0) const SizedBox(width: 3),
          Expanded(
            child: Container(
              height: 6,
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(R.pill), color: i < cur ? MQ.forest : (i == cur ? MQ.gold : MQ.sunk)),
            ),
          ),
        ],
      ]),
      const SizedBox(height: Sp.s),
      Text.rich(TextSpan(children: [
        TextSpan(text: 'المرحلة: ', style: MQ.footnote()),
        TextSpan(text: steps[cur], style: MQ.footnote(color: MQ.ink, weight: FontWeight.w600)),
        TextSpan(text: '  ·  ${cur + 1} من ${steps.length}', style: MQ.footnote()),
      ])),
    ]);
  }
}
