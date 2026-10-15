// مكتب تجريبي ببيانات وهمية (50 قضية) للمعاينة والتجربة. لا يلمس أي مكتب حقيقي.
// node tools/demo.mjs [slug=demo]   (على جهاز المكتب: يقرأ .ops_token)  |  MQ_API=http://127.0.0.1:8790 OPS_TOKEN=... للمحاكي
import fs from 'node:fs'; import https from 'node:https'; import http from 'node:http'; import dns from 'node:dns'; import crypto from 'node:crypto';
const SLUG = process.argv[2] || 'demo';
const API = new URL(process.env.MQ_API || 'https://test.palgaz.net');
const TOKEN = process.env.OPS_TOKEN || fs.readFileSync(new URL('../.ops_token', import.meta.url), 'utf8').trim();
const R = new dns.Resolver(); R.setServers(['1.1.1.1', '1.0.0.1']);
const lookup = (host, opts, cb) => R.resolve4(host, (e, a) => e ? dns.lookup(host, opts, cb) : (opts && opts.all ? cb(null, a.map(x => ({ address: x, family: 4 }))) : cb(null, a[0], 4)));
const call = (m, p, b, host) => new Promise((ok, bad) => {
  const data = b ? Buffer.from(JSON.stringify(b)) : null, H = API.protocol === 'https:' ? https : http;
  const r = H.request({ host: API.hostname, port: API.port || undefined, path: p, method: m, ...(API.protocol === 'https:' ? { lookup } : {}), headers: { host: host || API.host, authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json', ...(data ? { 'content-length': data.length } : {}) } }, s => {
    const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { const t = Buffer.concat(ch).toString(); let j; try { j = JSON.parse(t) } catch (e) { j = { raw: t.slice(0, 300) } } ok({ status: s.statusCode, ...j }) });
  }); r.on('error', bad); if (data) r.write(data); r.end();
});

/* مولّد عشوائي ثابت حتى تتكرر نفس البيانات */
let seed = 20261015; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)], int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pad = n => String(n).padStart(2, '0');
const T0 = new Date(); T0.setHours(0, 0, 0, 0);
const day = n => { const d = new Date(T0); d.setDate(d.getDate() + n); if (d.getDay() === 5) d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) };
const stamp = (n, h, m) => day(n) + ' ' + pad(h) + ':' + pad(m);

const FIRST = ['أحمد', 'محمد', 'خالد', 'سامي', 'يوسف', 'عمر', 'ليث', 'رامي', 'باسل', 'إياد', 'ريم', 'سمر', 'هبة', 'دعاء', 'رهف', 'آمنة', 'نور', 'منى', 'عبد الله', 'فادي', 'مالك', 'حسام'];
const LAST = ['الشكعة', 'النابلسي', 'دويكات', 'عودة', 'حمدان', 'شتيه', 'قاسم', 'عمرو', 'المصري', 'طوقان', 'كنعان', 'الخطيب', 'البزور', 'عرفات', 'جرار', 'السعدي', 'حنون', 'زيد'];
const COS = ['شركة الزيتون للتجارة العامة', 'شركة الأفق للإنشاءات', 'مؤسسة البيارة للمقاولات', 'جمعية بيت فوريك التعاونية', 'شركة نابلس للأدوية', 'شركة القدس للتأمين', 'مصنع الجبل للحجر والرخام', 'شركة الكرمل للاستيراد', 'مجموعة النور التجارية', 'شركة جنين للصناعات الغذائية'];
const CITIES = ['نابلس', 'نابلس', 'نابلس', 'رام الله', 'جنين', 'طولكرم', 'قلقيلية', 'سلفيت'];
const person = () => pick(FIRST) + ' ' + pick(FIRST) + ' ' + pick(LAST);
const phone = () => '05' + pick(['99', '98', '97', '69', '68', '92']) + '-' + int(100, 999) + '-' + int(100, 999);

