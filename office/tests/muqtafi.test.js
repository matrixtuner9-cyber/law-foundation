'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const M = require('../lib/muqtafi.js');
const fx = n => fs.readFileSync(path.join(__dirname, 'fixtures', 'muqtafi', n), 'utf8');

test('المقتفي: صفحة النتائج → عدد النتائج وتنبيه التضييق وصفوف الأحكام بروابطها', () => {
  const r = M.parseResults(fx('results.html'));
  assert.equal(r.total, 758); assert.equal(r.narrow, true); assert.equal(r.loginRequired, false);
  assert.equal(r.results.length, 3);
  const a = r.results[0];
  assert.deepEqual([a.id, a.no, a.year, a.date, a.court, a.city, a.litigation, a.field], [104321, '520', '2016', '2019-02-10', 'النقض', 'رام الله', 'دعوى', 'حقوق']);
  assert.match(a.cardUrl, /ViewCJCard\.aspx\?CJID=104321$/); assert.match(a.textUrl, /CJFullText\.aspx\?CJID=104321$/); assert.match(a.pdfUrl, /ShowDoc\.aspx\?ID=104321$/);
  assert.equal(M.parseResults('<html><input name="ctl00$LoginView1$LogInCont1$Login1$UserName"></html>').loginRequired, true);
});

test('المقتفي: النص الكامل → الأقسام الخمسة وتاريخ الفصل والمواد المشار إليها', () => {
  const f = M.parseFullText(fx('fulltext.html'));
  assert.deepEqual(Object.keys(f.sections), ['judges', 'facts', 'reasoning', 'verdict', 'conclusions']);
  assert.match(f.sections.verdict, /تقرر المحكمة رد الطعن موضوعاً/);
  assert.ok(!/<|&nbsp;/.test(f.text), 'بلا وسوم'); assert.ok(f.text.length > 8000);
  assert.equal(f.decided, '2019-02-10');
  assert.equal(f.laws.length, 11); assert.deepEqual(f.laws[6], { legId: 13975, article: 24, text: 'المادة (24) من قانون العمل رقم 7 لسنة 2000' });
  assert.match(f.text, /^الديباجة\n/); assert.ok(f.text.includes('\n\nالتسبيب\n'));
});

test('المقتفي: بطاقة الحكم → الرأس والمبادئ والنصوص القانونية والأحكام ذات العلاقة ومسارات الكشاف', () => {
  const c = M.parseCard(fx('card.html'));
  assert.deepEqual([c.court, c.city, c.domain, c.no, c.year, c.date, c.litigation], ['النقض', 'رام الله', 'الدعوى الحقوقية', '520', '2016', '2019-02-10', 'دعوى']);
  assert.equal(c.principles.length, 4); assert.match(c.principles[2].text, /^عقد العمل محدد المدة يتم تكييفه/);
  assert.equal(c.laws.length, 11); assert.equal(c.laws[3].kind, 'تطبيق'); assert.equal(c.laws[3].linked, 187); assert.equal(c.laws[9].text, 'قانون العمل الفلسطيني');
  assert.deepEqual(c.related, [{ id: 104322, title: 'حكم محكمة الإستئناف المنعقدة في رام الله في الدعوى الحقوقية رقم 985 لسنة 2014' }]);
  assert.equal(c.paths.length, 5); assert.equal(c.paths[0], 'حقوق > عمل > مكافأة نهاية الخدمة');
});

test('المقتفي: التحويل إلى سجل مكتبة الاجتهادات (المبادئ جاهزة من البطاقة، المجال من الكشاف)', () => {
  const r = M.parseResults(fx('results.html')).results[0], c = M.parseCard(fx('card.html')), f = M.parseFullText(fx('fulltext.html'));
  const x = M.toRuling(r, c, f);
  assert.equal(x.court, 'محكمة النقض'); assert.equal(x.no, 'دعوى 520/2016'); assert.equal(x.date, '2019-02-10'); assert.equal(x.field, 'عمالي');
  assert.match(x.principle, /^1- صدور حكم/); assert.ok(x.principle.includes('\n3- عقد العمل'));
  assert.ok(x.keywords.includes('مكافأة نهاية الخدمة')); assert.match(x.summary, /رد الطعن موضوعاً/);
  assert.equal(x.muqtafiId, 104321); assert.match(x.srcUrl, /CJID=104321/); assert.equal(x.src, 'المقتفي · معهد الحقوق – جامعة بيرزيت');
  assert.equal(x.text.length, f.text.length);
});

