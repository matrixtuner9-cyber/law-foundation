import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'theme.dart';

double _wrap(double v) => ((v % 1) + 1) % 1;

/// خلفية شاشة الدخول الحيّة: وهج ذهبي متحرك، أعمدة محكمة، غبار ذهبي طائر،
/// وصورة فوتوغرافية اختيارية (assets/images/login_bg.jpg) تُدمج تحت الطبقات
class JusticeScene extends StatefulWidget {
  const JusticeScene({super.key});
  @override
  State<JusticeScene> createState() => _JusticeSceneState();
}

class _JusticeSceneState extends State<JusticeScene> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(seconds: 26))..repeat();
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Stack(fit: StackFit.expand, children: [
        AnimatedBuilder(animation: c, builder: (_, __) => CustomPaint(painter: _BasePainter(c.value))),
        Image.asset('assets/images/login_bg.jpg',
            fit: BoxFit.cover,
            opacity: const AlwaysStoppedAnimation(.42),
            errorBuilder: (_, __, ___) => const SizedBox.shrink()),
        AnimatedBuilder(animation: c, builder: (_, __) => CustomPaint(painter: _FrontPainter(c.value))),
      ]),
    );
  }
}

class _BasePainter extends CustomPainter {
  _BasePainter(this.t);
  final double t;
  @override
  void paint(Canvas canvas, Size s) {
    final r = Offset.zero & s;
    canvas.drawRect(
        r,
        Paint()
          ..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [
            Color(0xFF16264A),
            Color(0xFF0B1224),
            MQ.forestDeep,
          ]).createShader(r));
    final c = Offset(s.width * (.5 + .22 * math.sin(2 * math.pi * t)), s.height * (.2 + .04 * math.cos(2 * math.pi * t)));
    canvas.drawRect(
        r,
        Paint()
          ..shader = RadialGradient(colors: [MQ.pine.withValues(alpha: .26), MQ.pine.withValues(alpha: .06), Colors.transparent], stops: const [0, .45, 1])
              .createShader(Rect.fromCircle(center: c, radius: s.height * .6)));
  }

  @override
  bool shouldRepaint(_BasePainter o) => o.t != t;
}

class _FrontPainter extends CustomPainter {
  _FrontPainter(this.t);
  final double t;
  static final _rnd = math.Random(11);
  static final List<List<double>> _dust = List.generate(54, (_) => [_rnd.nextDouble(), _rnd.nextDouble(), .25 + _rnd.nextDouble() * .75, 1 + _rnd.nextDouble() * 2.2, _rnd.nextDouble()]);

  @override
  void paint(Canvas canvas, Size s) {
    final w = s.width, h = s.height;
    /* أعمدة المحكمة */
    final dx = math.sin(2 * math.pi * t) * 5;
    final col = Paint()..color = MQ.brassHi.withValues(alpha: .07);
    final line = Paint()
      ..color = MQ.brassHi.withValues(alpha: .09)
      ..strokeWidth = 1;
    final top = h * .66;
    final ped = Path()
      ..moveTo(w * .02 + dx, top - h * .03)
      ..lineTo(w * .5 + dx, top - h * .1)
      ..lineTo(w * .98 + dx, top - h * .03)
      ..close();
    canvas.drawPath(ped, col);
    canvas.drawRect(Rect.fromLTRB(w * .02 + dx, top - h * .03, w * .98 + dx, top), col);
    const n = 6;
    final cw = w * .1;
    for (var i = 0; i < n; i++) {
      final x = w * .07 + (w * .86 - cw) * i / (n - 1) + dx;
      canvas.drawRect(Rect.fromLTWH(x - 4, top, cw + 8, h * .012), col);
      canvas.drawRect(Rect.fromLTWH(x, top + h * .012, cw, h - top), col);
      for (var k = 1; k < 4; k++) {
        canvas.drawLine(Offset(x + cw * k / 4, top + h * .012), Offset(x + cw * k / 4, h), line);
      }
    }
    /* غبار ذهبي */
    for (final d in _dust) {
      final y = h - _wrap(d[1] + t * d[2] * 1.0) * h;
      final x = d[0] * w + math.sin(2 * math.pi * (t * (1 + d[2]) + d[4])) * 14;
      final tw = .5 + .5 * math.sin(2 * math.pi * (t * 3 + d[4]));
      canvas.drawCircle(Offset(x, y), d[3], Paint()..color = MQ.brassHi.withValues(alpha: .12 + .4 * tw));
    }
    /* تعتيم الأطراف */
    final r = Offset.zero & s;
    canvas.drawRect(
        r,
        Paint()
          ..shader = RadialGradient(center: const Alignment(0, -.2), radius: 1.15, colors: [Colors.transparent, Colors.black.withValues(alpha: .6)], stops: const [.55, 1])
              .createShader(r));
  }

