import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'notify_panel.dart';
import 'push.dart';
import 'store.dart';
import 'theme.dart';
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

  Widget _field(TextEditingController c, String label, IconData ic, {String? hint, bool enabled = true}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: c,
          enabled: enabled,
          keyboardType: TextInputType.phone,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.right,
          style: MQ.mono(16),
          decoration: InputDecoration(labelText: label, hintText: hint, prefixIcon: Icon(ic, color: MQ.muted)),
        ),
      );

  Widget _section(String t, String sub, List<Widget> children) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Panel(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(t, style: MQ.display(21)),
            Text(sub, style: MQ.body(12.5, color: MQ.muted)),
            const SizedBox(height: 14),
            ...children,
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 32), children: [
        _section('أرقام التواصل', 'يستخدمها المكتب للتواصل معك وإرسال التذكيرات', [
          _field(phone, 'رقم الهاتف', Icons.phone_outlined, hint: '0599-000-000'),
          _field(phone2, 'رقم هاتف إضافي (اختياري)', Icons.phone_forwarded_outlined),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: waSame,
            activeColor: MQ.pine,
            onChanged: (v) => setState(() => waSame = v),
            title: Text('واتساب على نفس رقم الهاتف', style: MQ.body(14, weight: FontWeight.w600)),
          ),
          if (!waSame) _field(wa, 'رقم واتساب', Icons.chat_outlined, hint: '+970 59 000 0000'),
          const SizedBox(height: 4),
          FilledButton.icon(
            onPressed: saving ? null : _save,
            icon: saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: MQ.onGold))
                : const Icon(Icons.save_outlined),
            label: const Text('حفظ الأرقام'),
          ),
        ]),
        if (!kIsWeb)
          _section('الأمان', 'احمِ معلومات قضاياك على هاتفك', [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: bioOn,
              activeColor: MQ.pine,
              onChanged: bioOk ? _toggleBio : null,
              secondary: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: MQ.pineSoft, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.fingerprint, color: MQ.pine, size: 28),
              ),
              title: Text('الدخول بالبصمة', style: MQ.body(15, weight: FontWeight.w700)),
              subtitle: Text(bioOk ? 'يُطلب البصمة أو رمز قفل الهاتف عند فتح التطبيق' : 'هذا الهاتف لا يدعم البصمة أو قفل الشاشة',
                  style: MQ.body(12.5, color: MQ.muted)),
            ),
          ]),
        _section('الإشعارات', 'تنبيه بصوت ونص عند رسائل المحامي', [
          if (kIsWeb)
            const PushPrompt(compact: true)
          else
            const NotifyPanel(),
        ]),
        if (!kIsWeb)
          _section('الاتصال', 'عنوان خادم المكتب الذي يتصل به التطبيق', [
            SelectableText(Api.base, style: MQ.mono(14), textDirection: TextDirection.ltr),
          ]),
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
                Text('بوابة الموكل', style: MQ.display(30, color: Colors.white)),
                Text(store.firstName, style: MQ.body(15, color: MQ.soft)),
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
                Text('المس للدخول بالبصمة', style: MQ.body(14, color: Colors.white)),
                const SizedBox(height: 30),
                TextButton(
                    onPressed: widget.onLogout,
                    child: Text('الدخول بحساب آخر', style: MQ.body(13, color: MQ.soft))),
              ]),
            ),
          ),
        ),
      );
}
