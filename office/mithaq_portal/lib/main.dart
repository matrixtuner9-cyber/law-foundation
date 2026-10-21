import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'office_pick.dart';
import 'ui.dart';
import 'push.dart' show pushResume;
import 'store.dart';
import 'theme.dart';
import 'util.dart';
import 'home.dart';
import 'cases.dart';
import 'chat.dart';
import 'docs.dart';
import 'settings.dart';
import 'platform/bg_stub.dart' if (dart.library.io) 'platform/bg_io.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MithaqPortal());
  // خدمة الاستقبال في الخلفية: تنبيه بصوت ونص حتى والتطبيق مغلق (أندرويد)
  initBackground();
}

class MithaqPortal extends StatelessWidget {
  const MithaqPortal({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'بوابة ميثاق',
        debugShowCheckedModeBanner: false,
        theme: MQ.theme(),
        locale: const Locale('ar'),
        supportedLocales: const [Locale('ar')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        // خلفية الرخام العاجي تحت كل الشاشات
        // تكبير النص من إعدادات الهاتف محترم، ضمن حدود تحفظ تخطيط الشاشات (90%–130%)
        builder: (context, child) {
          final mq = MediaQuery.of(context);
          return MediaQuery(
              data: mq.copyWith(textScaler: mq.textScaler.clamp(minScaleFactor: .9, maxScaleFactor: 1.3)), child: child ?? const SizedBox());
        },
        home: const Gate(),
      );
}

/// يقرر: شاشة الدخول أم التطبيق
class Gate extends StatefulWidget {
  const Gate({super.key});
  @override
  State<Gate> createState() => _GateState();
}

class _GateState extends State<Gate> {
  bool? authed;
  bool locked = false;
  String? linkNote;
  StreamSubscription<Uri>? _links;
  String _lastLink = '';
  @override
  void initState() {
    super.initState();
    _check();
    // روابط الدعوة (واتساب أو رمز QR بكاميرا الآيفون) تفتح التطبيق وتُدخل الموكل مباشرة
    if (!kIsWeb) {
      final al = AppLinks();
      al.getInitialLink().then((u) => u == null ? null : _onLink(u)).catchError((_) => null);
      _links = al.uriLinkStream.listen(_onLink, onError: (_) {});
    }
  }

  @override
  void dispose() {
    _links?.cancel();
    super.dispose();
  }

  Future<void> _onLink(Uri u) async {
    final s = u.toString();
    if (s == _lastLink) return;
    _lastLink = s;
    final r = OfficePick.parse(s);
    if (r == null || r.code == null) return;
    // نفس الموكل ونفس المكتب وهو داخل: لا شيء
    if (authed == true && Api.code == r.code && Api.base == r.base) return;
    while (authed == null) {
      await Future.delayed(const Duration(milliseconds: 150));
    }
    try {
      final name = await OfficePick.verify(r.base);
      if (authed == true) {
        await store.logout();
        if (mounted) setState(() => authed = false);
      }
      await OfficePick.save(r.base, name);
      await Api.login(r.code!);
      await store.load();
      final p = await SharedPreferences.getInstance();
      await p.setString('code', Api.code!);
      if (mounted) setState(() {
        linkNote = null;
        locked = false;
        authed = true;
      });
    } on ApiError catch (e) {
      if (mounted) setState(() => linkNote = e.message);
    } catch (_) {
      if (mounted) setState(() => linkNote = 'تعذّر فتح رابط الدعوة. تحقق من اتصالك بالإنترنت ثم أعد فتحه.');
    }
  }

  Future<void> _check() async {
    final p = await SharedPreferences.getInstance();
    // عنوان خادم المكتب المحفوظ (لتطبيق الهاتف)
    final api = p.getString('api');
    const built = String.fromEnvironment('API', defaultValue: '');
    if (api != null && api.isNotEmpty && !kIsWeb && (built.isEmpty || p.getString('api_for') == built)) {
      Api.base = api;
    } else if (api != null) {
      await p.remove('api'); // عنوان قديم من نسخة سابقة
    }
    final c = p.getString('code');
    if (c != null) {
      Api.code = c;
      try {
        await store.load();
        // الدخول بالبصمة إن فعّله الموكل
        locked = !kIsWeb && (p.getBool('bio') ?? false);
        if (mounted) setState(() => authed = true);
        return;
      } catch (_) {}
    }
    if (mounted) setState(() => authed = false);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 450),
      child: authed == null
          ? const _Splash()
          : authed! && locked
              ? LockScreen(
                  key: const ValueKey('lock'),
                  onUnlock: () => setState(() => locked = false),
                  onLogout: () async {
                    await store.logout();
                    setState(() {
                      locked = false;
                      authed = false;
                    });
                  })
              : authed!
              ? Shell(key: const ValueKey('shell'), onLogout: () async {
                  await store.logout();
                  setState(() => authed = false);
                })
              : LoginPage(note: linkNote, onDone: () async {
                  await store.load();
                  final p = await SharedPreferences.getInstance();
                  await p.setString('code', Api.code!);
                  setState(() => authed = true);
                }),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: Seal(size: 72, filled: true)),
      );
}