const clients = [];
for (let i = 1; i <= 30; i++) {
  const co = i % 4 === 0, fee = pick([2500, 3500, 4000, 6000, 8000, 12000, 18000, 24000]);
  const paid = Math.min(fee, Math.round(fee * pick([0, .25, .5, .5, .75, 1, 1]) / 100) * 100);
  const since = day(-int(20, 420)), ph = phone();
  clients.push({ id: 'c' + i, name: co ? COS[(i / 4 - 1) % COS.length] : person(), type: co ? (i % 8 === 0 ? 'جمعية' : 'شركة') : 'فرد', idNo: co ? '56' + int(1000, 9999) + 'xxx' : int(4, 9) + 'xxxx' + int(1000, 9999), phone: ph, whatsapp: co ? '' : ph, city: pick(CITIES), ch: pick(['واتساب', 'واتساب', 'البوابة', 'رسالة SMS', 'البريد الإلكتروني']), portal: rnd() > .15, last: rnd() > .3 ? day(-int(0, 20)) : null, fee, paid, since, code: 'MQ-' + (1000 + i * 137 % 9000 + i) });
}
const opponents = [];
for (let i = 1; i <= 25; i++) opponents.push({ id: 'o' + i, name: i % 5 === 0 ? pick(COS) : i % 7 === 0 ? 'النيابة العامة' : person(), type: i % 5 === 0 ? 'شركة' : i % 7 === 0 ? 'جهة رسمية' : 'فرد', lawyer: i % 7 === 0 ? 'وكيل النيابة' : rnd() > .3 ? 'المحامي ' + person() : 'بدون وكيل' });

const TYPES = [
  ['حقوقية · مطالبة مالية', 'مطالبة بمبلغ مالي عن توريدات غير مدفوعة', ['ct1', 'ct2'], 'مدعٍ'],
  ['عمالية', 'مطالبة بحقوق عمالية ومكافأة نهاية خدمة', ['ct1', 'ct5'], 'مدعٍ'],
  ['إخلاء مأجور', 'إخلاء مأجور لعدم دفع الأجرة', ['ct1', 'ct5'], 'مدعٍ'],
  ['جزائية', 'الدفاع في قضية إعطاء شيك دون رصيد', ['ct1', 'ct2'], 'مشتكى عليه'],
  ['حقوقية · فسخ عقد', 'فسخ عقد بيع وإعادة الثمن', ['ct2', 'ct6'], 'مدعٍ'],
  ['تعويض', 'تعويض عن أضرار حادث سير', ['ct2', 'ct6'], 'مدعٍ'],
  ['استئناف حقوقي', 'استئناف حكم صلح في مطالبة مالية', ['ct3'], 'مستأنف'],
  ['تنفيذ', 'تنفيذ حكم قطعي بمبلغ مالي', ['ct7'], 'محكوم له'],
  ['أحوال شخصية', 'نفقة وحضانة', ['ct8'], 'مدعية'],
  ['منع معارضة', 'منع معارضة في أرض زراعية', ['ct1', 'ct2'], 'مدعٍ'],
  ['إداري', 'إلغاء قرار إداري', ['ct3'], 'مستدعٍ'],
  ['نقض', 'طعن بالنقض في حكم استئنافي', ['ct4'], 'طاعن']];
