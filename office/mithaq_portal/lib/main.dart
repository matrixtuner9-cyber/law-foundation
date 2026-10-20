import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
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
        // الهواتف ذات الخط المكبَّر جداً تكسر التخطيط؛ نسمح بتكبير معتدل فقط
        builder: (context, child) =>
            MediaQuery.withClampedTextScaling(minScaleFactor: .9, maxScaleFactor: 1.1, child: child!),
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
  @override
  void initState() {
    super.initState();
    _check();
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
              : LoginPage(onDone: () async {
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
        backgroundColor: MQ.forest,
        body: Center(child: OfficeLogo(size: 92)),
      );
}

/* ── شاشة الدخول ── */
class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onDone});
  final Future<void> Function() onDone;
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final ctrl = TextEditingController();
  bool busy = false;
  String? error;

  @override
  void dispose() {
    ctrl.dispose();
    super.dispose();
  }

  /// تغيير عنوان خادم المكتب (يحتاجه تطبيق الهاتف إن تغيّر عنوان جهاز المكتب)
  Future<void> _server() async {
    final c = TextEditingController(text: Api.base);
    final v = await showDialog<String>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text('عنوان خادم المكتب', style: MQ.display(22)),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('يحصل عليه الموكل من المكتب، مثال: http://192.168.1.11:8080', style: MQ.body(12.5, color: MQ.muted)),
          const SizedBox(height: 10),
          TextField(controller: c, textDirection: TextDirection.ltr, keyboardType: TextInputType.url, style: MQ.mono(15)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d), child: const Text('إلغاء')),
          FilledButton(onPressed: () => Navigator.pop(d, c.text.trim()), child: const Text('حفظ')),
        ],
      ),
    );
    if (v == null || v.isEmpty) return;
    final url = (v.startsWith('http') ? v : 'http://$v').replaceAll(RegExp(r'/+$'), '');
    Api.base = url;
    final p = await SharedPreferences.getInstance();
    await p.setString('api', url);
    await p.setString('api_for', const String.fromEnvironment('API', defaultValue: ''));
    setState(() => error = null);
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

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final heroH = (mq.size.height * .42).clamp(300.0, 420.0);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: MQ.ivory,
        resizeToAvoidBottomInset: true,
        body: SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: mq.size.height),
            child: Stack(children: [
              // الصورة العلوية: تمثال العدالة
              SizedBox(
                height: heroH + 60,
                width: double.infinity,
                child: const PhotoBackdrop(asset: 'assets/images/login_bg.jpg', alignment: Alignment(0, -.3), shade: .6, opacity: .7),
              ),
              Positioned(
                top: mq.padding.top + 34,
                left: 0,
                right: 0,
                child: Column(children: [
                  const OfficeLogo(size: 84),
                  const SizedBox(height: 12),
                  Text('بوابة الموكل', style: MQ.display(27, color: Colors.white)),
                  Text(_officeName,
                      textAlign: TextAlign.center, style: MQ.body(13.5, color: MQ.brassSoft, weight: FontWeight.w500)),
                ]),
              ),
              // اللوحة العاجية
              Container(
                margin: EdgeInsets.only(top: heroH),
                constraints: BoxConstraints(minHeight: mq.size.height - heroH),
                decoration: const BoxDecoration(
                  color: MQ.ivory,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                  boxShadow: [BoxShadow(color: Color(0x471A1209), blurRadius: 40, offset: Offset(0, -14))],
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(24, 12, 24, 18 + mq.padding.bottom),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Center(
                            child: Container(
                                width: 44,
                                height: 4,
                                decoration: BoxDecoration(color: MQ.line, borderRadius: BorderRadius.circular(4)))),
                        const SizedBox(height: 16),
                        Text('تسجيل الدخول', style: MQ.display(24)),
                        Text('مرحباً بك، أدخل رمز الدخول الذي وصلك من المكتب لمتابعة قضاياك',
                            style: MQ.body(12.5, color: MQ.muted)),
                        const SizedBox(height: 16),
                        Text('رمز الدخول', style: MQ.body(13, weight: FontWeight.w700, color: const Color(0xFF3E2F21))),
                        const SizedBox(height: 6),
                        TextField(
                          controller: ctrl,
                          textAlign: TextAlign.center,
                          textDirection: TextDirection.ltr,
                          textCapitalization: TextCapitalization.characters,
                          autofillHints: const [AutofillHints.password],
                          style: MQ.mono(21, spacing: 3),
                          decoration: const InputDecoration(
                            hintText: 'MQ-XXXXXXXXXX',
                            prefixIcon: Icon(Icons.key_rounded, color: MQ.goldLo),
                            suffixIcon: SizedBox(width: 48),
                          ),
                          onSubmitted: (_) => _go(),
                        ),
                        AnimatedSize(
                          duration: const Duration(milliseconds: 200),
                          child: error == null
                              ? const SizedBox(height: 16, width: double.infinity)
                              : Container(
                                  width: double.infinity,
                                  margin: const EdgeInsets.symmetric(vertical: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration:
                                      BoxDecoration(color: MQ.dangerSoft, borderRadius: BorderRadius.circular(12)),
                                  child: Text(error!, style: MQ.body(13, color: MQ.danger)),
                                ),
                        ),
                        GoldButton(label: 'دخول', icon: Icons.arrow_back_rounded, busy: busy, onPressed: _go),
                        const SizedBox(height: 10),
                        Text('يصلك الرمز من المكتب عند تفعيل حسابك في البوابة.',
                            textAlign: TextAlign.center, style: MQ.body(12, color: MQ.muted)),
                        if (!kIsWeb)
                          TextButton.icon(
                            onPressed: _server,
                            icon: const Icon(Icons.dns_outlined, size: 18, color: MQ.brass),
                            label: Text('عنوان خادم المكتب: ${Api.base.replaceFirst(RegExp(r'^https?://'), '')}',
                                style: MQ.body(12, color: MQ.brass, weight: FontWeight.w600)),
                          ),
                        const SizedBox(height: 10),
                        Row(children: [
                          const Expanded(child: Divider(color: MQ.line)),
                          Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Text('رموز تجريبية للفحص', style: MQ.body(12, color: MQ.muted))),
                          const Expanded(child: Divider(color: MQ.line)),
                        ]),
                        const SizedBox(height: 8),
                        Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
                          for (final d in const [
                            ('MQ-2051', 'شركة الزيتون'),
                            ('MQ-7714', 'أحمد الشكعة'),
                            ('MQ-6640', 'ريم النابلسي')
                          ])
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(0, 36),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  side: const BorderSide(color: MQ.line),
                                  backgroundColor: MQ.surface,
                                  shape: const StadiumBorder()),
                              onPressed: busy
                                  ? null
                                  : () {
                                      ctrl.text = d.$1;
                                      _go();
                                    },
                              child: Text('${d.$2} · ${d.$1}',
                                  style: MQ.body(12, color: MQ.ink, weight: FontWeight.w600, height: 1.3)),
                            ),
                        ]),
                        const SizedBox(height: 22),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.verified_user_outlined, size: 14, color: Color(0xFF10B981)),
                          const SizedBox(width: 6),
                          Text('اتصال آمن ومشفّر', style: MQ.body(11.5, color: MQ.brass)),
                        ]),
                        Text('ميثاق · نظام إدارة مكاتب المحاماة',
                            textAlign: TextAlign.center, style: MQ.body(11.5, color: const Color(0xFFA08B6C))),
                      ]),
                    ),
                  ),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// اسم المكتب على شاشة الدخول (يُضبط عند البناء: --dart-define=OFFICE=...)