/* ── شاشة الدخول: المكتب أولاً (رمز المكتب أو رابط الدعوة) ثم رمز الموكل ── */
class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onDone, this.note});
  final Future<void> Function() onDone;
  final String? note;
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  final ctrl = TextEditingController();
  final officeCtrl = TextEditingController();
  bool busy = false;
  String? error;
  String officeName = '';
  late final AnimationController glow =
      AnimationController(vsync: this, duration: const Duration(seconds: 9))..repeat(reverse: true);

  bool get _pickStep => !kIsWeb && !Api.hasOffice;

  @override
  void initState() {
    super.initState();
    error = widget.note;
    _loadOffice();
  }

  @override
  void didUpdateWidget(LoginPage o) {
    super.didUpdateWidget(o);
    if (widget.note != null && widget.note != o.note) setState(() => error = widget.note);
  }

  Future<void> _loadOffice() async {
    if (kIsWeb || !Api.hasOffice) return;
    var n = await OfficePick.savedName();
    if (n.isEmpty) {
      try {
        n = await OfficePick.verify(Api.base);
      } catch (_) {}
    }
    if (mounted) setState(() => officeName = n);
  }

  @override
  void dispose() {
    glow.dispose();
    ctrl.dispose();
    officeCtrl.dispose();
    super.dispose();
  }

  /// تحديد المكتب من الرمز أو العنوان أو رابط الدعوة (ويدخل مباشرة إن احتوى الرابط رمز الموكل)
  Future<void> _pickOffice(String raw) async {
    if (raw.trim().isEmpty) {
      setState(() => error = 'اكتب رمز المكتب، أو الصق رابط الدعوة الذي وصلك منه.');
      return;
    }
    if (OfficePick.isBareCode(raw)) {
      setState(() => error = 'هذا رمز الدخول الخاص بك. اكتب أولاً رمز المكتب، أو الصق رابط الدعوة كاملاً كما وصلك.');
      return;
    }
    final r = OfficePick.parse(raw);
    if (r == null) {
      setState(() => error = 'لم نتعرّف على رمز المكتب. اكتبه كما أعطاك إياه المكتب (أحرف إنجليزية)، أو الصق رابط الدعوة.');
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final name = await OfficePick.verify(r.base);
      await OfficePick.save(r.base, name);
      setState(() => officeName = name);
      if (r.code != null) {
        ctrl.text = r.code!;
        busy = false;
        await _go();
      }
    } on ApiError catch (e) {
      setState(() => error = e.message);
    } catch (_) {
      setState(() => error = 'تعذّر الوصول إلى المكتب. تحقق من اتصالك بالإنترنت.');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _paste() async {
    final d = await Clipboard.getData(Clipboard.kTextPlain);
    final t = d?.text ?? '';
    if (t.trim().isEmpty) {
      setState(() => error = 'لا يوجد رابط منسوخ. انسخ رابط الدعوة من رسالة المكتب ثم اضغط «لصق».');
      return;
    }
    officeCtrl.text = t.trim();
    await _pickOffice(t);
  }

  Future<void> _changeOffice() async {
    await OfficePick.forget();
    setState(() {
      officeName = '';
      officeCtrl.clear();
      ctrl.clear();
      error = null;
    });
  }

  Future<void> _go() async {
    if (ctrl.text.trim().isEmpty) {
      setState(() => error = 'أدخل رمز الدخول الذي وصلك من المكتب.');
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await Api.login(ctrl.text);
      await widget.onDone();
    } on ApiError catch (e) {
      setState(() => error = e.message);
    } catch (_) {
      setState(() => error = 'تعذّر الاتصال بالمكتب. تأكد من اتصالك بالإنترنت.');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Widget _err() => AnimatedSize(
        duration: const Duration(milliseconds: 200),
        child: error == null
            ? const SizedBox(height: Sp.l)
            : Container(
                margin: const EdgeInsets.symmetric(vertical: Sp.m),
                padding: const EdgeInsets.all(Sp.m),
                decoration: BoxDecoration(color: MQ.dangerSoft, borderRadius: BorderRadius.circular(R.control)),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.error_outline_rounded, color: MQ.danger, size: 20),
                  const SizedBox(width: Sp.s),
                  Expanded(child: Text(error!, style: MQ.subhead(color: MQ.danger))),
                ]),
              ),
      );

  Widget _btnChild(String t) => busy
      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: MQ.onGold))
      : Text(t);

  List<Widget> _officeStep() => [
        AppField(
          label: 'رمز المكتب أو رابط الدعوة',
          controller: officeCtrl,
          hint: 'مثال: demo',
          helper: 'تجده في رسالة الدعوة التي أرسلها لك مكتب المحاماة.',
          keyboardType: TextInputType.url,
          ltr: true,
          textInputAction: TextInputAction.go,
          onSubmitted: _pickOffice,
        ),
        _err(),
        FilledButton(onPressed: busy ? null : () => _pickOffice(officeCtrl.text), child: _btnChild('متابعة')),
        const SizedBox(height: Sp.m),
        OutlinedButton.icon(
          onPressed: busy ? null : _paste,
          icon: const Icon(Icons.content_paste_rounded, size: 20),
          label: const Text('لصق رابط الدعوة'),
        ),
        const SizedBox(height: Sp.l),
        _hint(Icons.link_rounded, 'الأسهل: افتح رابط الدعوة من رسالة المكتب، أو امسح رمز QR بكاميرا الهاتف، فيُفتح التطبيق ويُسجَّل دخولك تلقائياً.'),
      ];

  List<Widget> _codeStep() => [
        if (!kIsWeb) ...[
          Container(
            padding: const EdgeInsets.fromLTRB(Sp.m, Sp.s, Sp.xs, Sp.s),
            decoration: BoxDecoration(color: MQ.surface, borderRadius: BorderRadius.circular(R.control), border: Border.all(color: MQ.line)),
            child: Row(children: [
              const IconTile(Icons.account_balance_rounded, size: 40),
              const SizedBox(width: Sp.m),
              Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('مكتب المحاماة', style: MQ.caption()),
                Text(officeName.isEmpty ? Api.base.replaceFirst(RegExp(r'^https?://'), '') : officeName,
                    style: MQ.callout(weight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
              ])),
              TextButton(onPressed: busy ? null : _changeOffice, child: const Text('تغيير')),
            ]),
          ),
          const SizedBox(height: Sp.l),
        ],
        AppField(
          label: 'رمز الدخول',
          controller: ctrl,
          hint: 'MQ-XXXXXXXXXX',
          helper: 'يصلك من المكتب عند تفعيل حسابك في البوابة.',
          mono: true,
          big: true,
          ltr: true,
          textAlign: TextAlign.center,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _go(),
        ),
        _err(),
        FilledButton(onPressed: busy ? null : _go, child: _btnChild('دخول')),
      ];

  Widget _hint(IconData ic, String t) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(ic, size: 18, color: MQ.muted),
        const SizedBox(width: Sp.s),
        Expanded(child: Text(t, style: MQ.footnote())),
      ]);

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(Sp.xl, Sp.xl, Sp.xl, Sp.xl),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  const Center(child: Seal(size: 72, filled: true)),
                  const SizedBox(height: Sp.l),
                  Text('بوابة الموكل', textAlign: TextAlign.center, style: MQ.largeTitle()),
                  const SizedBox(height: Sp.xs),
                  Text(kIsWeb ? 'مكتب الميثاق للمحاماة والاستشارات القانونية' : (officeName.isNotEmpty ? officeName : 'تابع قضيتك وراسل محاميك بأمان'),
                      textAlign: TextAlign.center, style: MQ.callout(color: MQ.muted)),
                  const SizedBox(height: Sp.xl),
                  if (!kIsWeb) ...[
                    _Steps(step: _pickStep ? 0 : 1),
                    const SizedBox(height: Sp.l),
                  ],
                  Panel(
                    padding: const EdgeInsets.all(Sp.l + 4),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: _pickStep ? _officeStep() : _codeStep()),
                  ),
                  const SizedBox(height: Sp.l),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.lock_outline_rounded, size: 16, color: MQ.muted),
                    const SizedBox(width: 6),
                    Flexible(child: Text('اتصال مشفّر · بياناتك لدى مكتبك فقط', style: MQ.footnote())),
                  ]),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// مؤشّر خطوتي الدخول
