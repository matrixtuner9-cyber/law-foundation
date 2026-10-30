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

/// الرئيسية: هيدر ثابت، القضية الرئيسية، الجلسة القادمة، اختصارات، آخر المستجدات، الأتعاب والمستندات
class HomeTab extends StatelessWidget {
  const HomeTab({super.key, required this.onGo});
  final GoTo onGo;
  static const _months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ListenableBuilder(
        listenable: store,
        builder: (context, _) {
          final k = store.cases.isEmpty ? null : store.cases.first;
          final fromOffice = store.msgs.where((m) => !m.mine).toList().reversed.take(3).toList();
          return Column(children: [
            _Header(onGo: onGo),
            Expanded(
              child: RefreshIndicator(
                color: MQ.forest,
                onRefresh: () => store.load(),
                child: ListView(padding: const EdgeInsets.fromLTRB(Sp.page, Sp.m, Sp.page, Sp.xl), children: [
                  if (k != null) _MainCase(kase: k, onTap: () => onGo(1)),
                  const SizedBox(height: Sp.m),
                  _NextHearing(next: store.nextHearing),
                  const SizedBox(height: Sp.m),
                  _Shortcuts(onGo: onGo),
                  const SizedBox(height: Sp.m),
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(child: _FeesCard(onTap: () => onGo(4))),
                    const SizedBox(width: Sp.m),
                    Expanded(child: _DocsCard(onTap: () => onGo(3))),
                  ]),
                  const PushPrompt(),
                  if (fromOffice.isNotEmpty) ...[
                    _Title(Icons.history_rounded, 'آخر المستجدات', 'فتح المحادثة', () => onGo(2)),
                    Group(margin: EdgeInsets.zero, children: [
                      for (final m in fromOffice)
                        NavRow(
                          icon: m.type == 'notice' ? Icons.campaign_rounded : m.type == 'voice' ? Icons.mic_rounded : m.type == 'image' ? Icons.image_rounded : m.type == 'file' ? Icons.description_rounded : Icons.chat_bubble_rounded,
                          iconColor: m.type == 'notice' ? MQ.brass : MQ.docBlue,
                          title: m.type == 'voice' ? 'رسالة صوتية · ${mmss(m.dur)}' : (m.type == 'text' || m.type == 'notice') ? (m.text.length > 70 ? '${m.text.substring(0, 70)}…' : m.text) : (m.name ?? 'مرفق'),
                          subtitle: '${relDay(m.time)} · ${hhmm(m.time)}',
                          trailing: m.seen ? null : Container(width: 10, height: 10, decoration: const BoxDecoration(color: MQ.danger, shape: BoxShape.circle)),
                          onTap: () => onGo(2),
                        ),
                    ]),
                  ],
                ]),
              ),
            ),
          ]);
        },
      ),
    );
  }
}

class _Title extends StatelessWidget {
  const _Title(this.icon, this.text, this.action, this.onTap);
  final IconData icon;
  final String text, action;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: Sp.l, bottom: Sp.s),
        child: Row(children: [
          Icon(icon, size: 20, color: MQ.brass),
          const SizedBox(width: Sp.s),
          Expanded(child: Text(text, style: MQ.headline())),
          TextButton(onPressed: onTap, child: Text(action)),
        ]),
      );
}

/* ── الهيدر الثابت ── */
class _Header extends StatelessWidget {
  const _Header({required this.onGo});
  final GoTo onGo;
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final unread = store.unread;
    return Container(
      padding: EdgeInsets.fromLTRB(Sp.page, top + Sp.m, Sp.page, Sp.l),
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF153A30), Color(0xFF24584A)]),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
        border: Border(bottom: BorderSide(color: MQ.gold.withValues(alpha: .9), width: 2.5)),
        boxShadow: [BoxShadow(color: MQ.forestDeep.withValues(alpha: .28), blurRadius: 18, offset: const Offset(0, 8))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          Stack(clipBehavior: Clip.none, children: [
            IconButton(
              tooltip: 'الإشعارات',
              onPressed: () => onGo(2),
              style: IconButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: .12), minimumSize: const Size(44, 44)),
              icon: const Icon(Icons.notifications_none_rounded, color: Colors.white),
            ),
            if (unread > 0)
              PositionedDirectional(
                  top: -3,
                  end: -3,
                  child: Container(
                      constraints: const BoxConstraints(minWidth: 18),
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(color: MQ.danger, borderRadius: BorderRadius.circular(R.pill)),
                      child: Text('$unread', textAlign: TextAlign.center, style: MQ.caption(color: Colors.white, weight: FontWeight.w700)))),
          ]),
          Expanded(
            child: Column(children: [
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.balance_rounded, color: MQ.gold, size: 26),
                const SizedBox(width: Sp.s),
                Text('ميثاق', style: MQ.title1(color: MQ.brassHi)),
              ]),
              Text('بوابة الموكل الآمنة', style: MQ.footnote(color: MQ.brassHi, weight: FontWeight.w600)),
            ]),
          ),
          const LawyerAvatar(size: 44),
        ]),
        const SizedBox(height: Sp.l),
        Text('${greeting()}، ${store.firstName}', style: MQ.title1(color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 2),
        Text('شريكك القانوني في طريق العدالة', style: MQ.callout(color: const Color(0xFFDDE8E2))),
      ]),
    );
  }
}

