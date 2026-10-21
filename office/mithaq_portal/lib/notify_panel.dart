import 'package:flutter/material.dart';
import 'theme.dart';
import 'platform/bg_stub.dart' if (dart.library.io) 'platform/bg_io.dart';

/// حالة تنبيهات الهاتف + زر تجربة التنبيه
class NotifyPanel extends StatefulWidget {
  const NotifyPanel({super.key});
  @override
  State<NotifyPanel> createState() => _NotifyPanelState();
}

class _NotifyPanelState extends State<NotifyPanel> {
  bool? on;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final v = await notifyEnabled();
    if (mounted) setState(() => on = v);
  }

  @override
  Widget build(BuildContext context) {
    final ok = on ?? true;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [
        Icon(ok ? Icons.notifications_active : Icons.notifications_off_outlined, color: ok ? MQ.ok : MQ.danger),
        const SizedBox(width: 10),
        Expanded(
            child: Text(
                ok
                    ? 'مفعّلة: يصلك التنبيه حتى والتطبيق مغلق، ما دام الهاتف متصلاً بالإنترنت.'
                    : 'التنبيهات غير مسموحة لهذا التطبيق. اضغط «السماح بالتنبيهات».',
                style: MQ.subhead())),
      ]),
      const SizedBox(height: 12),
      if (!ok)
        FilledButton.icon(
          onPressed: () async {
            await ensureNotify();
            await _refresh();
          },
          icon: const Icon(Icons.notifications_outlined),
          label: const Text('السماح بالتنبيهات'),
        ),
      if (!ok) const SizedBox(height: 8),
      OutlinedButton.icon(
        onPressed: () async {
          await ensureNotify();
          await testNotify();
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('أُرسل تنبيه تجريبي. إن لم يظهر، راجع إعدادات الإشعارات للتطبيق.')));
          }
          await _refresh();
        },
        icon: const Icon(Icons.campaign_outlined),
        label: const Text('تجربة التنبيه'),
      ),
      const SizedBox(height: 10),
      Text('إن لم تصلك التنبيهات والتطبيق مغلق: الإعدادات ← التطبيقات ← بوابة ميثاق ← البطارية ← «غير مقيّد».',
          style: MQ.footnote()),
    ]);
  }
}