class _Steps extends StatelessWidget {
  const _Steps({required this.step});
  final int step;
  @override
  Widget build(BuildContext context) {
    Widget dot(int i, String t) {
      final done = i < step, on = i == step;
      return Expanded(
        child: Row(children: [
          Container(
            width: 26,
            height: 26,
            alignment: Alignment.center,
            decoration: BoxDecoration(shape: BoxShape.circle, color: on || done ? MQ.forest : MQ.surface, border: Border.all(color: on || done ? MQ.forest : MQ.line)),
            child: done
                ? const Icon(Icons.check_rounded, size: 16, color: MQ.onGold)
                : Text('${i + 1}', style: MQ.caption(color: on ? MQ.onGold : MQ.muted, weight: FontWeight.w700)),
          ),
          const SizedBox(width: Sp.s),
          Flexible(child: Text(t, style: MQ.subhead(color: on ? MQ.ink : MQ.muted, weight: on ? FontWeight.w600 : FontWeight.w400))),
        ]),
      );
    }

    return Row(children: [dot(0, 'المكتب'), const SizedBox(width: Sp.s), dot(1, 'رمز الدخول')]);
  }
}

/* ── الهيكل: خمس شاشات وشريط تنقل ── */
class Shell extends StatefulWidget {
  const Shell({super.key, required this.onLogout});
  final Future<void> Function() onLogout;
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> with WidgetsBindingObserver {
  int idx = 0;
  final chatKey = GlobalKey<ChatTabState>();

  final chime = AudioPlayer();

  @override
  void initState() {
    super.initState();
    store.start();
    store.onIncoming = _incoming;
    WidgetsBinding.instance.addObserver(this);
    setForeground(true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ensureNotify();
      pushResume(Api.code ?? '');
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState s) {
    setForeground(s == AppLifecycleState.resumed);
    if (s == AppLifecycleState.resumed) pushResume(Api.code ?? '');
  }

  @override
  void dispose() {
    store.onIncoming = null;
    WidgetsBinding.instance.removeObserver(this);
    setForeground(false);
    chime.dispose();
    super.dispose();
  }

  /// تنبيه صوتي ونصي عند وصول رسالة أو إشعار من المحامي
  Future<void> _incoming(Msg m) async {
    try {
      await chime.stop();
      await chime.play(AssetSource('chime.wav'), volume: .9);
    } catch (_) {}
    if (!mounted || idx == 2) return;
    final what = m.type == 'notice'
        ? 'إشعار من المكتب'
        : m.type == 'voice'
            ? 'رسالة صوتية من المحامي'
            : m.type == 'image' || m.type == 'file'
                ? 'مرفق جديد من المحامي'
                : 'رسالة جديدة من المحامي';
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        duration: const Duration(seconds: 6),
        content: Row(children: [
          Icon(m.type == 'notice' ? Icons.notifications_active : Icons.mark_chat_unread_outlined, color: MQ.brassHi),
          const SizedBox(width: 10),
          Expanded(
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(what, style: MQ.body(13.5, color: Colors.white, weight: FontWeight.w700)),
              if (m.text.isNotEmpty)
                Text(m.text, maxLines: 2, overflow: TextOverflow.ellipsis, style: MQ.body(12.5, color: Colors.white70)),
            ]),
          ),
        ]),
        action: SnackBarAction(label: 'عرض', textColor: MQ.brassHi, onPressed: () => go(2)),
      ));
  }

  void go(int i, {String? action}) {
    setState(() => idx = i);
    store.setChatOpen(i == 2);
    if (action != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => chatKey.currentState?.runAction(action));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: idx, children: [
        HomeTab(onGo: go),
        const CasesTab(),
        ChatTab(key: chatKey),
        DocsTab(onGo: go),
        AccountTab(onLogout: widget.onLogout),
      ]),
      extendBody: false,
      bottomNavigationBar: ListenableBuilder(
        listenable: store,
        builder: (context, _) => GoldNavBar(index: idx, onTap: go, unread: store.unread),
      ),
    );
  }
}