/* ── القضية الرئيسية ── */
class _MainCase extends StatelessWidget {
  const _MainCase({required this.kase, required this.onTap});
  final Map<String, dynamic> kase;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final steps = store.steps;
    final cur = steps.isEmpty ? 0 : (kase['step'] as num? ?? 0).toInt().clamp(0, steps.length - 1);
    final (sb, sf) = caseStatusColors('${kase['status'] ?? ''}');
    Widget cell(String l, String v, {bool mono = false}) => Expanded(
          child: Column(children: [
            Text(l, style: MQ.caption(), textAlign: TextAlign.center),
            const SizedBox(height: 2),
            Text(v.isEmpty ? '—' : v, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: mono ? MQ.mono(13) : MQ.footnote(color: MQ.ink, weight: FontWeight.w600)),
          ]),
        );
    return Panel(
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          const IconTile(Icons.folder_open_rounded, color: MQ.brass, size: 36),
          const SizedBox(width: Sp.m),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('القضية الرئيسية', style: MQ.caption()),
              Text('${kase['subject']}', style: MQ.title3(), maxLines: 2, overflow: TextOverflow.ellipsis),
            ]),
          ),
          if ('${kase['status'] ?? ''}'.isNotEmpty) Chip2('${kase['status']}', bg: sb, fg: sf),
        ]),
        const SizedBox(height: Sp.m),
        const Divider(height: 1),
        const SizedBox(height: Sp.m),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          cell('رقم الدعوى', '${kase['no'] ?? ''}', mono: true),
          cell('المحكمة', '${kase['court'] ?? ''}'),
          cell('صفتك', '${kase['role'] ?? ''}'),
          cell('المحامي', '${store.office['lawyer'] ?? ''}'.replaceFirst(RegExp(r'^(المحامي|المحامية|الأستاذ)\s+'), '')),
        ]),
        if (steps.isNotEmpty) ...[
          const SizedBox(height: Sp.l),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            for (var i = 0; i < steps.length; i++)
              Expanded(
                child: Column(children: [
                  Row(children: [
                    Expanded(child: Container(height: 2, color: i == 0 ? Colors.transparent : (i <= cur ? MQ.gold : MQ.line))),
                    Container(
                      width: i == cur ? 22 : 14,
                      height: i == cur ? 22 : 14,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: i < cur ? MQ.gold : (i == cur ? MQ.forest : MQ.surface),
                        border: Border.all(color: i <= cur ? MQ.gold : MQ.line, width: 2),
                      ),
                      child: i == cur ? const Icon(Icons.check_rounded, size: 13, color: MQ.brassHi) : null,
                    ),
                    Expanded(child: Container(height: 2, color: i == steps.length - 1 ? Colors.transparent : (i < cur ? MQ.gold : MQ.line))),
                  ]),
                  const SizedBox(height: 6),
                  Text(steps[i], textAlign: TextAlign.center, maxLines: 2, style: MQ.caption(color: i == cur ? MQ.ink : MQ.muted, weight: i == cur ? FontWeight.w700 : FontWeight.w400).copyWith(fontSize: 11)),
                ]),
              ),
          ]),
        ],
      ]),
    );
  }
}

