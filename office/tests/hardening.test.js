// اختبارات التحصين لخادم المكتب: تشغيل خادم حقيقي على قاعدة مؤقتة ثم فحصه عبر HTTP
// التشغيل: node --test office/tests
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http');

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-test-'));
const DATA = path.join(TMP, 'data'), BK = path.join(TMP, 'backups'), MIRROR = path.join(TMP, 'mirror');
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const STRONG = /^MQ-[A-HJ-NP-Z2-9]{10}$/;
let srv, cookie = '';

const req = async (p, { method = 'GET', body, headers = {}, raw = false } = {}) => {
  const r = await fetch(BASE + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (raw) return r;
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j, r };
};
const boot = async () => (await req('/api/admin/bootstrap')).j;
const save = (changes, extra = {}) => req('/api/admin/state', { method: 'POST', body: { v: 2, changes, ...extra } });

before(async () => {
  srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: DATA, MQ_BACKUP: 'off', MQ_BACKUP_DIR: BK, MQ_BACKUP_MIRROR: MIRROR }, stdio: ['ignore', 'pipe', 'pipe'] });
  srv.stderr.on('data', d => process.stderr.write('[srv] ' + d));
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  const s = await req('/api/auth/setup', { method: 'POST', body: { username: 'admin', name: 'مدير الاختبار', password: 'Test12345' } });
  assert.equal(s.status, 200, JSON.stringify(s.j));
  cookie = (s.r.headers.get('set-cookie') || '').split(';')[0];
});
after(() => { if (srv) srv.kill(); fs.rmSync(TMP, { recursive: true, force: true }) });

test('أول حفظ (صيغة قديمة كاملة) ينشئ السجلات ويستبدل رموز البذرة الضعيفة برموز قوية فريدة', async () => {
  const SEED = require(path.join(ROOT, 'data.js'));
  const r = await req('/api/admin/state', { method: 'POST', body: { clients: SEED.clients, opponents: SEED.opponents, cases: SEED.cases, hearings: SEED.hearings, deadlines: SEED.deadlines, docs: SEED.docs, mzLog: [] } });
  assert.equal(r.status, 200);
  assert.equal(r.j.codes.length, SEED.clients.length, 'كل الرموز الضعيفة استُبدلت');
  const b = await boot();
  assert.equal(b.state.clients.length, SEED.clients.length);
  const codes = b.state.clients.map(c => c.code);
  assert.ok(codes.every(c => STRONG.test(c)), 'كل الرموز قوية');
  assert.equal(new Set(codes).size, codes.length, 'لا تكرار');
  assert.ok(b.state.clients.every(c => c._v === 1));
});

test('تعديل على أحدث إصدار يُقبل ويرفع رقم الإصدار', async () => {
  const c = (await boot()).state.clients[0];
  const r = await save({ clients: [{ ...c, city: 'جنين' }] });
  assert.equal(r.status, 200); assert.equal(r.j.conflicts.length, 0);
  assert.deepEqual(r.j.versions[0], ['clients', c.id, 2]);
  assert.equal((await boot()).state.clients[0].city, 'جنين');
});

test('تعديل مبني على نسخة قديمة يُرفض كتعارض ويعيد أحدث نسخة، دون أن يمحو عمل الزميل', async () => {
  const c = (await boot()).state.clients[0];               // _v = 2، المدينة جنين
  const stale = { ...c, _v: 1, city: 'الخليل' };            // زميل يعمل على نسخة قديمة
  const r = await save({ clients: [stale] });
  assert.equal(r.j.conflicts.length, 1);
  assert.equal(r.j.conflicts[0].rec.city, 'جنين');
  assert.equal((await boot()).state.clients[0].city, 'جنين', 'تعديل الزميل الأول باقٍ');
});

test('غياب سجل عن طلب الحفظ لا يحذفه (حتى بالصيغة القديمة الكاملة)', async () => {
  const st = (await boot()).state, n = st.clients.length, gone = st.clients[1].id;
  const r = await req('/api/admin/state', { method: 'POST', body: { ...st, clients: st.clients.filter(c => c.id !== gone) } });
  assert.equal(r.status, 200);
  const after = (await boot()).state;
  assert.equal(after.clients.length, n);
  assert.ok(after.clients.some(c => c.id === gone));
});

test('الحذف الصريح فقط يحذف', async () => {
  const st = (await boot()).state, d = st.docs[0];
  const r = await save({}, { deleted: { docs: [d.id] } });
  assert.equal(r.status, 200);
  assert.ok(!(await boot()).state.docs.some(x => x.id === d.id));
});

test('رمز الموكل لا يتغير من شاشة المكتب، والموكل الجديد برمز ضعيف أو مكرر يحصل على رمز قوي فريد', async () => {
  const st = (await boot()).state, c = st.clients[2];
  const r1 = await save({ clients: [{ ...c, code: 'MQ-1111', name: c.name + ' ' }] });
  assert.equal(r1.j.codes[0][1], c.code, 'الخادم يعيد الرمز الأصلي');
  assert.equal((await boot()).state.clients[2].code, c.code);
  const dup = st.clients[0].code;
  const r2 = await save({ clients: [{ id: 'cnew1', name: 'موكل اختبار', code: 'MQ-1234', portal: true, fee: 0, paid: 0 }, { id: 'cnew2', name: 'موكل اختبار 2', code: dup, portal: true, fee: 0, paid: 0 }] });
  const got = Object.fromEntries(r2.j.codes);
  assert.ok(STRONG.test(got.cnew1) && STRONG.test(got.cnew2));
  assert.notEqual(got.cnew2, dup);
});

