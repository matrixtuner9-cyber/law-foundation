import 'dart:async';
import 'dart:math' as math;
import 'package:audioplayers/audioplayers.dart';
import 'package:cross_file/cross_file.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:record/record.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'attach.dart';
import 'store.dart';
import 'theme.dart';
import 'util.dart';
import 'platform/tmp_web.dart' if (dart.library.io) 'platform/tmp_io.dart';

/// المراسلة مع المحامي: نص، صوت، صور، مستندات
class ChatTab extends StatefulWidget {
  const ChatTab({super.key});
  @override
  State<ChatTab> createState() => ChatTabState();
}

class ChatTabState extends State<ChatTab> {
  final ctrl = TextEditingController();
  final focus = FocusNode();
  final rec = AudioRecorder();
  bool recording = false;
  DateTime? recStart;
  Timer? recTimer;
  StreamSubscription<Amplitude>? ampSub;
  final List<double> levels = [];
  String recMime = 'audio/webm';

  bool get hasText => ctrl.text.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    ctrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    recTimer?.cancel();
    ampSub?.cancel();
    rec.dispose();
    ctrl.dispose();
    focus.dispose();
    super.dispose();
  }

  void runAction(String a) {
    switch (a) {
      case 'voice':
        startRec();
      case 'camera':
        Attach.pick(context, AttachSource.camera);
      case 'gallery':
        Attach.pick(context, AttachSource.gallery);
      case 'file':
        Attach.pick(context, AttachSource.file);
      case 'attach':
        Attach.sheet(context);
    }
  }

  void sendText() {
    final t = ctrl.text.trim();
    if (t.isEmpty) return;
    ctrl.clear();
    store.sendText(t);
    focus.requestFocus();
  }

  /* ── التسجيل الصوتي ── */
  Future<void> startRec() async {
    if (recording) return;
    try {
      if (!await rec.hasPermission()) {
        if (mounted) snack(context, 'اسمح باستخدام الميكروفون لتسجيل رسالة صوتية.');
        return;
      }
      var enc = AudioEncoder.wav;
      final prefs = kIsWeb ? [AudioEncoder.opus, AudioEncoder.aacLc] : [AudioEncoder.aacLc, AudioEncoder.opus];
      for (final e in prefs) {
        if (await rec.isEncoderSupported(e)) {
          enc = e;
          break;
        }
      }
      recMime = enc == AudioEncoder.opus
          ? (kIsWeb ? 'audio/webm' : 'audio/ogg')
          : enc == AudioEncoder.aacLc
              ? 'audio/mp4'
              : 'audio/wav';
      final ext = enc == AudioEncoder.aacLc ? 'm4a' : enc == AudioEncoder.opus ? 'ogg' : 'wav';
      await rec.start(RecordConfig(encoder: enc, numChannels: 1), path: await tempPath(ext));
      HapticFeedback.mediumImpact();
      levels.clear();
      setState(() {
        recording = true;
        recStart = DateTime.now();
      });
      recTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
        if (!mounted) return;
        setState(() {});
        if (DateTime.now().difference(recStart!).inMinutes >= 5) stopRec(send: true);
      });
      ampSub = rec.onAmplitudeChanged(const Duration(milliseconds: 110)).listen((a) {
        final v = ((a.current + 50) / 50).clamp(0.05, 1.0).toDouble();
        levels.add(v);
        if (levels.length > 60) levels.removeAt(0);
      });
    } catch (e) {
      if (mounted) snack(context, 'تعذّر بدء التسجيل على هذا الجهاز.');
    }
  }

  Future<void> stopRec({required bool send}) async {
    if (!recording) return;
    recTimer?.cancel();
    await ampSub?.cancel();
    final secs = DateTime.now().difference(recStart!).inMilliseconds / 1000;
    String? path;
    try {
      path = await rec.stop();
    } catch (_) {}
    setState(() => recording = false);
    if (!send || path == null) return;
    if (secs < 1) {
      if (mounted) snack(context, 'التسجيل قصير جداً. اضغط على الميكروفون وتحدّث ثم أرسل.');
      return;
    }
    final bytes = await XFile(path).readAsBytes();
    store.sendVoice(bytes, recMime, secs);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MQ.ivory,
      body: Column(children: [
        _header(context),
        Expanded(
          child: ListenableBuilder(
            listenable: store,
            builder: (context, _) {
              final all = store.all;
              if (all.isEmpty) return _empty();
              final items = <Widget>[];
              String last = '';
              for (final m in all) {
                final d = m.at.length >= 10 ? m.at.substring(0, 10) : '';
                if (d != last) {
                  items.add(_DaySep(label: relDayOrDate(m.time)));
                  last = d;
                }
                items.add(Bubble(m: m));
              }
              final rev = items.reversed.toList();
              return ListView.builder(
                reverse: true,
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                itemCount: rev.length,
                itemBuilder: (_, i) => rev[i],
              );
            },
          ),
        ),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: recording ? _recordBar() : _composer(),
        ),
      ]),
    );
  }

  String relDayOrDate(DateTime t) {
    final n = dayDiff(t);
    return n == 0 ? 'اليوم' : n == -1 ? 'أمس' : fmtDate(t);
  }

  Widget _header(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(16, top + 10, 16, 12),
      decoration: const BoxDecoration(color: MQ.surface, border: Border(bottom: BorderSide(color: MQ.line))),
      child: Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: const BoxDecoration(shape: BoxShape.circle, color: MQ.forest),
          alignment: Alignment.center,
          child: Text('س', style: MQ.display(22, color: MQ.brassHi)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${store.office['lawyer'] ?? 'المحامي'}', style: MQ.body(16, weight: FontWeight.w700, height: 1.3)),
            Row(children: [
              Container(width: 7, height: 7, decoration: const BoxDecoration(color: MQ.mint, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Flexible(
                  child: Text('يردّ عادةً خلال ساعات العمل',
                      style: MQ.body(12, color: MQ.muted), overflow: TextOverflow.ellipsis)),
            ]),
          ]),
        ),
        IconButton(
          tooltip: 'إرفاق وثيقة',
          onPressed: () => Attach.sheet(context),
          icon: const Icon(Icons.note_add_outlined, color: MQ.pine),
        ),
      ]),
    );
  }

  Widget _empty() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(color: MQ.pineSoft, shape: BoxShape.circle),
                child: const Icon(Icons.forum_outlined, color: MQ.pine, size: 36)),
            const SizedBox(height: 14),
            Text('ابدأ محادثتك مع المحامي', style: MQ.display(22)),
            Text('اكتب رسالة، أو سجّل رسالة صوتية، أو أرفق صورة وثيقة.',
                textAlign: TextAlign.center, style: MQ.body(13.5, color: MQ.muted)),
          ]),
        ),
      );

  Widget _composer() => Container(
        key: const ValueKey('composer'),
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
        decoration: const BoxDecoration(color: MQ.surface, border: Border(top: BorderSide(color: MQ.line))),
        child: SafeArea(
          top: false,
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            IconButton(
                tooltip: 'إرفاق',
                onPressed: () => Attach.sheet(context),
                icon: Transform.rotate(angle: math.pi / 4, child: const Icon(Icons.attach_file, color: MQ.muted))),
            Expanded(
              child: Focus(
                onKeyEvent: (node, e) {
                  if (e is KeyDownEvent &&
                      e.logicalKey == LogicalKeyboardKey.enter &&
                      !HardwareKeyboard.instance.isShiftPressed) {
                    sendText();
                    return KeyEventResult.handled;
                  }
                  return KeyEventResult.ignored;
                },
                child: TextField(
                  controller: ctrl,
                  focusNode: focus,
                  minLines: 1,
                  maxLines: 5,
                  textInputAction: TextInputAction.newline,
                  style: MQ.body(15),
                  decoration: InputDecoration(
                    hintText: 'اكتب رسالتك…',
                    fillColor: MQ.ivory,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(26), borderSide: BorderSide.none),
                    enabledBorder:
                        OutlineInputBorder(borderRadius: BorderRadius.circular(26), borderSide: BorderSide.none),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(26), borderSide: const BorderSide(color: MQ.pine)),
                  ),
                ),
              ),
            ),
            if (!hasText)
              IconButton(
                  tooltip: 'تصوير وثيقة',
                  onPressed: () => Attach.pick(context, AttachSource.camera),
                  icon: const Icon(Icons.photo_camera_outlined, color: MQ.muted)),
            const SizedBox(width: 2),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: _roundBtn(
                key: ValueKey(hasText),
                icon: hasText ? Icons.send_rounded : Icons.mic_rounded,
                tooltip: hasText ? 'إرسال' : 'تسجيل رسالة صوتية',
                onTap: hasText ? sendText : startRec,
              ),
            ),
          ]),
        ),
      );

  Widget _roundBtn({Key? key, required IconData icon, required String tooltip, required VoidCallback onTap, Color color = MQ.pine}) =>
      Tooltip(
        key: key,
        message: tooltip,
        child: Material(
          color: color,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: SizedBox(width: 48, height: 48, child: Icon(icon, color: MQ.onGold, size: 23)),
          ),
        ),
      );

  Widget _recordBar() {
    final secs = recStart == null ? 0 : DateTime.now().difference(recStart!).inMilliseconds / 1000;
    return Container(
      key: const ValueKey('rec'),
      padding: const EdgeInsets.fromLTRB(8, 10, 8, 12),
      decoration: const BoxDecoration(color: MQ.surface, border: Border(top: BorderSide(color: MQ.line))),
      child: SafeArea(
        top: false,
        child: Row(children: [
          IconButton(
              tooltip: 'إلغاء التسجيل',
              onPressed: () => stopRec(send: false),
              icon: const Icon(Icons.delete_outline, color: MQ.danger)),
          const _Pulse(),
          const SizedBox(width: 8),
          Text(mmss(secs), style: MQ.mono(15, color: MQ.danger)),
          const SizedBox(width: 12),
          Expanded(child: SizedBox(height: 34, child: CustomPaint(painter: _LevelPainter(List.of(levels))))),
          const SizedBox(width: 10),
          _roundBtn(icon: Icons.send_rounded, tooltip: 'إرسال التسجيل', onTap: () => stopRec(send: true)),
        ]),
      ),
    );
  }
}

