// اختبارات التحصين للنسخة السحابية على المحاكي المحلي (wrangler dev)
// التشغيل: npx wrangler dev --port 8790 --var OPS_TOKEN:devtoken123 --var BASE_DOMAINS:localhost --var OPS_HOSTS:localhost --var BACKUP_KEY:test-key
//          ثم: node tools/hardening.mjs
import http from 'node:http';
const PORT = +process.env.PORT || 8790, OPS = process.env.OPS || 'devtoken123';
let fails = 0, passes = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✘ ') + msg); c ? passes++ : fails++ };
function req(host, method, path, { body, headers = {}, raw } = {}) {
  return new Promise((res, rej) => {
    const data = body == null ? null : raw ? body : Buffer.from(JSON.stringify(body));
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path, headers: { host, ...(data ? { 'content-type': raw ? headers['content-type'] : 'application/json', 'content-length': data.length } : {}), ...headers } }, s => {
      const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { const b = Buffer.concat(ch); let j = null; try { j = JSON.parse(b) } catch (e) {} res({ status: s.statusCode, headers: s.headers, body: b, json: j }) });
    }); r.on('error', rej); if (data) r.write(data); r.end();
  });
}
const STRONG = /^MQ-[A-HJ-NP-Z2-9]{10}$/;
const opsH = { authorization: 'Bearer ' + OPS };
const slug = 'h' + Date.now().toString(36).slice(-6), H = slug + '.localhost';

// ── مفتاح المشغّل ──
let r = await req('localhost', 'POST', '/_ops/offices', { headers: opsH, body: { slug, name: 'مكتب اختبار التحصين', lawyer: 'محامٍ', city: 'نابلس' } });
ok(r.status === 201, 'إنشاء مكتب عبر نطاق الإدارة');
r = await req(H, 'GET', '/_ops/offices', { headers: opsH });
ok(r.status === 404, 'عمليات المشغّل مرفوضة على نطاق المكتب حتى بالرمز الصحيح');
r = await req(H, 'GET', '/_ops/export', { headers: { ...opsH, 'x-mq-ops': 'forged' } });
ok(r.status === 404, 'لا يمكن انتحال توقيع المشغّل الداخلي من نطاق المكتب');

const link = (await req('localhost', 'POST', `/_ops/offices/${slug}/setup-link`, { headers: opsH })).json;
r = await req(H, 'POST', '/api/auth/setup', { body: { name: 'المدير', username: 'admin', password: 'Pass1234', setupToken: link.token } });
ok(r.status === 200, 'إعداد المدير الأول');
const cookie = r.headers['set-cookie'][0].split(';')[0], C = { cookie };
const boot = async () => (await req(H, 'GET', '/api/admin/bootstrap', { headers: C })).json.state;

// ── الحفظ الآمن والرموز ──
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { clients: [{ id: 'c1', name: 'موكل أ', code: 'MQ-1111', portal: true, fee: 1000, paid: 0 }, { id: 'c2', name: 'موكل ب', code: 'MQ-1111', portal: true, fee: 0, paid: 0 }], opponents: [], cases: [{ id: 'k1', no: '1/2026', client: 'c1', court: 'ct1', opps: [] }], hearings: [], deadlines: [], docs: [{ id: 'd1', k: 'k1', title: 'مستند', date: '2026-10-01' }], mzLog: [] } });
ok(r.status === 200 && r.json.codes.length === 2, 'الرموز الضعيفة والمكررة استُبدلت عند الإنشاء');
let st = await boot();
ok(st.clients.every(c => STRONG.test(c.code)) && st.clients[0].code !== st.clients[1].code, 'كل الرموز قوية وفريدة');
const c1 = st.clients[0];
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { clients: [{ ...c1, city: 'جنين' }] } } });
ok(r.json.versions[0][2] === 2 && !r.json.conflicts.length, 'تعديل على أحدث نسخة يُقبل');
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { clients: [{ ...c1, _v: 1, city: 'الخليل' }] } } });
ok(r.json.conflicts.length === 1 && r.json.conflicts[0].rec.city === 'جنين', 'تعديل على نسخة قديمة يُرفض ويعاد الأحدث');
st = await boot();
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { ...st, clients: [st.clients[0]] } });
ok((await boot()).clients.length === 2, 'غياب سجل عن الطلب لا يحذفه');
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: {}, deleted: { docs: ['d1'] } } });
ok((await boot()).docs.length === 0, 'الحذف الصريح يعمل');
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { clients: [{ ...st.clients[1], code: 'MQ-9999' }] } } });
ok((await boot()).clients[1].code === st.clients[1].code, 'الرمز لا يتغير من شاشة المكتب');

