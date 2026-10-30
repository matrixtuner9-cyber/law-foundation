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
import 'ui.dart';
import 'util.dart';

/* ── المستندات ── */
class DocsTab extends StatelessWidget {
  const DocsTab({super.key, required this.onGo});
  final GoTo onGo;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final office = store.docs;
        final mine = store.all.where((m) => m.mine && (m.type == 'image' || m.type == 'file')).toList().reversed.toList();
        return LargeTitlePage(
          title: 'المستندات',
          bottomPad: 100,
          fab: FloatingActionButton.extended(
            backgroundColor: MQ.forest,
            foregroundColor: MQ.brassHi,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(R.card), side: BorderSide(color: MQ.gold.withValues(alpha: .6))),
            onPressed: () => Attach.sheet(context),
            icon: const Icon(Icons.add_a_photo_outlined),
            label: Text('إرفاق وثيقة', style: MQ.callout(color: MQ.onGold, weight: FontWeight.w700)),
          ),
          slivers: [
            SliverToBoxAdapter(child: SectionLabel('من المكتب (${office.length})', padding: const EdgeInsets.fromLTRB(Sp.page + 4, Sp.s, Sp.page + 4, Sp.s))),
            SliverToBoxAdapter(
              child: office.isEmpty
                  ? const Group(children: [Padding(padding: EdgeInsets.all(Sp.l), child: Text('لم يشارك المكتب مستندات بعد.'))])
                  : Group(children: [
                      for (final d in office)
                        NavRow(
                          title: '${d['title']}',
                          subtitle: '${d['kind']} · القضية ${d['caseNo']} · ${dmy(parseDate(d['date']))} · ${d['pages']} ص',
                          trailing: _kindIcon('${d['kind']}'),
                        ),
                    ]),
            ),
            SliverToBoxAdapter(child: SectionLabel('أرسلتها للمكتب (${mine.length})')),
            if (mine.isEmpty)
              const SliverToBoxAdapter(
                  child: Group(children: [Padding(padding: EdgeInsets.all(Sp.l), child: Text('صوّر وثيقة بالكاميرا أو أرفق ملفاً من جهازك، وستظهر هنا.'))]))
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: Sp.page),
                sliver: SliverGrid.builder(
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 220, mainAxisSpacing: Sp.m, crossAxisSpacing: Sp.m, childAspectRatio: .8),
                  itemCount: mine.length,
                  itemBuilder: (_, i) {
                    final m = mine[i];
                    return Panel(
                      padding: EdgeInsets.zero,
                      onTap: m.file == null ? null : () => launchUrl(Uri.parse(Api.url(m.file!)), webOnlyWindowName: '_blank'),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(R.card - 1)),
                            child: m.type == 'image'
                                ? (m.local != null
                                    ? Image.memory(m.local!, fit: BoxFit.cover)
                                    : Image.network(Api.url(m.file!), fit: BoxFit.cover, errorBuilder: (_, __, ___) => _fileFace(m.ext)))
                                : _fileFace(m.ext),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(Sp.m),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(m.name ?? 'مرفق', maxLines: 1, overflow: TextOverflow.ellipsis, style: MQ.subhead(weight: FontWeight.w600)),
                            Row(children: [
                              Expanded(child: Text(dmy(m.time), style: MQ.caption())),
                              if (m.pending)
                                const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.6))
                              else if (m.failed)
                                const Icon(Icons.error_outline, size: 16, color: MQ.danger)
                              else
                                Icon(Icons.cloud_done_outlined, size: 16, color: MQ.ok.withValues(alpha: .85)),
                            ]),
                          ]),
                        ),
                      ]),
                    );
                  },
                ),
              ),
          ],
        );
      },
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
        child: Text(label, style: MQ.mono(12, color: Colors.white, weight: FontWeight.w700)),
      ),
    );
  }

  Widget _kindIcon(String kind) {
    final (ic, col) = switch (kind) {
      'حكم' => (Icons.gavel, MQ.brass),
      'لائحة' => (Icons.article_outlined, MQ.forest),
      'قرار' => (Icons.assignment_turned_in_outlined, MQ.brass),
      'بينة خطية' => (Icons.receipt_long_outlined, MQ.docBlue),
      'إنذار' => (Icons.campaign_outlined, MQ.danger),
      _ => (Icons.description_outlined, MQ.muted),
    };
    return IconTile(ic, color: col, size: 40);
  }
}