const STAGE = ['تسجيل الدعوى', 'تبادل اللوائح', 'تقديم البينات', 'المرافعة الختامية', 'صدر الحكم · مهلة الطعن', 'إجراءات التنفيذ'];
const PURPOSE = ['تقديم البينات', 'سماع الشهود', 'تبادل اللوائح', 'المرافعة الختامية', 'تدقيق', 'إبراز المستندات', 'الجلسة الأولى', 'ضم ملف', 'خبرة فنية', 'النطق بالحكم'];
const RESULT = ['تأجيل لاستكمال البينات', 'سُمع شاهدان وتأجلت', 'تأجيل لتبليغ الخصم', 'قدمت اللائحة الجوابية', 'تأجيل لتقديم المرافعة', 'تقرر تعيين خبير'];
const TIMES = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
const cases = [], hearings = [], deadlines = [], docs = [];
let hN = 0, dN = 0, xN = 0;
for (let i = 1; i <= 50; i++) {
  const t = pick(TYPES), cl = clients[(i * 7) % 30], court = pick(t[2]);
  const status = i <= 34 ? 'نشطة' : i <= 40 ? 'تنفيذ' : i <= 45 ? 'محكوم' : 'منتهية';
  const step = status === 'تنفيذ' ? 5 : status === 'محكوم' ? 4 : status === 'منتهية' ? 4 : int(0, 3);
  const opened = day(-int(30, 700)), yr = opened.slice(0, 4);
  const k = { id: 'k' + i, no: int(40, 3900) + '/' + yr, court: t[0] === 'تنفيذ' ? 'ct7' : court, type: t[0], subject: t[1], client: cl.id, opps: [pick(opponents).id], role: t[3], stage: STAGE[step], step, status, value: pick([4500, 12000, 18000, 25000, 42500, 64000, 95000, 140000, 186000, 240000]), opened, mz: 'NB-' + pick(['SL', 'BD', 'IS', 'TN']) + '-' + yr + '-' + String(int(1, 3999)).padStart(5, '0'), pri: pick(['عالية', 'متوسطة', 'متوسطة', 'منخفضة']) };
  if (t[0] === 'جزائية') k.opps = ['o7'];
  cases.push(k);
  // جلسات سابقة
  for (let j = 0, n = int(1, 3); j < n; j++) hearings.push({ id: 'h' + (++hN), k: k.id, date: day(-int(10, 160) - j * 30), time: pick(TIMES), purpose: pick(PURPOSE), result: pick(RESULT), mz: rnd() > .2 });
  // جلسة قادمة للقضايا الجارية
  if (status === 'نشطة' || status === 'تنفيذ') {
    const off = i <= 4 ? 0 : i <= 7 ? 1 : int(2, 45);
    hearings.push({ id: 'h' + (++hN), k: k.id, date: day(off), time: pick(TIMES), purpose: pick(PURPOSE), mz: rnd() > .15, ...(rnd() > .8 ? { attend: true } : {}) });
  }
  // مهل
  if (status === 'محكوم') deadlines.push({ id: 'dl' + (++dN), k: k.id, title: 'آخر موعد لتقديم الاستئناف (30 يوماً من صدور الحكم)', due: day(int(1, 28)), kind: 'مهلة طعن' });
  else if (status === 'نشطة' && rnd() > .45) deadlines.push({ id: 'dl' + (++dN), k: k.id, title: pick(['إيداع قائمة البينات الإضافية', 'تقديم لائحة جوابية', 'استلام مستندات من الموكل', 'دفع رسوم الخبرة', 'تبليغ الخصم بالحكم التمهيدي']), due: day(int(0, 25)), kind: pick(['إجرائية', 'داخلية']) });
  else if (status === 'تنفيذ' && rnd() > .5) deadlines.push({ id: 'dl' + (++dN), k: k.id, title: 'تجديد طلب الحجز التنفيذي', due: day(int(3, 30)), kind: 'إجرائية' });
  // مستندات
  const DT = [['لائحة الدعوى', 'لائحة', 'مولّد من نموذج'], ['وكالة خاصة', 'وكالة', 'مولّد من نموذج'], ['محضر جلسة', 'محضر', 'ميزان'], ['قائمة البينات', 'لائحة', 'مولّد من نموذج'], ['عقد موقّع', 'بينة خطية', 'رفع يدوي'], ['فواتير', 'بينة خطية', 'رفع يدوي'], ['تقرير خبرة', 'بينة خطية', 'ميزان'], ['الحكم', 'حكم', 'ميزان'], ['إنذار عدلي', 'إنذار', 'مولّد من نموذج']];
  for (let j = 0, n = int(1, 4); j < n; j++) { const d = DT[(i + j * 3) % DT.length]; docs.push({ id: 'd' + (++xN), k: k.id, title: d[0], kind: d[1], date: day(-int(0, 200)), src: d[2], pages: int(1, 18), shared: rnd() > .25 }) }
}
const mzLog = cases.filter(k => k.mz).slice(0, 6).map((k, i) => ({ at: stamp(-i, 8 + i, 15), k: k.id, t: pick(['تحديث موعد الجلسة القادمة من ميزان', 'إضافة محضر جلسة جديد', 'تأكيد موعد الجلسة دون تغيير']) }));
const msgs = []; let mN = 0;
const MT = [['them', 'هل يلزم حضوري شخصياً في الجلسة القادمة؟'], ['me', 'لا يلزم حضورك، سنوافيك بالنتيجة بعد الجلسة.'], ['them', 'أرسلت لكم صورة العقد عبر البوابة.'], ['me', 'نحتاج كشف الحساب قبل نهاية الأسبوع.'], ['them', 'شكراً لكم، سأحضر الدفعة يوم الأحد.'], ['them', 'متى موعد الجلسة القادمة؟']];
clients.filter(c => c.portal).slice(0, 14).forEach((c, i) => { for (let j = 0, n = int(1, 3); j < n; j++) { const m = MT[(i + j) % MT.length], at = stamp(-int(0, 6) - (n - j), int(8, 20), int(0, 59)); msgs.push({ id: 'm' + (++mN), client: c.id, f: m[0], ch: c.ch === 'واتساب' ? 'واتساب' : 'البوابة', t: m[1], at, ...(m[0] === 'them' && j === n - 1 && i % 2 === 0 ? { unread: true } : {}) }) } });