test('تجديد رمز موكل يوقف الرمز القديم فوراً', async () => {
  const c = (await boot()).state.clients.find(x => x.portal);
  assert.equal((await req('/api/portal/login', { method: 'POST', body: { code: c.code }, headers: { cookie: '' } })).status, 200);
  const r = await req('/api/admin/client-code', { method: 'POST', body: { client: c.id } });
  assert.equal(r.status, 200); const nc = r.j.clients[0].code;
  assert.ok(STRONG.test(nc) && nc !== c.code);
  assert.equal((await req('/api/portal/home', { headers: { 'x-client': c.code } })).status, 401);
  assert.equal((await req('/api/portal/home', { headers: { 'x-client': nc } })).status, 200);
});

test('حماية البوابة: 20 رمزاً خاطئاً من عنوان واحد توقف العنوان على كل مسارات البوابة، ولا تؤثر على غيره', async () => {
  const good = (await boot()).state.clients.find(x => x.portal).code, A = { 'cf-connecting-ip': '203.0.113.7' }, B = { 'cf-connecting-ip': '203.0.113.8' };
  for (let i = 0; i < 20; i++) assert.equal((await req('/api/portal/home', { headers: { ...A, 'x-client': 'MQ-' + (1000 + i) } })).status, 401);
  assert.equal((await req('/api/portal/home', { headers: { ...A, 'x-client': good } })).status, 429, 'العنوان موقوف حتى بالرمز الصحيح');
  assert.equal((await req('/api/portal/login', { method: 'POST', body: { code: good }, headers: A })).status, 429);
  assert.equal((await req('/api/portal/home', { headers: { ...B, 'x-client': good } })).status, 200, 'عنوان آخر يعمل');
});

test('ترويسة Range خاطئة لا تُسقط الخادم', async () => {
  const c = (await boot()).state.clients[0];
  const up = await fetch(`${BASE}/api/admin/file?client=${c.id}&name=t.txt`, { method: 'POST', headers: { cookie, 'content-type': 'text/plain' }, body: 'hello world, this is a test file' });
  const m = await up.json(); assert.equal(up.status, 201);
  const r = await fetch(BASE + m.file, { headers: { range: 'bytes=100-50' } });
  assert.equal(r.status, 416);
  assert.equal((await fetch(BASE + '/api/health')).status, 200, 'الخادم ما زال يعمل');
});

test('النسخ الاحتياطي: نسخة متسقة سليمة مع بيان ونسخة ثانية', async () => {
  const r = await req('/api/backup/run', { method: 'POST', body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.ok(fs.existsSync(path.join(r.j.dir, 'mithaq.db')));
  const man = JSON.parse(fs.readFileSync(path.join(r.j.dir, 'manifest.json'), 'utf8'));
  assert.equal(man.integrity, 'ok');
  assert.ok(man.counts.records > 0);
  assert.ok(fs.existsSync(path.join(BK, 'media')) && fs.readdirSync(path.join(BK, 'media')).length >= 1, 'المرفقات منسوخة');
  assert.ok(r.j.mirror && r.j.mirror.ok, 'النسخة الثانية نجحت');
  const st = await req('/api/backup/status');
  assert.equal(st.j.last.ok, true);
});

test('بث السجلات للزملاء فوراً عند الحفظ', async () => {
  const got = await new Promise((resolve, reject) => {
    const rq = http.get(BASE + '/api/stream', { headers: { cookie } }, res => {
      let buf = ''; res.on('data', d => { buf += d; if (buf.includes('event: records')) { rq.destroy(); resolve(buf) } });
    });
    rq.on('error', () => {});
    setTimeout(async () => { const c = (await boot()).state.clients[3]; await save({ clients: [{ ...c, address: 'عنوان جديد' }] }) }, 300);
    setTimeout(() => reject(new Error('timeout')), 5000);
  });
  assert.match(got, /عنوان جديد/);
});

test('المستخدم المطّلع (viewer) لا يستطيع الحفظ أو تجديد الرموز', async () => {
  const u = await req('/api/users', { method: 'POST', body: { name: 'مطّلع', username: 'viewer1', role: 'viewer', password: 'Viewer123' } });
  assert.equal(u.status, 201, JSON.stringify(u.j));
  const saved = cookie;
  const l = await req('/api/auth/login', { method: 'POST', body: { username: 'viewer1', password: 'Viewer123' }, headers: { cookie: '' } });
  cookie = (l.r.headers.get('set-cookie') || '').split(';')[0];
  try {
    assert.equal((await save({ clients: [] })).status, 403);
    assert.equal((await req('/api/admin/rotate-weak', { method: 'POST', body: {} })).status, 403);
    assert.equal((await req('/api/backup/run', { method: 'POST', body: {} })).status, 403);
  } finally { cookie = saved }
});
