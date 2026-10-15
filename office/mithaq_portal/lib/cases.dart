import 'package:flutter/material.dart';
import 'home.dart';
import 'store.dart';
import 'theme.dart';
import 'util.dart';

class CasesTab extends StatelessWidget {
  const CasesTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('قضاياي')),
      body: ListenableBuilder(
        listenable: store,
        builder: (context, _) => ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          itemCount: store.cases.length,
          separatorBuilder: (_, __) => const SizedBox(height: 14),
          itemBuilder: (_, i) => _CaseCard(kase: store.cases[i]),
        ),
      ),
    );
  }
}

class _CaseCard extends StatefulWidget {
  const _CaseCard({required this.kase});
  final Map<String, dynamic> kase;
  @override
  State<_CaseCard> createState() => _CaseCardState();
}

class _CaseCardState extends State<_CaseCard> {
  bool open = true;
  @override
  Widget build(BuildContext context) {
    final k = widget.kase;
    final hs = (k['hearings'] as List).map((e) => Map<String, dynamic>.from(e)).toList();
    final now = DateTime.now();
    final nextIdx = hs.indexWhere((h) => parseDate(h['date'], h['time']).isAfter(now));
    return Panel(
      padding: EdgeInsets.zero,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Wrap(spacing: 6, runSpacing: 6, children: [
              Chip2('${k['no']}', bg: MQ.ivory, fg: MQ.ink, mono: true),
              Chip2('${k['type']}', bg: MQ.brassSoft, fg: MQ.brass),
              Chip2('${k['status']}', bg: MQ.pineSoft, fg: MQ.pine),
            ]),
            const SizedBox(height: 10),
            Text('${k['subject']}', style: MQ.display(21)),
            const SizedBox(height: 10),
            _kv(Icons.account_balance_outlined, 'المحكمة', '${k['court']}'),
            _kv(Icons.person_outline, 'صفتك', '${k['role']}'),
            _kv(Icons.people_outline, 'الطرف الآخر', (k['opponents'] as List).join(' و')),
            const SizedBox(height: 16),
            StageBar(steps: store.steps, step: (k['step'] as num).toInt(), labels: true),
            const SizedBox(height: 6),
          ]),
        ),
        const Divider(height: 22),
        InkWell(
          onTap: () => setState(() => open = !open),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 10, 8),
            child: Row(children: [
              Text('سير الجلسات', style: MQ.body(14, weight: FontWeight.w700)),
              const SizedBox(width: 6),
              Chip2('${hs.length}', bg: MQ.line, fg: MQ.muted),
              const Spacer(),
              AnimatedRotation(
                  turns: open ? .5 : 0, duration: const Duration(milliseconds: 200), child: const Icon(Icons.expand_more)),
            ]),
          ),
        ),
        AnimatedCrossFade(
          duration: const Duration(milliseconds: 250),
          crossFadeState: open ? CrossFadeState.showFirst : CrossFadeState.showSecond,
          secondChild: const SizedBox(width: double.infinity, height: 8),
          firstChild: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            child: Column(children: [
              for (final (i, h) in hs.indexed) _HearingRow(h: h, isNext: i == nextIdx, last: i == hs.length - 1),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _kv(IconData ic, String k, String v) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(ic, size: 17, color: MQ.muted),
          const SizedBox(width: 8),
          SizedBox(width: 82, child: Text(k, style: MQ.body(13, color: MQ.muted))),
          Expanded(child: Text(v, style: MQ.body(13.5, weight: FontWeight.w600))),
        ]),
      );
}

class _HearingRow extends StatelessWidget {
  const _HearingRow({required this.h, required this.isNext, required this.last});
  final Map<String, dynamic> h;
  final bool isNext, last;
  @override
  Widget build(BuildContext context) {
    final t = parseDate(h['date'], h['time']);
    final past = t.isBefore(DateTime.now());
    final dot = isNext ? MQ.pine : (past ? MQ.muted : MQ.line);
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(
          width: 22,
          child: Column(children: [
            const SizedBox(height: 6),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isNext ? MQ.pine : MQ.surface,
                  border: Border.all(color: dot, width: 2),
                  boxShadow: isNext ? [BoxShadow(color: MQ.pine.withValues(alpha: .3), blurRadius: 0, spreadRadius: 4)] : null),
            ),
            if (!last) Expanded(child: Container(width: 1.5, color: MQ.line)),
          ]),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Wrap(spacing: 6, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text(fmtDate(t), style: MQ.body(13.5, weight: FontWeight.w700)),
                Chip2('${h['time']}', bg: MQ.ivory, fg: MQ.ink, mono: true),
                if (isNext) Chip2(relDay(t), bg: MQ.pine, fg: MQ.onGold),
                if (!past && h['attend'] == true) const Chip2('حضورك مطلوب', bg: MQ.warnSoft, fg: MQ.warn),
              ]),
              const SizedBox(height: 2),
              Text('${h['purpose']}', style: MQ.body(13.5)),
              if (h['result'] != null) Text('القرار: ${h['result']}', style: MQ.body(12.5, color: MQ.muted)),
            ]),
          ),
        ),
      ]),
    );
  }
}
