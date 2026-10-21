import 'package:flutter/material.dart';
import 'api.dart';
import 'theme.dart';
import 'util.dart';
import 'package:flutter/foundation.dart';
import 'platform/push_stub.dart' if (dart.library.js_interop) 'platform/push_web.dart' if (dart.library.io) 'platform/push_io.dart';
export 'platform/push_stub.dart' if (dart.library.js_interop) 'platform/push_web.dart' if (dart.library.io) 'platform/push_io.dart' show pushResume, pushForget;

/// بطاقة تفعيل الإشعارات: تنبيه بصوت ونص حين يرسل المحامي رسالة أو إشعاراً، حتى والتطبيق مغلق
class PushPrompt extends StatefulWidget {
  const PushPrompt({super.key, this.compact = false});
  final bool compact;
  @override
  State<PushPrompt> createState() => _PushPromptState();
}

class _PushPromptState extends State<PushPrompt> {
  late String status = pushStatus();
  bool busy = false;
  final ios = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  @override
  void initState() {
    super.initState();
    pushRefresh().then((v) {
      if (mounted && v != status) setState(() => status = v);
    });
  }

  Future<void> _enable() async {
    setState(() => busy = true);
    final r = await enablePush(Api.code ?? '');
    if (!mounted) return;
    setState(() {
      busy = false;
      status = pushStatus();
    });
    snack(
        context,
        switch (r) {
          'granted' => 'فُعّلت الإشعارات على هذا الجهاز.',
          'denied' => ios
              ? 'رُفض الإذن. فعّله من الإعدادات ← ميثاق ← الإشعارات.'
              : 'رُفض الإذن. فعّل الإشعارات من إعدادات المتصفح لهذا الموقع.',
          'server' => 'خدمة الإشعارات غير مفعّلة على خادم المكتب بعد.',
          'unsupported' => 'هذا المتصفح لا يدعم الإشعارات. استخدم Chrome أو أضف البوابة إلى الشاشة الرئيسية.',
          _ => 'تعذّر تفعيل الإشعارات، حاول مجدداً.',
        });
  }

  @override
  Widget build(BuildContext context) {
    final on = status == 'granted';
    // في الشاشة الرئيسية تظهر البطاقة فقط إن لم تُفعَّل بعد
    if (!widget.compact && (on || status == 'unsupported')) return const SizedBox.shrink();
    final (icon, title, sub, col) = on
        ? (Icons.notifications_active, 'الإشعارات مفعّلة', 'يصلك تنبيه بصوت ونص عند كل رسالة أو إشعار من المكتب.', MQ.ok)
        : status == 'denied'
            ? (Icons.notifications_off_outlined, 'الإشعارات محظورة',
                ios ? 'اسمح بها من إعدادات الآيفون ← ميثاق ← الإشعارات.' : 'اسمح بالإشعارات لهذا الموقع من إعدادات المتصفح.', MQ.danger)
            : status == 'unsupported'
                ? (Icons.notifications_none, 'الإشعارات', 'تُفعَّل في تطبيق الهاتف بعد ربط خدمة الإشعارات.', MQ.muted)
                : (Icons.notifications_active_outlined, 'فعّل التنبيهات',
                    'ليصلك تنبيه بصوت ونص عند رسالة المحامي، حتى والتطبيق مغلق.', MQ.brass);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: on ? MQ.okSoft : (status == 'default' ? MQ.brassSoft : MQ.surface),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: col.withValues(alpha: .35)),
      ),
      child: Row(children: [
        Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: col.withValues(alpha: .14), shape: BoxShape.circle),
            child: Icon(icon, color: col)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: MQ.callout(weight: FontWeight.w700)),
            Text(sub, style: MQ.footnote()),
          ]),
        ),
        if (status == 'default') ...[
          const SizedBox(width: 8),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(0, 42), padding: const EdgeInsets.symmetric(horizontal: 16)),
            onPressed: busy ? null : _enable,
            child: busy
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: MQ.onGold))
                : const Text('تفعيل'),
          ),
        ],
      ]),
    );
  }
}
