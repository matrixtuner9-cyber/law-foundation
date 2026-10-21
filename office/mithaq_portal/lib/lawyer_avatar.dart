import 'package:flutter/material.dart';
import 'api.dart';
import 'store.dart';
import 'theme.dart';

/// صورة محامي المكتب كما اختارها المكتب (وإلا الحرف الأول من اسمه)
class LawyerAvatar extends StatelessWidget {
  const LawyerAvatar({super.key, this.size = 46, this.dark = true});
  final double size;
  final bool dark;

  String get _letter {
    final n = '${store.office['lawyer'] ?? 'م'}'.replaceFirst(RegExp(r'^(المحامي|المحامية|الأستاذ)\s+'), '').trim();
    return n.isEmpty ? 'م' : n.characters.first;
  }

  @override
  Widget build(BuildContext context) {
    final v = store.office['photo'];
    final fallback = Text(_letter, style: MQ.title2(color: MQ.brassHi).copyWith(fontSize: size * .44));
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
          shape: BoxShape.circle, color: dark ? MQ.forest : MQ.sunk, border: Border.all(color: MQ.gold.withValues(alpha: .7), width: 1.5)),
      alignment: Alignment.center,
      child: v == null || Api.code == null
          ? fallback
          : Image.network(Api.url('/api/portal/lawyer-photo?v=$v'),
              headers: {'x-client': Api.code!},
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => fallback),
    );
  }
}
