import 'package:flutter/material.dart';
import 'home.dart';
import 'store.dart';
import 'theme.dart';
import 'ui.dart';
import 'util.dart';

/// قائمة القضايا بعنوان كبير، وكل قضية تفتح صفحة تفاصيلها
class CasesTab extends StatelessWidget {
  const CasesTab({super.key, this.onGo});
  final GoTo? onGo;
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) => LargeTitlePage(
        title: 'قضاياي',
        slivers: [
          if (store.cases.isEmpty)
            const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: EmptyState(icon: Icons.balance_outlined, title: 'لا قضايا بعد', message: 'تظهر هنا قضاياك فور تسجيلها لدى المكتب.')))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(Sp.page, Sp.s, Sp.page, 0),
              sliver: SliverList.separated(
                itemCount: store.cases.length,
                separatorBuilder: (_, __) => const SizedBox(height: Sp.m),
                itemBuilder: (_, i) => CaseSummary(
                  kase: store.cases[i],
                  detailed: true,
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CaseDetailPage(kase: store.cases[i], onGo: onGo))),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// صفحة تفاصيل القضية: البيانات، مسار المراحل، الجلسات
class CaseDetailPage extends StatelessWidget {
  const CaseDetailPage({super.key, required this.kase, this.onGo});
  final Map<String, dynamic> kase;
  final GoTo? onGo;

  @override
  Widget build(BuildContext context) {
    final k = kase;
    final hs = ((k['hearings'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e)).toList();
    final now = DateTime.now();
    final nextIdx = hs.indexWhere((h) => parseDate(h['date'], h['time']).isAfter(now));
    final steps = store.steps;
    final step = (k['step'] as num? ?? 0).toInt();
    final (sb, sf) = caseStatusColors('${k['status'] ?? ''}');
    return Scaffold(
      appBar: AppBar(title: Text('قضية ${k['no']}', style: MQ.title3())),
      bottomNavigationBar: onGo == null
          ? null
          : SafeArea(
              minimum: const EdgeInsets.fromLTRB(Sp.page, Sp.s, Sp.page, Sp.m),
              child: FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).pop();
                  onGo!(2);
                },
                icon: const Icon(Icons.chat_bubble_outline_rounded),
                label: const Text('مراسلة المحامي بشأن هذه القضية'),
              ),
            ),
      body: ListView(padding: const EdgeInsets.only(bottom: Sp.xxl), children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(Sp.page, Sp.s, Sp.page, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Wrap(spacing: Sp.s, runSpacing: Sp.s, children: [
              if ('${k['status'] ?? ''}'.isNotEmpty) Chip2('${k['status']}', bg: sb, fg: sf),
              if ('${k['type'] ?? ''}'.isNotEmpty) Chip2('${k['type']}', bg: MQ.brassSoft, fg: MQ.brass),
            ]),
            const SizedBox(height: Sp.s),
            Text('${k['subject']}', style: MQ.title2()),
          ]),
        ),
        const SectionLabel('بيانات الدعوى'),
        Group(children: [
          InfoRow(icon: Icons.tag_rounded, label: 'رقم الدعوى', value: '${k['no'] ?? ''}', mono: true),
          InfoRow(icon: Icons.account_balance_outlined, label: 'المحكمة', value: '${k['court'] ?? ''}'),
          InfoRow(icon: Icons.person_outline_rounded, label: 'صفتك في الدعوى', value: '${k['role'] ?? ''}'),
          InfoRow(icon: Icons.people_outline_rounded, label: 'الطرف الآخر', value: ((k['opponents'] as List?) ?? []).join(' و')),
        ]),
        if (steps.isNotEmpty) ...[
          const SectionLabel('مسار القضية'),
          Group(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(Sp.l, Sp.l, Sp.l, Sp.s),
              child: Column(children: [
                for (var i = 0; i < steps.length; i++) _StepRow(label: steps[i], state: i < step ? 0 : (i == step ? 1 : 2), last: i == steps.length - 1),
              ]),
            ),
          ]),
        ],
        SectionLabel('الجلسات (${hs.length})'),
        if (hs.isEmpty)
          const Group(children: [Padding(padding: EdgeInsets.all(Sp.l), child: Text('لم تُحدَّد جلسات بعد.'))])
        else
          Group(children: [
            for (final (i, h) in hs.indexed) _HearingRow(h: h, isNext: i == nextIdx),
          ]),
      ]),
    );
  }
}

