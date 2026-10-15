import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'store.dart';
import 'login_scene.dart';
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
        body: Center(child: Seal(size: 84)),
      );
}

/* ── شاشة الدخول ── */
class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onDone});
  final Future<void> Function() onDone;
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  final ctrl = TextEditingController();
  bool busy = false;
  String? error;
  late final AnimationController glow =
      AnimationController(vsync: this, duration: const Duration(seconds: 9))..repeat(reverse: true);

  @override
  void dispose() {
    glow.dispose();
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
    return Scaffold(
      backgroundColor: MQ.forest,
      body: Stack(children: [
        const Positioned.fill(child: JusticeScene()),
        SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(children: [
                  const ScalesOfJustice(size: 230),
                  const SizedBox(height: 18),
                  Text('بوابة الموكل', style: MQ.display(36, color: Colors.white)),
                  Text('مكتب الميثاق للمحاماة والاستشارات القانونية',
                      textAlign: TextAlign.center, style: MQ.body(14, color: MQ.soft)),
                  const SizedBox(height: 28),
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                        color: MQ.ivory,
                        border: Border.all(color: MQ.gold.withValues(alpha: .5)),
                        borderRadius: BorderRadius.circular(26),
                        boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 40, offset: Offset(0, 18))]),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Text('رمز الدخول', style: MQ.body(13, color: MQ.muted, weight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: ctrl,
                        textAlign: TextAlign.center,
                        textDirection: TextDirection.ltr,
                        textCapitalization: TextCapitalization.characters,
                        style: MQ.mono(24, spacing: 3),
                        decoration: const InputDecoration(hintText: 'MQ-XXXXXXXXXX'),
                        onSubmitted: (_) => _go(),
                      ),
                      AnimatedSize(
                        duration: const Duration(milliseconds: 200),
                        child: error == null
                            ? const SizedBox(height: 14)
                            : Container(
                                margin: const EdgeInsets.symmetric(vertical: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: MQ.dangerSoft, borderRadius: BorderRadius.circular(12)),
                                child: Text(error!, style: MQ.body(13, color: MQ.danger)),
                              ),
                      ),
                      FilledButton(
                        onPressed: busy ? null : _go,
                        child: busy
                            ? const SizedBox(
                                width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: MQ.onGold))
                            : const Text('دخول'),
                      ),
                      const SizedBox(height: 12),
                      Text('يصلك الرمز من المكتب عند تفعيل حسابك في البوابة.',
                          textAlign: TextAlign.center, style: MQ.body(12, color: MQ.muted)),
                      if (!kIsWeb)
                        TextButton.icon(
                          onPressed: _server,
                          icon: const Icon(Icons.dns_outlined, size: 18, color: MQ.muted),
                          label: Text('عنوان خادم المكتب: ${Api.base.replaceFirst(RegExp(r'^https?://'), '')}',
                              style: MQ.body(12, color: MQ.muted)),
                        ),
                    ]),
                  ),
                  const SizedBox(height: 22),
                  Text('رموز تجريبية للفحص', style: MQ.body(12, color: MQ.soft)),
                  const SizedBox(height: 8),
                  Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
                    for (final d in const [('MQ-2051', 'شركة الزيتون'), ('MQ-7714', 'أحمد الشكعة'), ('MQ-6640', 'ريم النابلسي')])
                      Material(
                        color: Colors.white.withValues(alpha: .08),
                        shape: StadiumBorder(side: BorderSide(color: MQ.gold.withValues(alpha: .4))),
                        child: InkWell(
                          customBorder: const StadiumBorder(),
                          onTap: () {
                            ctrl.text = d.$1;
                            _go();
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            child: Text('${d.$2} · ${d.$1}', style: MQ.body(12.5, color: Colors.white, height: 1.3)),
                          ),
                        ),
                      ),
                  ]),
                ]),
              ),
            ),
          ),
        ),
      ]),
    );
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
        builder: (context, _) => DecoratedBox(
          decoration: BoxDecoration(border: Border(top: BorderSide(color: MQ.gold.withValues(alpha: .3)))),
          child: NavigationBar(
            selectedIndex: idx,
            onDestinationSelected: go,
            destinations: [
              const NavigationDestination(
                  icon: Icon(Icons.space_dashboard_outlined), selectedIcon: Icon(Icons.space_dashboard), label: 'الرئيسية'),
              const NavigationDestination(icon: Icon(Icons.gavel_outlined), selectedIcon: Icon(Icons.gavel), label: 'قضاياي'),
              NavigationDestination(
                icon: Badge(
                    isLabelVisible: store.unread > 0,
                    label: Text('${store.unread}'),
                    child: const Icon(Icons.forum_outlined)),
                selectedIcon: const Icon(Icons.forum),
                label: 'المراسلة',
              ),
              const NavigationDestination(
                  icon: Icon(Icons.folder_outlined), selectedIcon: Icon(Icons.folder), label: 'المستندات'),
              const NavigationDestination(
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  selectedIcon: Icon(Icons.account_balance_wallet),
                  label: 'حسابي'),
            ],
          ),
        ),
      ),
    );
  }
}

/// يُستخدم في الشاشات لإظهار رسالة خطأ عامة
void showError(BuildContext context, Object e) => snack(context, e is ApiError ? e.message : 'حدث خطأ، حاول مجدداً.');
