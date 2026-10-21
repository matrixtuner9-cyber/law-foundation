import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'notify_panel.dart';
import 'office_pick.dart';
import 'push.dart';
import 'store.dart';
import 'theme.dart';
import 'ui.dart';
import 'util.dart';
import 'platform/bio_stub.dart' if (dart.library.io) 'platform/bio_io.dart';

/// إعدادات الموكل: أرقام التواصل، الدخول بالبصمة، الإشعارات
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late final phone = TextEditingController(text: '${store.client['phone'] ?? ''}');
  late final phone2 = TextEditingController(text: '${store.client['phone2'] ?? ''}');
  late final wa = TextEditingController(text: '${store.client['whatsapp'] ?? ''}');
  late bool waSame = wa.text.isEmpty || wa.text == phone.text;
  bool saving = false, bioOk = false, bioOn = false;

  @override
  void initState() {
    super.initState();
    _bio();
  }

  Future<void> _bio() async {
    final ok = await bioAvailable();
    final p = await SharedPreferences.getInstance();
    if (mounted) setState(() {
      bioOk = ok;
      bioOn = p.getBool('bio') ?? false;
    });
  }

  Future<void> _save() async {
    final ph = phone.text.trim(), w = waSame ? ph : wa.text.trim();
    final valid = RegExp(r'^[+\d][\d\s\-]{5,19}$');
    if (ph.isNotEmpty && !valid.hasMatch(ph) || phone2.text.trim().isNotEmpty && !valid.hasMatch(phone2.text.trim()) || w.isNotEmpty && !valid.hasMatch(w)) {
      snack(context, 'تحقق من الأرقام: أرقام فقط، ويمكن أن تبدأ بـ +');
      return;
    }
    setState(() => saving = true);
    try {
      await store.saveProfile(phone: ph, phone2: phone2.text.trim(), whatsapp: w);
      if (mounted) snack(context, 'حُفظت أرقام التواصل ووصلت إلى المكتب');
    } on ApiError catch (e) {
      if (mounted) snack(context, e.message);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> _toggleBio(bool v) async {
    final p = await SharedPreferences.getInstance();
    if (v) {
      final ok = await bioAuth('أكّد بصمتك لتفعيل الدخول بالبصمة');
      if (!ok) {
        if (mounted) snack(context, 'لم يتم التحقق، لم يُفعَّل الدخول بالبصمة');
        return;
      }
    }
    await p.setBool('bio', v);
    setState(() => bioOn = v);
    if (mounted) snack(context, v ? 'سيُطلب منك البصمة عند كل فتح للتطبيق' : 'أُوقف الدخول بالبصمة');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('الإعدادات', style: MQ.title3())),
      body: ListView(padding: const EdgeInsets.only(bottom: Sp.xxl), children: [
        const SectionLabel('أرقام التواصل'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Sp.page),
          child: Panel(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              AppField(label: 'رقم الهاتف', controller: phone, hint: '0599 000 000', icon: Icons.phone_outlined, keyboardType: TextInputType.phone, ltr: true, mono: true, textAlign: TextAlign.left, helper: 'يستخدمه المكتب للتواصل وإرسال التذكيرات'),
              const SizedBox(height: Sp.l),
              AppField(label: 'رقم هاتف إضافي (اختياري)', controller: phone2, icon: Icons.phone_forwarded_outlined, keyboardType: TextInputType.phone, ltr: true, mono: true, textAlign: TextAlign.left),
              const SizedBox(height: Sp.s),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: waSame,
                onChanged: (v) => setState(() => waSame = v),
                title: Text('واتساب على نفس رقم الهاتف', style: MQ.callout(weight: FontWeight.w600)),
              ),
              if (!waSame) ...[
                AppField(label: 'رقم واتساب', controller: wa, hint: '+970 59 000 0000', icon: Icons.chat_outlined, keyboardType: TextInputType.phone, ltr: true, mono: true, textAlign: TextAlign.left),
                const SizedBox(height: Sp.l),
              ],
              FilledButton.icon(
                onPressed: saving ? null : _save,
                icon: saving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: MQ.onGold))
                    : const Icon(Icons.save_outlined),
                label: const Text('حفظ الأرقام'),
              ),
            ]),
          ),
        ),
        if (!kIsWeb) ...[
          const SectionLabel('الأمان'),
          Group(footer: bioOk ? null : 'هذا الهاتف لا يدعم البصمة أو قفل الشاشة', children: [
            SwitchListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: Sp.l, vertical: 4),
              value: bioOn,
              onChanged: bioOk ? _toggleBio : null,
              secondary: const IconTile(Icons.fingerprint, size: 40),
              title: Text('الدخول بالبصمة', style: MQ.callout(weight: FontWeight.w600)),
              subtitle: Text('يُطلب عند فتح التطبيق', style: MQ.footnote()),
            ),
          ]),
        ],
        const SectionLabel('الإشعارات'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Sp.page),
          child: (kIsWeb || defaultTargetPlatform == TargetPlatform.iOS) ? const PushPrompt(compact: true) : const Panel(child: NotifyPanel()),
        ),
        if (!kIsWeb) ...[
          const SectionLabel('مكتبك'),
          Group(footer: 'لتغيير المكتب سجّل الخروج ثم اختر «تغيير» في شاشة الدخول.', children: [
            FutureBuilder<String>(
                future: OfficePick.savedName(),
                builder: (_, s) => InfoRow(icon: Icons.apartment_outlined, label: 'المكتب', value: s.data?.isNotEmpty == true ? s.data! : '${store.office['name'] ?? ''}')),
            InfoRow(icon: Icons.link_rounded, label: 'العنوان', value: Api.base, mono: true),
          ]),
        ],
      ]),
    );
  }
}

/// شاشة القفل: تطلب البصمة قبل عرض بيانات الموكل
class LockScreen extends StatefulWidget {
  const LockScreen({super.key, required this.onUnlock, required this.onLogout});
  final VoidCallback onUnlock;
  final Future<void> Function() onLogout;
  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  bool busy = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _try());
  }

  Future<void> _try() async {
    if (busy) return;
    setState(() => busy = true);
    final ok = await bioAuth('افتح بوابة ميثاق ببصمتك');
    if (!mounted) return;
    setState(() => busy = false);
    if (ok) widget.onUnlock();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: MQ.forest,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Seal(size: 76),
                const SizedBox(height: 16),
                Text('بوابة الموكل', style: MQ.title1(color: Colors.white)),
                Text(store.firstName, style: MQ.callout(color: MQ.soft)),
                const SizedBox(height: 36),
                InkWell(
                  customBorder: const CircleBorder(),
                  onTap: _try,
                  child: Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: .08),
                        border: Border.all(color: MQ.brassHi, width: 1.5)),
                    child: busy
                        ? const Padding(padding: EdgeInsets.all(34), child: CircularProgressIndicator(strokeWidth: 2.4, color: MQ.brassHi))
                        : const Icon(Icons.fingerprint, size: 56, color: MQ.brassHi),
                  ),
                ),
                const SizedBox(height: 14),
                Text('المس للدخول بالبصمة', style: MQ.subhead(color: Colors.white)),
                const SizedBox(height: 30),
                TextButton(
                    onPressed: widget.onLogout,
                    child: Text('الدخول بحساب آخر', style: MQ.footnote(color: MQ.soft))),
              ]),
            ),
          ),
        ),
      );
}