/* ── حسابي: الأتعاب وبيانات المكتب ── */
class AccountTab extends StatelessWidget {
  const AccountTab({super.key, required this.onLogout});
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final c = store.client, o = store.office;
        final fee = (c['fee'] ?? 0) as num, paid = (c['paid'] ?? 0) as num;
        final frac = fee > 0 ? (paid / fee).clamp(0.0, 1.0).toDouble() : 0.0;
        void settings() => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsPage()));
        return LargeTitlePage(
          title: 'حسابي',
          actions: [IconButton(tooltip: 'الإعدادات', icon: const Icon(Icons.settings_outlined), onPressed: settings)],
          slivers: [
            SliverList.list(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(Sp.page, Sp.s, Sp.page, 0),
                child: Container(
                  padding: const EdgeInsets.all(Sp.xl),
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(R.card + 4), gradient: MQ.navyGradient),
                  child: Row(children: [
                    SizedBox(
                      width: 104,
                      height: 104,
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: frac),
                        duration: const Duration(milliseconds: 1200),
                        curve: Curves.easeOutCubic,
                        builder: (_, v, __) => CustomPaint(
                          painter: _Ring(v),
                          child: Center(
                              child: Column(mainAxisSize: MainAxisSize.min, children: [
                            Text('${(v * 100).round()}%', style: MQ.mono(20, color: Colors.white)),
                            Text('مدفوع', style: MQ.caption(color: MQ.soft)),
                          ])),
                        ),
                      ),
                    ),
                    const SizedBox(width: Sp.l),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('المتبقي من الأتعاب', style: MQ.footnote(color: MQ.soft)),
                        FittedBox(fit: BoxFit.scaleDown, alignment: AlignmentDirectional.centerStart, child: Text(money(fee - paid, c['cur']), style: MQ.title1(color: Colors.white))),
                        const SizedBox(height: Sp.xs),
                        Text('دفعت ${money(paid, c['cur'])} من ${money(fee, c['cur'])}', style: MQ.footnote(color: MQ.brassHi)),
                      ]),
                    ),
                  ]),
                ),
              ),
              const SectionLabel('بياناتي'),
              Group(children: [
                InfoRow(icon: Icons.person_outline, label: 'الاسم', value: '${c['name'] ?? ''}'),
                InfoRow(icon: Icons.badge_outlined, label: 'رمز البوابة', value: '${c['code'] ?? ''}', mono: true),
                InfoRow(icon: Icons.category_outlined, label: 'الصفة', value: '${c['type'] ?? ''}'),
                InfoRow(icon: Icons.phone_outlined, label: 'الهاتف', value: '${c['phone'] ?? ''}', mono: true),
                InfoRow(icon: Icons.chat_outlined, label: 'واتساب', value: '${c['whatsapp'] ?? ''}', mono: true),
                NavRow(icon: Icons.tune_rounded, title: 'الإعدادات', subtitle: 'الأرقام والبصمة والإشعارات', onTap: settings),
              ]),
              const SectionLabel('مكتبي'),
              Group(children: [
                Padding(
                  padding: const EdgeInsets.all(Sp.l),
                  child: Row(children: [
                    const Seal(size: 40, color: MQ.brass),
                    const SizedBox(width: Sp.m),
                    Expanded(child: Text('${o['name'] ?? ''}', style: MQ.headline())),
                  ]),
                ),
                InfoRow(icon: Icons.gavel_outlined, label: 'المحامي', value: '${o['lawyer'] ?? ''}'),
                InfoRow(icon: Icons.call_outlined, label: 'الهاتف', value: '${o['phone'] ?? ''}', mono: true),
                InfoRow(icon: Icons.schedule_outlined, label: 'الدوام', value: '${o['hours'] ?? ''}'),
                InfoRow(icon: Icons.place_outlined, label: 'المدينة', value: '${o['city'] ?? ''}'),
              ]),
              const SizedBox(height: Sp.xl),
              Group(children: [NavRow(icon: Icons.logout, title: 'تسجيل الخروج', destructive: true, onTap: onLogout)]),
            ]),
          ],
        );
      },
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