// ── البوابة ──
const good = (await boot()).clients[0].code;
r = await req(H, 'POST', '/api/portal/login', { body: { code: good } });
ok(r.status === 200, 'دخول الموكل بالرمز القوي');
r = await req(H, 'POST', '/api/admin/client-code', { headers: C, body: { client: 'c1' } });
const nc = r.json.clients && r.json.clients[0].code;
ok(r.status === 200 && STRONG.test(nc) && nc !== good, 'تجديد الرمز');
r = await req(H, 'GET', '/api/portal/home', { headers: { 'x-client': good, 'cf-connecting-ip': '198.51.100.1' } });
ok(r.status === 401, 'الرمز القديم يتوقف فوراً');
for (let i = 0; i < 20; i++) await req(H, 'GET', '/api/portal/home', { headers: { 'x-client': 'MQ-' + (2000 + i), 'cf-connecting-ip': '198.51.100.9' } });
r = await req(H, 'GET', '/api/portal/home', { headers: { 'x-client': nc, 'cf-connecting-ip': '198.51.100.9' } });
ok(r.status === 429, 'العنوان الذي خمّن 20 مرة موقوف');

// ── وصول الدعم الفني ──
r = await req('localhost', 'GET', `/_ops/offices/${slug}/export`, { headers: opsH });
ok(r.status === 403, 'تصدير بيانات المكتب مرفوض دون إذن المكتب');
r = await req(H, 'POST', '/api/support/grant', { headers: C, body: { hours: 4 } });
ok(r.status === 200 && r.json.until > Date.now(), 'مدير المكتب يمنح إذناً مؤقتاً');
r = await req('localhost', 'GET', `/_ops/offices/${slug}/export`, { headers: opsH });
const ex = r.json || {};
ok(r.status === 200 && ex.records.length > 0, 'التصدير يعمل بعد الإذن');
ok(ex.users.every(u => !('hash' in u) && !('salt' in u)), 'التصدير لا يتضمن كلمات المرور');
ok(!ex.kv.some(k => ['audit_key', 'media_key', 'support_grant'].includes(k.key)), 'التصدير لا يتضمن مفاتيح التدقيق والتوقيع');
await req(H, 'POST', '/api/support/revoke', { headers: C, body: {} });
r = await req('localhost', 'GET', `/_ops/offices/${slug}/export`, { headers: opsH });
ok(r.status === 403, 'إلغاء الإذن يغلق التصدير فوراً');
r = await req(H, 'GET', '/api/audit?limit=50', { headers: C });
const acts = (r.json && (r.json.rows || r.json.list || r.json) || []).map ? (r.json.rows || r.json.list || r.json).map(x => x.action) : [];
ok(['support.grant', 'ops.export', 'support.revoke', 'ops.export_denied'].every(a => acts.includes(a)), 'كل وصول للمشغّل مسجّل في سجل تدقيق المكتب');

// ── ملفات R2 ──
r = await req('localhost', 'PUT', `/_ops/offices/${slug}/media?file=aaaaaaaaaaaa.txt`, { headers: { ...opsH, 'content-type': 'text/plain' }, body: Buffer.from('first'), raw: true });
ok(r.status === 200, 'رفع ملف جديد عبر المشغّل');
r = await req('localhost', 'PUT', `/_ops/offices/${slug}/media?file=aaaaaaaaaaaa.txt`, { headers: { ...opsH, 'content-type': 'text/plain' }, body: Buffer.from('tampered'), raw: true });
ok(r.status === 409, 'لا يُستبدل ملف موجود بصمت');

// ── النسخ الاحتياطي المشفّر ──
r = await req('localhost', 'POST', `/_ops/offices/${slug}/backup`, { headers: opsH });
ok(r.status === 200 && r.json.ok && r.json.bytes > 100, 'نسخة احتياطية مشفّرة إلى R2 (' + (r.json && r.json.key) + ')');
r = await req(H, 'GET', '/api/admin/bootstrap', { headers: C });
ok(r.json.settings.backupLast && r.json.settings.backupLast.ok, 'حالة آخر نسخة تظهر في الإعدادات');

console.log(`\n${passes} PASS · ${fails} FAIL`);
process.exit(fails ? 1 : 0);
