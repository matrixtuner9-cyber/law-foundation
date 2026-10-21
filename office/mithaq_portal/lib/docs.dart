import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'attach.dart';
import 'home.dart';
import 'push.dart';
import 'settings.dart';
import 'store.dart';
import 'theme.dart';
import 'util.dart';

/* ── المستندات ── */
class DocsTab extends StatelessWidget {
  const DocsTab({super.key, required this.onGo});
  final GoTo onGo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المستندات')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: MQ.forest,
        foregroundColor: MQ.brassHi,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: MQ.gold.withValues(alpha: .6))),
        onPressed: () => Attach.sheet(context),
        icon: const Icon(Icons.add_a_photo_outlined),
        label: Text('إرفاق وثيقة', style: MQ.body(14, color: MQ.onGold, weight: FontWeight.w700)),
      ),
      body: ListenableBuilder(
        listenable: store,
        builder: (context, _) {
          final office = store.docs;
          final mine = store.all.where((m) => m.mine && (m.type == 'image' || m.type == 'file')).toList().reversed.toList();
          return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 100), children: [
            _section('من المكتب', 'مستندات قضاياك التي شاركها المحامي معك', office.length),
            if (office.isEmpty)
              _empty('لم يشارك المكتب مستندات بعد.')
            else
              Panel(
                padding: EdgeInsets.zero,
                child: Column(children: [
                  for (final (i, d) in office.indexed) ...[
                    if (i > 0) const Divider(height: 1, indent: 72),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      leading: _kindIcon('${d['kind']}'),
                      title: Text('${d['title']}', style: MQ.body(14.5, weight: FontWeight.w600, height: 1.4)),
                      subtitle: Text('${d['kind']} · القضية ${d['caseNo']} · ${dmy(parseDate(d['date']))} · ${d['pages']} ص',
                          style: MQ.body(12, color: MQ.muted)),
                    ),
                  ],
                ]),
              ),
            _section('أرسلتها للمكتب', 'الصور والمستندات التي أرفقتها', mine.length),
            if (mine.isEmpty)
              _empty('صوّر وثيقة بالكاميرا أو أرفق ملفاً من جهازك، وستظهر هنا.')
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 220, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: .82),
                itemCount: mine.length,
                itemBuilder: (_, i) {
                  final m = mine[i];
                  return Panel(
                    padding: EdgeInsets.zero,
                    onTap: m.file == null ? null : () => launchUrl(Uri.parse(Api.url(m.file!)), webOnlyWindowName: '_blank'),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
                          child: m.type == 'image'
                              ? (m.local != null
                                  ? Image.memory(m.local!, fit: BoxFit.cover)
                                  : Image.network(Api.url(m.file!), fit: BoxFit.cover, errorBuilder: (_, __, ___) => _fileFace(m.ext)))
                              : _fileFace(m.ext),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(m.name ?? 'مرفق', maxLines: 1, overflow: TextOverflow.ellipsis, style: MQ.body(12.5, weight: FontWeight.w600)),
                          Row(children: [
                            Expanded(child: Text(dmy(m.time), style: MQ.body(11, color: MQ.muted))),
                            if (m.pending)
                              const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.6))
                            else if (m.failed)
                              const Icon(Icons.error_outline, size: 15, color: MQ.danger)
                            else
                              Icon(Icons.cloud_done_outlined, size: 15, color: MQ.ok.withValues(alpha: .8)),
                          ]),
                        ]),
                      ),
                    ]),
                  );
                },
              ),
          ]);
        },
      ),
    );
  }

  Widget _fileFace(String? ext) {
    final (col, label) = extStyle(ext);
    return Container(
      color: col.withValues(alpha: .08),
      alignment: Alignment.center,
      child: Container(
        width: 54,
        height: 66,
        alignment: Alignment.bottomCenter,
        padding: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(color: col, borderRadius: BorderRadius.circular(8)),
        child: Text(label, style: MQ.mono(11, color: Colors.white, weight: FontWeight.w700)),
      ),
    );
  }

  Widget _kindIcon(String kind) {
    final (ic, col) = switch (kind) {
      'حكم' => (Icons.gavel, MQ.brass),
      'لائحة' => (Icons.article_outlined, MQ.pine),
      'قرار' => (Icons.assignment_turned_in_outlined, MQ.brass),
      'بينة خطية' => (Icons.receipt_long_outlined, MQ.docBlue),
      'إنذار' => (Icons.campaign_outlined, MQ.danger),
      _ => (Icons.description_outlined, MQ.muted),
    };
    return Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(color: col.withValues(alpha: .1), borderRadius: BorderRadius.circular(12)),
        child: Icon(ic, color: col));
  }

  Widget _section(String t, String sub, int n) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(t, style: MQ.display(21)),
              Text(sub, style: MQ.body(12.5, color: MQ.muted)),
            ]),
          ),
          Chip2('$n', bg: MQ.line, fg: MQ.muted),
        ]),
      );

  Widget _empty(String t) => Panel(
      child: Row(children: [
        const Icon(Icons.inbox_outlined, color: MQ.muted),
        const SizedBox(width: 10),
        Expanded(child: Text(t, style: MQ.body(13.5, color: MQ.muted))),
      ]));
}