test('المقتفي: نموذج الدخول → تُنسخ الحقول المخفية ولا يُطبع شيء من كلمة المرور في المفاتيح', () => {
  const html = '<form><input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="abc=="><input type="hidden" name="__EVENTVALIDATION" value="x&amp;y"></form>';
  const b = M.loginBody(html, 'office', 'p@ss');
  assert.equal(b.get('__VIEWSTATE'), 'abc=='); assert.equal(b.get('__EVENTVALIDATION'), 'x&y');
  assert.equal(b.get('ctl00$LoginView1$LogInCont1$Login1$UserName'), 'office'); assert.equal(b.get('ctl00$LoginView1$LogInCont1$Login1$Password'), 'p@ss');
});

/* ── عميل الجلسة والخدمة على موقع وهمي ── */
const LOGIN = '<form><input type="hidden" name="__VIEWSTATE" value="LV"><input name="ctl00$LoginView1$LogInCont1$Login1$UserName"><input name="ctl00$LoginView1$LogInCont1$Login1$Password"></form>';
function fakeSite({ user = 'office', pass = 'secret' } = {}) {
  const log = [], sessions = new Set(); let n = 0;
  const res = (status, body, headers = {}) => ({ status, headers: { get: k => headers[k.toLowerCase()] || null, getSetCookie: () => headers['set-cookie'] ? [headers['set-cookie']] : [] }, text: async () => body });
  const authed = h => { const c = (h && h.cookie) || ''; return [...sessions].some(s => c.includes('.ASPXAUTH=' + s)) };
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url), h = init.headers || {}; log.push((init.method || 'GET') + ' ' + u.pathname + u.search);
    if (u.pathname === '/index.aspx') {
      if (init.method === 'POST') { const b = new URLSearchParams(init.body); if (b.get('ctl00$LoginView1$LogInCont1$Login1$UserName') === user && b.get('ctl00$LoginView1$LogInCont1$Login1$Password') === pass && b.get('__VIEWSTATE') === 'LV') { const s = 'S' + (++n); sessions.add(s); return res(302, '', { location: '/courtjudgments/CJSearch.aspx?mid=1', 'set-cookie': '.ASPXAUTH=' + s + '; path=/; HttpOnly' }) } return res(200, LOGIN + 'خطأ في الدخول') }
      return res(200, LOGIN, { 'set-cookie': 'ASP.NET_SessionId=abc; path=/' });
    }
    if (!authed(h)) return res(302, '', { location: '/index.aspx?ReturnUrl=' + encodeURIComponent(u.pathname) });
    if (u.pathname === '/courtjudgments/CJSearch.aspx' && init.method === 'POST') { const b = new URLSearchParams(init.body); log.push('SEARCH q=' + b.get('ctl00$ContentPlaceHolder1$txtSearch') + ' court=' + b.get('ctl00$ContentPlaceHolder1$ddlCourtType') + ' vs=' + b.get('__VIEWSTATE').slice(0, 6)); return res(200, fx('results.html')) }
    if (u.pathname === '/courtjudgments/CJSearch.aspx') return res(200, fx('form.html'));
    if (u.pathname === '/courtjudgments/ViewCJCard.aspx') return res(200, fx('card.html'));
    if (u.pathname === '/courtjudgments/CJFullText.aspx') return res(200, fx('fulltext.html'));
    return res(404, '');
  };
  return { fetchImpl, log, sessions, expire: () => sessions.clear() };
}

test('المقتفي: العميل يسجّل الدخول بحساب المكتب عند الحاجة ويبحث ويقرأ الحكم، ويعيد الدخول إذا انتهت الجلسة', async () => {
  const site = fakeSite(), cl = M.createClient({ getCred: async () => ({ user: 'office', pass: 'secret' }), fetchImpl: site.fetchImpl });
  const r = await cl.search({ q: 'عقد العمل', court: '1', match: 'all' });
  assert.equal(r.total, 758); assert.equal(r.results[0].id, 104321);
  assert.ok(site.log.includes('POST /index.aspx?mid=1'), 'دخول'); assert.ok(site.log.some(l => l.startsWith('SEARCH q=عقد العمل court=1 vs=/wEPDw')), 'أُرسل النموذج بحقوله وViewState الصفحة');
  assert.ok(!site.log.join(' ').includes('secret'), 'كلمة المرور لا تظهر في المسارات');
  const j = await cl.judgment(104321); assert.equal(j.card.principles.length, 4); assert.match(j.full.sections.verdict, /رد الطعن/);
  site.expire(); const before = site.log.length;
  const r2 = await cl.search({ q: 'إيجار' }); assert.equal(r2.results.length, 3);
  assert.ok(site.log.slice(before).includes('POST /index.aspx?mid=1'), 'أعاد الدخول بعد انتهاء الجلسة');
});