class _Pulse extends StatefulWidget {
  const _Pulse();
  @override
  State<_Pulse> createState() => _PulseState();
}

class _PulseState extends State<_Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
    ..repeat(reverse: true);
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
        opacity: Tween(begin: .25, end: 1.0).animate(c),
        child: Container(width: 12, height: 12, decoration: const BoxDecoration(color: MQ.danger, shape: BoxShape.circle)),
      );
}

/// مستوى الصوت أثناء التسجيل
class _LevelPainter extends CustomPainter {
  _LevelPainter(this.levels);
  final List<double> levels;
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = MQ.danger
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3;
    const gap = 5.0;
    final n = (size.width / gap).floor();
    for (var i = 0; i < n; i++) {
      final idx = levels.length - 1 - i;
      final v = idx >= 0 ? levels[idx] : .06;
      final h = math.max(3.0, v * size.height);
      final x = size.width - i * gap - 2;
      canvas.drawLine(Offset(x, (size.height - h) / 2), Offset(x, (size.height + h) / 2), p);
    }
  }

  @override
  bool shouldRepaint(covariant _LevelPainter old) => true;
}

class _DaySep extends StatelessWidget {
  const _DaySep({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
          decoration: BoxDecoration(color: MQ.surface, borderRadius: BorderRadius.circular(99), border: Border.all(color: MQ.line)),
          child: Text(label, style: MQ.body(11.5, color: MQ.muted)),
        ),
      );
}