/* ── الجلسة القادمة ── */
class _NextHearing extends StatelessWidget {
  const _NextHearing({required this.next});
  final ({Map<String, dynamic> kase, Map<String, dynamic> h, DateTime t})? next;

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
    final hall = '${n.h['hall'] ?? n.h['room'] ?? ''}';
    return Container(
      decoration: BoxDecoration(color: MQ.forest, borderRadius: BorderRadius.circular(R.card + 2)),
      padding: const EdgeInsets.all(Sp.l),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          const Icon(Icons.calendar_month_rounded, color: MQ.gold, size: 22),
          const SizedBox(width: Sp.s),
          Expanded(child: Text('الجلسة القادمة', style: MQ.headline(color: MQ.brassHi))),
          Chip2(relDay(n.t), bg: Colors.white.withValues(alpha: .12), fg: Colors.white),
        ]),
        const SizedBox(height: Sp.m),
        Text('${dayName(n.t)}، ${n.t.day} ${HomeTab._months[n.t.month - 1]} ${n.t.year}', style: MQ.title2(color: Colors.white)),
        const SizedBox(height: Sp.xs),
        Text('الساعة ${n.h['time']} · ${n.h['purpose']}', style: MQ.subhead(color: Colors.white.withValues(alpha: .92))),
        const SizedBox(height: Sp.s),
        Row(children: [
          const Icon(Icons.location_on_rounded, size: 18, color: MQ.brassHi),
          const SizedBox(width: Sp.xs),
          Expanded(child: Text('${n.kase['court'] ?? ''}${hall.isEmpty ? '' : ' · $hall'}', style: MQ.subhead(color: Colors.white.withValues(alpha: .92)), maxLines: 2, overflow: TextOverflow.ellipsis)),
        ]),
        const SizedBox(height: Sp.m),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: Sp.m),
          decoration: BoxDecoration(color: attend ? MQ.gold : Colors.white.withValues(alpha: .1), borderRadius: BorderRadius.circular(R.control)),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(attend ? Icons.priority_high_rounded : Icons.verified_user_outlined, size: 18, color: attend ? MQ.forest : MQ.brassHi),
            const SizedBox(width: Sp.s),
            Text(attend ? 'حضورك الشخصي مطلوب' : 'يحضر المحامي عنك', style: MQ.subhead(color: attend ? MQ.forest : Colors.white, weight: FontWeight.w700)),
          ]),
        ),
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

/* ── اختصارات ── */
class _Shortcuts extends StatelessWidget {
  const _Shortcuts({required this.onGo});
  final GoTo onGo;
  @override
  Widget build(BuildContext context) {
    final u = store.unread;
    final items = [
      (Icons.folder_copy_rounded, 'قضاياي', 0, () => onGo(1)),
      (Icons.event_note_rounded, 'الجلسات', 0, () => onGo(1)),
      (Icons.description_rounded, 'مستنداتي', 0, () => onGo(3)),
      (Icons.forum_rounded, 'مراسلة المحامي', u, () => onGo(2)),
    ];
    return Row(children: [
      for (final (i, it) in items.indexed) ...[
        if (i > 0) const SizedBox(width: Sp.s),
        Expanded(
          child: Material(
            color: MQ.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.card), side: const BorderSide(color: MQ.line)),
            child: InkWell(
              borderRadius: BorderRadius.circular(R.card),
              onTap: it.$4,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: Sp.m, horizontal: 2),
                child: Column(children: [
                  Stack(clipBehavior: Clip.none, children: [
                    Icon(it.$1, size: 30, color: MQ.forest),
                    if (it.$3 > 0)
                      PositionedDirectional(
                          top: -6,
                          end: -10,
                          child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(color: MQ.danger, borderRadius: BorderRadius.circular(R.pill)),
                              child: Text('${it.$3}', style: MQ.caption(color: Colors.white, weight: FontWeight.w700)))),
                  ]),
                  const SizedBox(height: Sp.s),
                  Text(it.$2, textAlign: TextAlign.center, maxLines: 2, style: MQ.caption(color: MQ.ink, weight: FontWeight.w600)),
                ]),
              ),
            ),
          ),
        ),
      ],
    ]);
  }
}