const _officeName = String.fromEnvironment('OFFICE', defaultValue: 'مكتب الميثاق للمحاماة والاستشارات القانونية');

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
    WidgetsBinding.instance.addPostFrameCallback((_) => ensureNotify());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState s) => setForeground(s == AppLifecycleState.resumed);

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
      bottomNavigationBar: ListenableBuilder(
        listenable: store,
        builder: (context, _) => _NavBar(idx: idx, unread: store.unread, onTap: go),
      ),
    );
  }
}

/// الشريط السفلي: كحلي عائم بزوايا مستديرة، وفي وسطه ختم ذهبي للمراسلة
class _NavBar extends StatelessWidget {
  const _NavBar({required this.idx, required this.unread, required this.onTap});
  final int idx, unread;
  final void Function(int) onTap;

  Widget _item(int i, IconData off, IconData on, String label) {
    final sel = idx == i;
    final c = sel ? MQ.gold : MQ.soft;
    return Expanded(
      child: Semantics(
        selected: sel,
        button: true,
        label: label,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => onTap(i),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(sel ? on : off, color: c, size: 22),
            const SizedBox(height: 3),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(label,
                  maxLines: 1,
                  style: MQ.body(10.5, color: c, weight: sel ? FontWeight.w800 : FontWeight.w600, height: 1.2)),
            ),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final chat = idx == 2;
    return SizedBox(
      height: 96 + bottom,
      child: Stack(clipBehavior: Clip.none, alignment: Alignment.bottomCenter, children: [
        Positioned(
          left: 12,
          right: 12,
          bottom: 10 + bottom,
          height: 66,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: MQ.navyGradient,
              boxShadow: [BoxShadow(color: MQ.forest.withValues(alpha: .35), blurRadius: 30, offset: const Offset(0, 14))],
            ),
            child: Material(
              color: Colors.transparent,
              child: Row(children: [
                _item(0, Icons.home_outlined, Icons.home_rounded, 'الرئيسية'),
                _item(1, Icons.gavel_outlined, Icons.gavel_rounded, 'قضاياي'),
                const Expanded(child: SizedBox()),
                _item(3, Icons.folder_outlined, Icons.folder_rounded, 'المستندات'),
                _item(4, Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, 'حسابي'),
              ]),
            ),
          ),
        ),
        // الزر الأوسط: المراسلة
        Positioned(
          bottom: 10 + bottom + 66 - 34,
          child: Semantics(
            button: true,
            selected: chat,
            label: 'المراسلة',
            child: GestureDetector(
              onTap: () => onTap(2),
              child: Badge(
                  isLabelVisible: unread > 0,
                  label: Text('$unread'),
                  backgroundColor: const Color(0xFFEF4444),
                  offset: const Offset(-2, 2),
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: chat
                          ? MQ.goldGradient
                          : const RadialGradient(center: Alignment(0, -.3), colors: [Color(0xFF1B2E47), MQ.forest]),
                      border: Border.all(color: MQ.gold, width: 2.5),
                      boxShadow: [
                        const BoxShadow(color: MQ.ivory, spreadRadius: 5),
                        BoxShadow(color: MQ.goldLo.withValues(alpha: .45), blurRadius: 22, offset: const Offset(0, 10)),
                      ],
                    ),
                    child: Icon(chat ? Icons.forum_rounded : Icons.forum_outlined,
                        color: chat ? MQ.forest : MQ.gold, size: 28),
                  ),
                ),
            ),
          ),
        ),
      ]),
    );
  }
}

/// يُستخدم في الشاشات لإظهار رسالة خطأ عامة
void showError(BuildContext context, Object e) => snack(context, e is ApiError ? e.message : 'حدث خطأ، حاول مجدداً.');