/* ── فقاعة الرسالة ── */
class Bubble extends StatelessWidget {
  const Bubble({super.key, required this.m});
  final Msg m;

  @override
  Widget build(BuildContext context) {
    final mine = m.mine;
    final fg = mine ? Colors.white : MQ.ink;
    final w = MediaQuery.of(context).size.width;
    Widget content;
    switch (m.type) {
      case 'voice':
        content = VoiceBubble(m: m, mine: mine);
      case 'image':
        content = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GestureDetector(
            onTap: m.file == null ? null : () => _openImage(context),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 280, maxWidth: 280),
                child: m.local != null
                    ? Image.memory(m.local!, fit: BoxFit.cover)
                    : Image.network(Api.url(m.file!),
                        fit: BoxFit.cover,
                        loadingBuilder: (c, child, p) =>
                            p == null ? child : const SizedBox(width: 220, height: 160, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
                        errorBuilder: (_, __, ___) => FileTile(name: m.name ?? 'صورة', size: m.size, dark: mine)),
              ),
            ),
          ),
          if (m.text.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(m.text, style: MQ.body(14.5, color: fg))),
        ]);
      case 'file':
        content = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: m.file == null ? null : () => launchUrl(Uri.parse(Api.url(m.file!)), webOnlyWindowName: '_blank'),
            child: FileTile(name: m.name ?? 'مستند', size: m.size, dark: mine),
          ),
          if (m.text.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(m.text, style: MQ.body(14.5, color: fg))),
        ]);
      case 'notice':
        return Align(
          alignment: AlignmentDirectional.centerStart,
          child: Container(
            constraints: BoxConstraints(maxWidth: math.min(w * .86, 460)),
            margin: const EdgeInsets.symmetric(vertical: 5),
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            decoration: BoxDecoration(
              color: MQ.brassSoft,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: MQ.brass.withValues(alpha: .45)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.notifications_active, size: 17, color: MQ.brass),
                const SizedBox(width: 6),
                Text('إشعار من المكتب', style: MQ.body(12.5, color: MQ.brass, weight: FontWeight.w700)),
              ]),
              const SizedBox(height: 4),
              SelectableText(m.text, style: MQ.body(15, height: 1.6)),
              Text(m.at.length >= 16 ? m.at.substring(11, 16) : '', style: MQ.mono(10.5, color: MQ.muted)),
            ]),
          ),
        );
      default:
        content = SelectableText(m.text, style: MQ.body(15, color: fg));
    }

    return Align(
      alignment: mine ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        builder: (_, v, child) => Opacity(opacity: v, child: Transform.translate(offset: Offset(0, (1 - v) * 8), child: child)),
        child: Container(
          constraints: BoxConstraints(maxWidth: math.min(w * .8, 440)),
          margin: const EdgeInsets.symmetric(vertical: 3),
          padding: const EdgeInsets.fromLTRB(12, 9, 12, 6),
          decoration: BoxDecoration(
            color: mine ? MQ.mine : MQ.surface,
            border: mine ? null : Border.all(color: MQ.line),
            borderRadius: BorderRadiusDirectional.only(
              topStart: const Radius.circular(18),
              topEnd: const Radius.circular(18),
              bottomStart: Radius.circular(mine ? 18 : 5),
              bottomEnd: Radius.circular(mine ? 5 : 18),
            ),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            content,
            const SizedBox(height: 3),
            Row(mainAxisSize: MainAxisSize.min, children: [
              Text(m.at.length >= 16 ? m.at.substring(11, 16) : '', style: MQ.mono(10.5, color: mine ? Colors.white70 : MQ.muted)),
              if (mine) ...[
                const SizedBox(width: 4),
                if (m.failed)
                  InkWell(
                    onTap: () => store.retry(m),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.error_outline, size: 14, color: MQ.brassHi),
                      Text(' لم تُرسل · إعادة', style: MQ.body(11, color: MQ.brassHi, weight: FontWeight.w700)),
                    ]),
                  )
                else if (m.pending)
                  const SizedBox(width: 11, height: 11, child: CircularProgressIndicator(strokeWidth: 1.6, color: Colors.white70))
                else
                  Icon(m.seen ? Icons.done_all : Icons.done, size: 15, color: m.seen ? MQ.mint : Colors.white70),
              ],
            ]),
          ]),
        ),
      ),
    );
  }

  void _openImage(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: Text(m.name ?? 'صورة', style: MQ.body(15, color: Colors.white))),
        body: Center(child: InteractiveViewer(maxScale: 5, child: Image.network(Api.url(m.file!)))),
      ),
    ));
  }
}