/// صف مرحلة في المسار العمودي: 0 منجزة، 1 حالية، 2 قادمة
class _StepRow extends StatelessWidget {
  const _StepRow({required this.label, required this.state, required this.last});
  final String label;
  final int state;
  final bool last;
  @override
  Widget build(BuildContext context) => IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          SizedBox(
            width: 24,
            child: Column(children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: state == 0 ? MQ.forest : (state == 1 ? MQ.gold : MQ.surface),
                  border: state == 2 ? Border.all(color: MQ.line, width: 2) : null,
                ),
                child: state == 0 ? const Icon(Icons.check_rounded, size: 15, color: MQ.onGold) : null,
              ),
              if (!last) Expanded(child: Container(width: 2, margin: const EdgeInsets.symmetric(vertical: 2), color: state == 0 ? MQ.forest : MQ.line)),
            ]),
          ),
          const SizedBox(width: Sp.m),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 2, bottom: last ? 0 : Sp.l),
              child: Wrap(spacing: Sp.s, runSpacing: Sp.xs, crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text(label, style: MQ.callout(color: state == 2 ? MQ.muted : MQ.ink, weight: state == 1 ? FontWeight.w700 : FontWeight.w500)),
                if (state == 1) const Chip2('المرحلة الحالية', bg: MQ.brassSoft, fg: MQ.brass),
              ]),
            ),
          ),
        ]),
      );
}

class _HearingRow extends StatelessWidget {
  const _HearingRow({required this.h, required this.isNext});
  final Map<String, dynamic> h;
  final bool isNext;
  @override
  Widget build(BuildContext context) {
    final t = parseDate(h['date'], h['time']);
    final past = t.isBefore(DateTime.now());
    return Container(
      color: isNext ? MQ.brassSoft.withValues(alpha: .5) : null,
      padding: const EdgeInsets.symmetric(horizontal: Sp.l, vertical: Sp.m),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 52,
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isNext ? MQ.forest : MQ.sunk,
            borderRadius: BorderRadius.circular(R.control - 2),
          ),
          child: Column(children: [
            Text('${t.day}', style: MQ.title3(color: isNext ? MQ.onGold : MQ.ink)),
            Text('${t.month}/${t.year % 100}', style: MQ.caption(color: isNext ? MQ.soft : MQ.muted, weight: FontWeight.w400)),
          ]),
        ),
        const SizedBox(width: Sp.m),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Wrap(spacing: Sp.s, runSpacing: Sp.xs, crossAxisAlignment: WrapCrossAlignment.center, children: [
              Text('${h['purpose']}', style: MQ.callout(weight: FontWeight.w600)),
              if (isNext) Chip2(relDay(t), bg: MQ.forest, fg: MQ.onGold),
            ]),
            Text('${dayName(t)} · ${h['time']}', style: MQ.footnote()),
            if (!past && h['attend'] == true) ...[const SizedBox(height: Sp.xs), const Chip2('حضورك شخصياً مطلوب', bg: MQ.warnSoft, fg: MQ.warn, icon: Icons.priority_high_rounded)],
            if (h['result'] != null) Padding(padding: const EdgeInsets.only(top: Sp.xs), child: Text('القرار: ${h['result']}', style: MQ.subhead(color: MQ.muted))),
          ]),
        ),
      ]),
    );
  }
}