/* ── الأتعاب والدفعات ── */
class _FeesCard extends StatelessWidget {
  const _FeesCard({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final c = store.client;
    final fee = (c['fee'] ?? 0) as num, paid = (c['paid'] ?? 0) as num;
    final frac = fee > 0 ? (paid / fee).clamp(0.0, 1.0).toDouble() : 0.0;
    return Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(Sp.m + 2),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.account_balance_wallet_rounded, size: 20, color: MQ.ok),
          const SizedBox(width: Sp.s),
          Expanded(child: Text('الأتعاب', style: MQ.subhead(weight: FontWeight.w700))),
        ]),
        const SizedBox(height: Sp.m),
        Text('المتبقي', style: MQ.caption()),
        FittedBox(fit: BoxFit.scaleDown, alignment: AlignmentDirectional.centerStart, child: Text(money(fee - paid), style: MQ.title2())),
        const SizedBox(height: Sp.s),
        ClipRRect(borderRadius: BorderRadius.circular(R.pill), child: LinearProgressIndicator(value: frac, minHeight: 6, color: MQ.ok, backgroundColor: MQ.sunk)),
        const SizedBox(height: Sp.s),
        Text('دفعت ${money(paid)} من ${money(fee)}', style: MQ.caption()),
      ]),
    );
  }
}

/* ── أحدث المستندات ── */
class _DocsCard extends StatelessWidget {
  const _DocsCard({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final docs = store.docs.take(3).toList();
    return Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(Sp.m + 2),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.description_rounded, size: 20, color: MQ.docBlue),
          const SizedBox(width: Sp.s),
          Expanded(child: Text('أحدث المستندات', style: MQ.subhead(weight: FontWeight.w700))),
        ]),
        const SizedBox(height: Sp.s),
        if (docs.isEmpty) Text('لا مستندات مشاركة بعد.', style: MQ.footnote()),
        for (final d in docs)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(children: [
              const Icon(Icons.picture_as_pdf_rounded, size: 18, color: MQ.danger),
              const SizedBox(width: Sp.s),
              Expanded(child: Text('${d['title']}', maxLines: 2, overflow: TextOverflow.ellipsis, style: MQ.footnote(color: MQ.ink, weight: FontWeight.w500))),
            ]),
          ),
      ]),
    );
  }
}

/// بطاقة قضية مختصرة
class CaseSummary extends StatelessWidget {
  const CaseSummary({super.key, required this.kase, this.onTap, this.detailed = false});
  final Map<String, dynamic> kase;
  final VoidCallback? onTap;
  final bool detailed;
  @override
  Widget build(BuildContext context) {
    final steps = store.steps;
    final step = (kase['step'] as num? ?? 0).toInt();
    final (sb, sf) = caseStatusColors('${kase['status'] ?? ''}');
    return Panel(
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text.rich(TextSpan(children: [
            TextSpan(text: 'قضية ', style: MQ.footnote()),
            TextSpan(text: '${kase['no']}', style: MQ.mono(13, color: MQ.muted)),
          ])),
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
        if (detailed) ..._footer(),
      ]),
    );
  }

  /// تذييل البطاقة في «قضاياي»: الجلسة القادمة لهذه القضية وعدد الجلسات ورابط التفاصيل
  List<Widget> _footer() {
    final hs = ((kase['hearings'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e)).toList();
    final now = DateTime.now();
    final next = hs.map((h) => (h: h, t: parseDate('${h['date']}', '${h['time'] ?? '00:00'}'))).where((x) => x.t.isAfter(now)).toList()
      ..sort((a, b) => a.t.compareTo(b.t));
    final n = next.isEmpty ? null : next.first;
    return [
      const SizedBox(height: Sp.m),
      const Divider(height: 1),
      const SizedBox(height: Sp.m),
      Row(children: [
        Icon(n == null ? Icons.event_busy_outlined : Icons.event_available_rounded, size: 18, color: n == null ? MQ.muted : MQ.forest),
        const SizedBox(width: Sp.s),
        Expanded(
          child: n == null
              ? Text('لا جلسة قادمة محددة', style: MQ.footnote())
              : Text.rich(TextSpan(children: [
                  TextSpan(text: 'الجلسة القادمة: ', style: MQ.footnote()),
                  TextSpan(text: '${fmtDate(n.t)} · ${relDay(n.t)}', style: MQ.footnote(color: MQ.ink, weight: FontWeight.w600)),
                ])),
        ),
      ]),
      const SizedBox(height: Sp.s),
      Row(children: [
        const Icon(Icons.gavel_rounded, size: 18, color: MQ.muted),
        const SizedBox(width: Sp.s),
        Expanded(child: Text(hs.isEmpty ? 'لم تُعقد جلسات بعد' : 'عدد الجلسات: ${hs.length}', style: MQ.footnote())),
        Text('التفاصيل', style: MQ.footnote(color: MQ.forest, weight: FontWeight.w700)),
        const Icon(Icons.chevron_left_rounded, size: 20, color: MQ.forest),
      ]),
    ];
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
