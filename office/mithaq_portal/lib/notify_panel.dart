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
  bool? on, power;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final v = await notifyEnabled(), w = await powerOk();
    if (mounted) setState(() { on = v; power = w; });
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
      const SizedBox(height: 14),
      Row(children: [
        Icon((power ?? true) ? Icons.battery_charging_full_rounded : Icons.battery_alert_rounded, color: (power ?? true) ? MQ.ok : MQ.warn),
        const SizedBox(width: 10),
        Expanded(
            child: Text(
                (power ?? true)
                    ? 'التطبيق مستثنى من توفير البطارية، فلن يوقفه الهاتف.'
                    : 'توفير البطارية قد يوقف استقبال التنبيهات والتطبيق مغلق.',
                style: MQ.subhead())),
      ]),
      if (!(power ?? true)) ...[
        const SizedBox(height: 8),
        FilledButton.icon(
          onPressed: () async {
            await powerRequest();
            await Future.delayed(const Duration(seconds: 1));
            await _refresh();
          },
          icon: const Icon(Icons.battery_saver_outlined),
          label: const Text('السماح بالعمل في الخلفية'),
        ),
      ],
      const SizedBox(height: 8),
      OutlinedButton.icon(
        onPressed: () async {
          final ok = await openAutostart();
          if (!ok && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فعّل «التشغيل التلقائي» و«السماح بالعمل في الخلفية» لبوابة ميثاق من هذه الشاشة.')));
          }
        },
        icon: const Icon(Icons.rocket_launch_outlined),
        label: const Text('تفعيل التشغيل التلقائي'),
      ),
      const SizedBox(height: 10),
      Text('لهواتف شاومي وهواوي وأوبو وفيفو: فعّل «التشغيل التلقائي»، ولا تُغلق البوابة من قائمة التطبيقات الأخيرة. يبقى إشعار «متصلة» الهادئ ظاهراً؛ فهو ما يضمن وصول رسائل المكتب.',
          style: MQ.footnote()),
    ]);
  }
}
