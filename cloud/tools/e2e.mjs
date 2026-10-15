// اختبار شامل على المحاكي المحلي: إعداد، دخول، حفظ بيانات، رسائل، ملفات موقّعة، بوابة الموكل، العزل بين مكتبين، سلسلة التدقيق
import http from 'node:http';
const PORT = +process.env.PORT || 8790, OPS = 'devtoken123';
let fails = 0; const ok = (c, msg) => { console.log((c ? '✔ ' : '✘ ') + msg); if (!c) fails++ };
function req(host, method, path, { body, headers = {}, raw } = {}) {
  return new Promise((res, rej) => {
    const data = body == null ? null : raw ? body : Buffer.from(JSON.stringify(body));
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path, headers: { host, ...(data ? { 'content-type': raw ? headers['content-type'] : 'application/json', 'content-length': data.length } : {}), ...headers } }, s => {
      const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { const b = Buffer.concat(ch); let j = null; try { j = JSON.parse(b) } catch (e) {} res({ status: s.statusCode, headers: s.headers, body: b, json: j }) });
    }); r.on('error', rej); if (data) r.write(data); r.end();
  });
}
const opsH = { authorization: 'Bearer ' + OPS };
const A = 'alpha.localhost', B = 'beta.localhost';

// 1) إعداد المدير الأول برابط لمرة واحدة
const link = (await req('localhost', 'POST', '/_ops/offices/alpha/setup-link', { headers: opsH })).json;
let r = await req(A, 'POST', '/api/auth/setup', { body: { name: 'المحامي أ', username: 'admin', password: 'Pass1234' } });
ok(r.status === 403, 'setup without token is refused');
r = await req(A, 'POST', '/api/auth/setup', { body: { name: 'المحامي أ', username: 'admin', password: 'Pass1234', setupToken: link.token } });
ok(r.status === 200 && r.headers['set-cookie'], 'setup with token creates admin + session');
const cookie = r.headers['set-cookie'][0].split(';')[0];
r = await req(A, 'POST', '/api/auth/setup', { body: { name: 'x', username: 'admin2', password: 'Pass1234', setupToken: link.token } });
ok(r.status === 409, 'setup link cannot be reused');

// 2) الدخول وقفل الحساب
r = await req(A, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'wrong123' } });
ok(r.status === 401, 'wrong password refused');
r = await req(A, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'Pass1234' } });
ok(r.status === 200, 'correct password logs in');
r = await req(A, 'GET', '/index.html'); ok(r.status === 302, 'lawyer screen redirects to login without session');
r = await req(A, 'GET', '/index.html', { headers: { cookie } }); ok(r.status === 200 && String(r.body).includes('<'), 'lawyer screen served with session');
r = await req(A, 'GET', '/app.js'); ok(r.status === 401, 'app.js protected');

// 3) بيانات المكتب
r = await req(A, 'GET', '/api/admin/bootstrap', { headers: { cookie } });
ok(r.status === 200 && r.json.state && r.json.state.clients.length === 0, 'new office starts empty (no demo data)');
const st = { clients: [{ id: 'c1', name: 'موكل تجريبي', code: 'MQ-1111', portal: true, fee: 1000, paid: 200 }], opponents: [], cases: [{ id: 'k1', no: '12/2026', client: 'c1', court: 'ct1', opps: [], step: 1, stage: 'بينات المدعي' }], hearings: [{ id: 'h1', k: 'k1', date: '2026-11-01', time: '09:00', purpose: 'بينات' }], deadlines: [{ k: 'k1', due: '2026-11-20', title: 'مهلة طعن', kind: 'طعن' }], docs: [], mzLog: [] };
r = await req(A, 'POST', '/api/admin/state', { headers: { cookie }, body: st });
ok(r.status === 200 && r.json.changed === 4, 'state saved with per-record changes (' + (r.json && r.json.changed) + ')');
// الخادم يستبدل الرمز الضعيف MQ-1111 برمز قوي؛ نستخدم الرمز الفعلي الصادر
const CODE = (r.json.codes.find(([id]) => id === 'c1') || [])[1];
ok(/^MQ-[A-HJ-NP-Z2-9]{10}$/.test(CODE || ''), 'weak code replaced by a strong server code');
r = await req(A, 'POST', '/api/admin/messages', { headers: { cookie }, body: { client: 'c1', text: 'مرحباً من المكتب' } });
ok(r.status === 201, 'lawyer message sent');
const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b40000000049454e44ae426082', 'hex');
r = await req(A, 'POST', '/api/admin/file?client=c1&name=' + encodeURIComponent('صورة.png'), { headers: { cookie, 'content-type': 'image/png' }, body: png, raw: true });
ok(r.status === 201 && /\/api\/media\/[a-f0-9]{12}\.png\?e=\d+&s=/.test(r.json.file), 'file stored in R2 with signed URL');
const fileUrl = r.json.file, bare = fileUrl.split('?')[0];
r = await req(A, 'GET', fileUrl); ok(r.status === 200 && r.body.equals(png), 'signed URL serves exact bytes');
r = await req(A, 'GET', bare); ok(r.status === 403, 'unsigned media URL refused (was public before)');
r = await req(A, 'GET', bare, { headers: { cookie } }); ok(r.status === 200, 'lawyer session can open media');
r = await req(A, 'GET', fileUrl.replace(/s=[^&]+/, 's=' + 'A'.repeat(32))); ok(r.status === 403, 'forged signature refused');
r = await req(A, 'GET', fileUrl, { headers: { range: 'bytes=0-7' } }); ok(r.status === 206 && r.body.length === 8, 'range request (audio seeking) works');