  @override
  bool shouldRepaint(_FrontPainter o) => o.t != t;
}

/// ميزان العدالة الذهبي: الكفتان تتأرجحان بلطف وتتوهج
class ScalesOfJustice extends StatefulWidget {
  const ScalesOfJustice({super.key, this.size = 200});
  final double size;
  @override
  State<ScalesOfJustice> createState() => _ScalesState();
}

class _ScalesState extends State<ScalesOfJustice> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(seconds: 7))..repeat();
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: SizedBox(
          width: widget.size,
          height: widget.size,
          child: AnimatedBuilder(animation: c, builder: (_, __) => CustomPaint(painter: _ScalesPainter(c.value))),
        ),
      );
}

class _ScalesPainter extends CustomPainter {
  _ScalesPainter(this.t);
  final double t;

  @override
  void paint(Canvas canvas, Size s) {
    final w = s.width, h = s.height;
    final cx = w / 2;
    final ang = .16 * math.sin(2 * math.pi * t) * (.78 + .22 * math.sin(2 * math.pi * t * 2 + 1));
    final pivot = Offset(cx, h * .2);
    final whole = Offset.zero & s;
    final gold = Paint()
      ..shader = const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFF6E3A6), MQ.brassHi, MQ.pine, MQ.goldLo]).createShader(whole);
    final glowC = Offset(cx, h * .5);
    canvas.drawCircle(
        glowC,
        w * .55,
        Paint()
          ..shader = RadialGradient(colors: [MQ.pine.withValues(alpha: .30 + .06 * math.sin(2 * math.pi * t)), Colors.transparent]).createShader(Rect.fromCircle(center: glowC, radius: w * .55)));
    /* القاعدة والعمود */
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(cx, h * .955), width: w * .46, height: h * .05), const Radius.circular(6)), gold);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(cx, h * .91), width: w * .32, height: h * .045), const Radius.circular(5)), gold);
    final pillar = Path()
      ..moveTo(cx - w * .026, pivot.dy)
      ..lineTo(cx + w * .026, pivot.dy)
      ..lineTo(cx + w * .04, h * .89)
      ..lineTo(cx - w * .04, h * .89)
      ..close();
    canvas.drawPath(pillar, gold);
    canvas.drawCircle(Offset(cx, h * .115), w * .022, gold);
    /* الذراع */
    final half = w * .4;
    canvas.save();
    canvas.translate(pivot.dx, pivot.dy);
    canvas.rotate(ang);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTRB(-half, -h * .011, half, h * .011), const Radius.circular(4)), gold);
    canvas.drawLine(
        Offset(-half, -h * .006),
        Offset(half, -h * .006),
        Paint()
          ..color = Colors.white.withValues(alpha: .35)
          ..strokeWidth = 1);
    canvas.drawCircle(Offset(-half, 0), w * .02, gold);
    canvas.drawCircle(Offset(half, 0), w * .02, gold);
    canvas.restore();
    canvas.drawCircle(pivot, w * .042, gold);
    canvas.drawCircle(pivot, w * .016, Paint()..color = MQ.forestDeep);
    /* الكفتان */
    final l = Offset(pivot.dx - half * math.cos(ang), pivot.dy - half * math.sin(ang));
    final r = Offset(pivot.dx + half * math.cos(ang), pivot.dy + half * math.sin(ang));
    for (final e in [l, r]) {
      _pan(canvas, e, w, h, gold);
    }
    /* وهج الشرارة على الكفة الهابطة */
    final low = ang > 0 ? r : l;
    canvas.drawCircle(low.translate(0, h * .36), w * .02 + 3 * (ang.abs() * 6), Paint()..color = MQ.brassHi.withValues(alpha: .25));
  }

  void _pan(Canvas canvas, Offset end, double w, double h, Paint gold) {
    final len = h * .34;
    final pc = end.translate(0, len);
    final pw = w * .3;
    final chain = Paint()
      ..color = MQ.brassHi.withValues(alpha: .85)
      ..strokeWidth = 1.3
      ..style = PaintingStyle.stroke;
    canvas.drawLine(end, pc.translate(-pw / 2, 0), chain);
    canvas.drawLine(end, pc.translate(pw / 2, 0), chain);
    canvas.drawLine(end, pc, chain..color = MQ.brassHi.withValues(alpha: .45));
    final rect = Rect.fromCenter(center: pc, width: pw, height: h * .13);
    final bowl = Path()
      ..addArc(rect, 0, math.pi)
      ..close();
    canvas.drawPath(bowl, gold);
    canvas.drawPath(
        bowl,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2
          ..color = Colors.white.withValues(alpha: .35));
    canvas.drawOval(Rect.fromCenter(center: pc, width: pw, height: h * .022), Paint()..color = MQ.brassHi);
  }

  @override
  bool shouldRepaint(_ScalesPainter o) => o.t != t;
}