/* المستخدمون: مدير + محامٍ (كلمات مرور بنفس معاملات scrypt المعتمدة) */
const user = (id, username, name, role, pw) => { const salt = crypto.randomBytes(8).toString('hex') + crypto.randomBytes(8).toString('hex'); return { id, username, name, role, salt, hash: crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex'), active: 1, must_change: 0, cases: '[]', created_at: stamp(0, 9, 0), last_login: null } };
const PW = process.env.DEMO_PW || 'Demo2026';
const users = [user('u1', 'demo', 'المحامي أحمد الشراري', 'admin', PW), user('u2', 'lawyer', 'المحامية ريم طوقان', 'lawyer', PW)];

const at = stamp(0, 9, 0), rec = (kind, list) => list.map(x => ({ kind, id: x.id, data: JSON.stringify(x), updated_at: at, updated_by: 'demo' }));
const payload = {
  records: [...rec('clients', clients), ...rec('opponents', opponents), ...rec('cases', cases), ...rec('hearings', hearings), ...rec('deadlines', deadlines), ...rec('docs', docs)],
  kv: [{ key: 'mzLog', value: JSON.stringify(mzLog) }, { key: 'state_saved', value: 'true' }, { key: 'settings', value: JSON.stringify({ edition: 'office', officeName: 'مكتب العدل للمحاماة', lawyerName: 'المحامي أحمد الشراري', city: 'نابلس', phone: '09-238-0000', hours: '8:00 – 16:00', tagline: 'محامون ومستشارون قانونيون', rules: { remind: true } }) }],
  messages: msgs.map(m => ({ id: m.id, client: m.client, at: m.at, data: JSON.stringify(m) })), users, audit: [],
};
console.log(`البيانات: ${clients.length} موكلاً، ${cases.length} قضية، ${hearings.length} جلسة، ${deadlines.length} مهلة، ${docs.length} مستنداً، ${msgs.length} رسالة`);

const list = await call('GET', '/_ops/offices');
if (!JSON.stringify(list).includes(`"slug":"${SLUG}"`)) {
  const r = await call('POST', '/_ops/offices', { slug: SLUG, name: 'مكتب العدل للمحاماة', lawyer: 'المحامي أحمد الشراري', city: 'نابلس', import: true });
  console.log('إنشاء المكتب:', r.status, r.error || 'ok');
}
const r = await call('POST', `/_ops/offices/${SLUG}/import`, payload);
console.log('الاستيراد:', r.status, r.error || JSON.stringify(r.verify));
const info = await call('GET', `/_ops/offices/${SLUG}/info`);
console.log('المكتب:', JSON.stringify({ users: info.users, records: info.records, messages: info.messages }));
console.log(r.status === 200 ? `\n✔ جاهز: https://${SLUG}.palgaz.net  مستخدم: demo  كلمة المرور: ${PW}` : '\n✘ لم يكتمل');