test('المقتفي: بيانات خاطئة → رسالة واضحة؛ بلا بيانات → needCred', async () => {
  const site = fakeSite();
  await assert.rejects(M.createClient({ getCred: async () => ({ user: 'office', pass: 'wrong' }), fetchImpl: site.fetchImpl }).search({ q: 'x' }), e => e.badCred && e.status === 401);
  await assert.rejects(M.createClient({ getCred: async () => null, fetchImpl: site.fetchImpl }).search({ q: 'x' }), e => e.needCred);
});

test('المقتفي: الخدمة → الحالة بلا كلمة مرور، ضبط الاشتراك للمدير فقط مع تحقق، البحث والحكم مع السجل والحدود', async () => {
  const site = fakeSite(), audits = []; let cred = null;
  const svc = M.createService({ audit: a => audits.push(a), getCred: async () => cred, setCred: async c => { cred = c }, can: (u, w) => u.role === 'admin' || w !== 'manage', client: M.createClient({ getCred: async () => cred, fetchImpl: site.fetchImpl }) });
  const adm = { id: 1, username: 'adm', role: 'admin' }, law = { id: 2, username: 'law', role: 'lawyer' };
  let s = await svc('status', {}, law); assert.equal(s.body.configured, false); assert.equal(s.body.canManage, false); assert.ok(s.body.courts['1']);
  assert.equal((await svc('cred', { user: 'office', pass: 'secret' }, law)).status, 403);
  assert.equal((await svc('search', { q: 'x' }, law)).body.needCred, true);
  const c = await svc('cred', { user: 'office', pass: 'secret' }, adm); assert.equal(c.body.verified, true);
  s = await svc('status', {}, law); assert.equal(s.body.configured, true); assert.equal(s.body.user, 'office'); assert.equal(JSON.stringify(s.body).includes('secret'), false);
  assert.equal((await svc('search', {}, law)).status, 400);
  const r = await svc('search', { q: 'عقد', court: '1' }, law); assert.equal(r.status, 200); assert.equal(r.body.results.length, 3); assert.equal(r.body.narrow, true);
  const j = await svc('judgment', { id: 104321 }, law); assert.equal(j.status, 200); assert.equal(j.body.ruling.court, 'محكمة النقض'); assert.match(j.body.ruling.principle, /^1- /);
  assert.deepEqual(audits.map(a => a.action), ['muqtafi.error', 'muqtafi.cred_set', 'muqtafi.login_ok', 'muqtafi.search', 'muqtafi.judgment']);
  assert.ok(!JSON.stringify(audits).includes('secret'));
  for (let i = 0; i < 20; i++) await svc('search', { q: 'x' }, law);
  assert.equal((await svc('search', { q: 'x' }, law)).status, 429);
  const bad = await svc('cred', { user: 'office', pass: 'nope' }, adm); assert.equal(bad.body.verified, false); assert.match(bad.body.warning, /رفض المقتفي/);
});

test('المقتفي: التعرف على روابط الحكم', () => {
  assert.equal(M.idFromUrl('http://muqtafi.birzeit.edu/courtjudgments/ViewCJCard.aspx?CJID=104321'), 104321);
  assert.equal(M.idFromUrl('http://muqtafi.birzeit.edu/courtjudgments/CJFullText.aspx?CJID=55'), 55);
  assert.equal(M.idFromUrl('http://muqtafi.birzeit.edu/courtjudgments/CourtJCard.aspx?id=J104321.'), 104321);
  assert.equal(M.idFromUrl('https://maqam.najah.edu/judgments/5158/'), 0);
});

test('المقتفي: صفحات الموقع الحية → وسوم بحروف كبيرة وروابط نسبية بعلامات مفردة، وأحكام محمية بالتعمية تُعلَّم ولا تُفكّ', () => {
  const live = fx('fulltext.html').replace(/<a name="/g, '<a NAME="').replace(/http:\/\/muqtafi\.birzeit\.edu\/legislation\//g, '../legislation/').replace('بتاريخ 10/02/2019<br>', 'بتاريخ 10/02/2019.  <br>');
  const f = M.parseFullText(live);
  assert.deepEqual(Object.keys(f.sections), ['judges', 'facts', 'reasoning', 'verdict', 'conclusions']); assert.equal(f.decided, '2019-02-10'); assert.equal(f.laws.length, 11); assert.equal(f.protected, false);
  const prot = M.parseFullText('<!--hppage status="protected"--><html><BODY><SCRIPT>hp_d01("...")</SCRIPT></BODY></html>');
  assert.equal(prot.protected, true); assert.equal(prot.text, '');
  const card = fx('card.html').replace(/<a href="http:\/\/muqtafi\.birzeit\.edu\/courtjudgments\/KashafBrowser\.aspx\?PID=(\d+)">/g, "<a href='KashafBrowser.aspx?PID=$1' >").replace(/<\/a>&gt;/g, '</a>>');
  assert.equal(M.parseCard(card).paths.length, 5);
});