/// شريط التنقل السفلي: كحلي، والتبويب المختار ذهبي لامع (ارتفاع 64 وأهداف لمس كاملة)
class GoldNavBar extends StatelessWidget {
  const GoldNavBar({super.key, required this.index, required this.onTap, this.unread = 0});
  final int index;
  final ValueChanged<int> onTap;
  final int unread;
  static const _items = [
    (Icons.home_outlined, Icons.home_rounded, 'الرئيسية'),
    (Icons.balance_outlined, Icons.balance, 'قضاياي'),
    (Icons.forum_outlined, Icons.forum_rounded, 'المراسلة'),
    (Icons.description_outlined, Icons.description_rounded, 'المستندات'),
    (Icons.account_circle_outlined, Icons.account_circle, 'حسابي'),
  ];
  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      decoration: const BoxDecoration(color: MQ.forest, border: Border(top: BorderSide(color: Color(0x66C9A55A)))),
      padding: EdgeInsets.fromLTRB(Sp.s, 6, Sp.s, bottom > 0 ? bottom : 6),
      child: SizedBox(
        height: 60,
        child: Row(children: [
          for (final (i, it) in _items.indexed)
            Expanded(
              child: Semantics(
                button: true,
                selected: i == index,
                label: it.$3,
                child: InkResponse(
                  onTap: () => onTap(i),
                  radius: 36,
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 58,
                      height: 30,
                      decoration: i == index
                          ? BoxDecoration(gradient: MQ.shine, borderRadius: BorderRadius.circular(R.pill), boxShadow: const [BoxShadow(color: Color(0x59D9B45E), blurRadius: 10, offset: Offset(0, 2))])
                          : null,
                      child: Badge(
                        isLabelVisible: i == 2 && unread > 0,
                        label: Text('$unread'),
                        backgroundColor: MQ.danger,
                        child: Icon(i == index ? it.$2 : it.$1, size: 22, color: i == index ? const Color(0xFF1A1406) : MQ.brassHi),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(it.$3,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: MQ.caption(color: i == index ? MQ.onGold : MQ.soft, weight: i == index ? FontWeight.w700 : FontWeight.w500)),
                  ]),
                ),
              ),
            ),
        ]),
      ),
    );
  }
}

/// يُستخدم في الشاشات لإظهار رسالة خطأ عامة
void showError(BuildContext context, Object e) => snack(context, e is ApiError ? e.message : 'حدث خطأ، حاول مجدداً.');