// 4) بوابة الموكل
r = await req(A, 'POST', '/api/portal/login', { body: { code: CODE.toLowerCase() } }); ok(r.status === 200 && r.json.name === 'موكل تجريبي', 'portal login by code');
r = await req(A, 'GET', '/api/portal/home', { headers: { 'x-client': CODE } });
ok(r.status === 200 && r.json.cases.length === 1 && r.json.cases[0].court === 'محكمة صلح نابلس' && r.json.office.name === 'مكتب ألفا', 'portal home with office name + court');
r = await req(A, 'GET', '/api/portal/messages', { headers: { 'x-client': CODE } });
ok(r.status === 200 && r.json.length === 2 && !r.json.some(m => 'by' in m), 'portal messages (staff username hidden)');
const pf = r.json.find(m => m.file); r = await req(A, 'GET', pf.file); ok(r.status === 200, 'client opens signed file');
r = await req(A, 'POST', '/api/portal/messages', { headers: { 'x-client': CODE }, body: { text: 'شكراً' } }); ok(r.status === 201, 'client sends message');

// 5) العزل بين المكاتب
r = await req(B, 'GET', '/api/admin/bootstrap', { headers: { cookie } }); ok(r.status === 401, 'alpha session cookie is useless on beta');
r = await req(B, 'GET', fileUrl); ok(r.status !== 200, 'alpha signed file not readable via beta (' + r.status + ')');
r = await req(B, 'GET', '/api/portal/home', { headers: { 'x-client': CODE } }); ok(r.status === 401, 'alpha client code unknown on beta');

// 6) الحماية من تخمين رمز الموكل على كل العناوين
let last; for (let i = 0; i < 22; i++) last = await req(A, 'GET', '/api/portal/home', { headers: { 'x-client': 'MQ-' + (2000 + i), 'cf-connecting-ip': '9.9.9.9' } });
ok(last.status === 429, 'code guessing on /home is throttled (' + last.status + ')');
r = await req(A, 'GET', '/api/portal/home', { headers: { 'x-client': CODE, 'cf-connecting-ip': '9.9.9.9' } }); ok(r.status === 429, 'blocked IP stays blocked even with valid code');
r = await req(A, 'GET', '/api/portal/home', { headers: { 'x-client': CODE, 'cf-connecting-ip': '8.8.8.8' } }); ok(r.status === 200, 'other IPs unaffected');

// 7) سجل التدقيق
r = await req(A, 'GET', '/api/audit/verify', { headers: { cookie } }); ok(r.json && r.json.ok && r.json.n >= 8, 'audit chain verifies (' + JSON.stringify(r.json) + ')');
r = await req(A, 'GET', '/api/audit?limit=5', { headers: { cookie } }); ok(r.status === 200 && r.json.length === 5, 'audit list');
r = await req(A, 'GET', '/api/settings', { headers: { cookie } }); ok(r.json.officeName === 'مكتب ألفا', 'settings per office');
r = await req(B, 'GET', '/api/auth/status'); ok(r.json.office === 'مكتب بيتا' && r.json.setup === true, 'beta independent and still in setup');

// 8) البث المباشر (SSE) يستقبل رسالة الموكل
const got = await new Promise(res => {
  const s = http.request({ host: '127.0.0.1', port: PORT, path: '/api/stream', headers: { host: A, cookie } }, resp => {
    let buf = ''; resp.on('data', c => { buf += c; if (buf.includes('event: message')) { s.destroy(); res(true) } });
    setTimeout(() => req(A, 'POST', '/api/portal/messages', { headers: { 'x-client': CODE }, body: { text: 'رسالة مباشرة' } }), 300);
  }); s.on('error', () => {}); s.end(); setTimeout(() => res(false), 5000);
});
ok(got, 'live stream delivers client message to lawyer screen');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