/* ── مشغّل الرسائل الصوتية ── */
class VoiceBubble extends StatefulWidget {
  const VoiceBubble({super.key, required this.m, required this.mine});
  final Msg m;
  final bool mine;
  @override
  State<VoiceBubble> createState() => _VoiceBubbleState();
}

class _VoiceBubbleState extends State<VoiceBubble> {
  static _VoiceBubbleState? _current;
  AudioPlayer? player;
  bool playing = false;
  Duration pos = Duration.zero, total = Duration.zero;
  late final List<double> bars = _bars(widget.m.id);
  final subs = <StreamSubscription>[];

  static List<double> _bars(String id) {
    var h = id.codeUnits.fold<int>(7, (a, c) => (a * 31 + c) & 0x7fffffff);
    const n = 30;
    return List.generate(n, (i) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      final env = math.sin(math.pi * (i + .5) / n) * .55 + .45;
      return ((.22 + ((h >> 8) % 78) / 100) * env).clamp(.12, 1.0);
    });
  }

  @override
  void dispose() {
    for (final s in subs) {
      s.cancel();
    }
    player?.dispose();
    if (_current == this) _current = null;
    super.dispose();
  }

  Future<void> _ensure() async {
    if (player != null) return;
    final p = AudioPlayer();
    player = p;
    subs.add(p.onPositionChanged.listen((d) => mounted ? setState(() => pos = d) : null));
    subs.add(p.onDurationChanged.listen((d) => mounted ? setState(() => total = d) : null));
    subs.add(p.onPlayerComplete.listen((_) => mounted ? setState(() {
          playing = false;
          pos = Duration.zero;
        }) : null));
    await p.setSourceUrl(Api.url(widget.m.file!));
  }

  Future<void> toggle() async {
    if (widget.m.file == null) return;
    try {
      await _ensure();
      if (playing) {
        await player!.pause();
        setState(() => playing = false);
      } else {
        if (_current != null && _current != this) await _current!.stopOther();
        _current = this;
        await player!.resume();
        setState(() => playing = true);
      }
    } catch (_) {
      if (mounted) snack(context, 'تعذّر تشغيل الرسالة الصوتية.');
    }
  }

  Future<void> stopOther() async {
    await player?.pause();
    if (mounted) setState(() => playing = false);
  }

  @override
  Widget build(BuildContext context) {
    final durSecs = total.inMilliseconds > 0 ? total.inMilliseconds / 1000 : widget.m.dur.toDouble();
    final frac = durSecs > 0 ? (pos.inMilliseconds / 1000 / durSecs).clamp(0.0, 1.0) : 0.0;
    final on = widget.mine ? MQ.brassHi : MQ.pine;
    final off = widget.mine ? Colors.white38 : MQ.pine.withValues(alpha: .25);
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return SizedBox(
      width: 236,
      child: Row(children: [
        Material(
          color: MQ.pine,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: widget.m.pending ? null : toggle,
            child: SizedBox(
              width: 40,
              height: 40,
              child: widget.m.pending
                  ? Padding(
                      padding: const EdgeInsets.all(11),
                      child: CircularProgressIndicator(strokeWidth: 2, color: MQ.onGold))
                  : Icon(playing ? Icons.pause_rounded : Icons.play_arrow_rounded,
                      color: MQ.onGold, size: 26),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: LayoutBuilder(
            builder: (context, cons) => GestureDetector(
              onTapDown: (d) async {
                if (player == null || total == Duration.zero) return toggle();
                var f = d.localPosition.dx / cons.maxWidth;
                if (rtl) f = 1 - f;
                await player!.seek(Duration(milliseconds: (total.inMilliseconds * f.clamp(0.0, 1.0)).round()));
              },
              child: SizedBox(
                height: 34,
                child: Row(children: [
                  for (var i = 0; i < bars.length; i++) ...[
                    if (i > 0) const SizedBox(width: 2),
                    Expanded(
                      child: Center(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          height: 34 * bars[i],
                          decoration: BoxDecoration(
                              color: (i + .5) / bars.length <= frac ? on : off, borderRadius: BorderRadius.circular(3)),
                        ),
                      ),
                    ),
                  ],
                ]),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(mmss(playing || pos > Duration.zero ? pos.inMilliseconds / 1000 : durSecs),
            style: MQ.mono(11.5, color: widget.mine ? Colors.white70 : MQ.muted)),
      ]),
    );
  }
}