/* ── حسابي: الأتعاب وبيانات المكتب ── */
class AccountTab extends StatelessWidget {
  const AccountTab({super.key, required this.onLogout});
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('حسابي'), actions: [
        IconButton(
          tooltip: 'الإعدادات',
          icon: const Icon(Icons.settings_outlined),
          onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsPage())),
        ),
      ]),
      body: ListenableBuilder(
        listenable: store,
        builder: (context, _) {
          final c = store.client, o = store.office;
          final fee = (c['fee'] ?? 0) as num, paid = (c['paid'] ?? 0) as num;
          final frac = fee > 0 ? (paid / fee).clamp(0.0, 1.0).toDouble() : 0.0;
          return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 32), children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(begin: Alignment.topRight, end: Alignment.bottomLeft, colors: [MQ.navy2, MQ.forest]),
              ),
              child: Row(children: [
                SizedBox(
                  width: 112,
                  height: 112,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: frac),
                    duration: const Duration(milliseconds: 1200),
                    curve: Curves.easeOutCubic,
                    builder: (_, v, __) => CustomPaint(
                      painter: _Ring(v),
                      child: Center(
                          child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Text('${(v * 100).round()}%', style: MQ.mono(22, color: Colors.white)),
                        Text('مدفوع', style: MQ.body(11, color: MQ.soft)),
                      ])),
                    ),
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('الأتعاب', style: MQ.body(13, color: MQ.soft)),
                    Text(money(fee - paid), style: MQ.display(30, color: Colors.white)),
                    Text('المتبقي', style: MQ.body(12, color: MQ.brassHi, weight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text('دفعت ${money(paid)} من ${money(fee)}', style: MQ.body(12.5, color: Colors.white70)),
                  ]),
                ),
              ]),
            ),
            const SizedBox(height: 16),
            const PushPrompt(compact: true),
            const SizedBox(height: 16),
            Panel(
              child: Column(children: [
                _row(Icons.person_outline, 'الاسم', '${c['name'] ?? ''}'),
                _row(Icons.badge_outlined, 'رمز البوابة', '${c['code'] ?? ''}', mono: true),
                _row(Icons.category_outlined, 'الصفة', '${c['type'] ?? ''}'),
                _row(Icons.notifications_none, 'قناة الإشعارات', '${c['ch'] ?? ''}'),
                _row(Icons.phone_outlined, 'الهاتف', '${c['phone'] ?? '—'}', mono: true),
                _row(Icons.chat_outlined, 'واتساب', '${(c['whatsapp'] ?? '').toString().isEmpty ? '—' : c['whatsapp']}', mono: true),
                const SizedBox(height: 6),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsPage())),
                  icon: const Icon(Icons.settings_outlined),
                  label: const Text('الإعدادات: الأرقام والبصمة'),
                ),
              ]),
            ),
            const SizedBox(height: 16),
            Panel(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Seal(size: 40, color: MQ.brass),
                  const SizedBox(width: 12),
                  Expanded(child: Text('${o['name'] ?? ''}', style: MQ.body(14.5, weight: FontWeight.w700, height: 1.4))),
                ]),
                const SizedBox(height: 12),
                _row(Icons.gavel_outlined, 'المحامي', '${o['lawyer'] ?? ''}'),
                _row(Icons.call_outlined, 'الهاتف', '${o['phone'] ?? ''}', mono: true, selectable: true),
                _row(Icons.schedule_outlined, 'الدوام', '${o['hours'] ?? ''}'),
                _row(Icons.place_outlined, 'المدينة', '${o['city'] ?? ''}'),
              ]),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onLogout,
              icon: const Icon(Icons.logout, color: MQ.danger),
              label: Text('تسجيل الخروج', style: MQ.body(14, color: MQ.danger, weight: FontWeight.w600)),
            ),
          ]);
        },
      ),
    );
  }

  Widget _row(IconData ic, String k, String v, {bool mono = false, bool selectable = false}) {
    final style = mono ? MQ.mono(14) : MQ.body(14, weight: FontWeight.w600);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(children: [
        Icon(ic, size: 19, color: MQ.muted),
        const SizedBox(width: 10),
        SizedBox(width: 104, child: Text(k, style: MQ.body(13, color: MQ.muted))),
        Expanded(child: selectable ? SelectableText(v, style: style) : Text(v, style: style)),
      ]),
    );
  }
}

class _Ring extends CustomPainter {
  _Ring(this.v);
  final double v;
  @override
  void paint(Canvas canvas, Size s) {
    final r = Rect.fromLTWH(6, 6, s.width - 12, s.height - 12);
    final bg = Paint()
      ..color = Colors.white.withValues(alpha: .12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10;
    final fg = Paint()
      ..color = MQ.mint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(r, 0, math.pi * 2, false, bg);
    canvas.drawArc(r, -math.pi / 2, math.pi * 2 * v, false, fg);
  }

  @override
  bool shouldRepaint(covariant _Ring old) => old.v != v;
}
