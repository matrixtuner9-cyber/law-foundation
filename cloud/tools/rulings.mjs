// اختبارات مكتبة الاجتهادات على المحاكي المحلي (wrangler dev): الحفظ، الحذف الصريح، رفع نص الحكم وفتحه، والصلاحيات
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
const opsH = { authorization: 'Bearer ' + OPS };
const slug = 'r' + Date.now().toString(36).slice(-6), H = slug + '.localhost';
let r = await req('localhost', 'POST', '/_ops/offices', { headers: opsH, body: { slug, name: 'مكتب اختبار الاجتهادات', lawyer: 'محامٍ', city: 'رام الله' } });
ok(r.status === 201, 'إنشاء مكتب');
const link = (await req('localhost', 'POST', `/_ops/offices/${slug}/setup-link`, { headers: opsH })).json;
r = await req(H, 'POST', '/api/auth/setup', { body: { name: 'المدير', username: 'admin', password: 'Pass1234', setupToken: link.token } });
const C = { cookie: r.headers['set-cookie'][0].split(';')[0] };
const boot = async () => (await req(H, 'GET', '/api/admin/bootstrap', { headers: C })).json.state;
const R1 = { id: 'r1', court: 'محكمة النقض', no: 'نقض مدني 512/2023', principle: 'التبليغ المخالف للأصول باطل.', keywords: ['تبليغ'], cases: [] };
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { rulings: [R1, { ...R1, id: 'r2', no: '2' }] } } });
ok(r.status === 200, 'حفظ حكمين');
let st = await boot();
ok(Array.isArray(st.rulings) && st.rulings.length === 2 && st.rulings[0]._v === 1, 'الأحكام تعود في بيانات المكتب برقم إصدار');
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { rulings: [{ ...st.rulings[0], _v: 0, notes: 'قديم' }] } } });
ok(r.json.conflicts && r.json.conflicts.length === 1, 'التعديل على نسخة قديمة يُرفض كتعارض');
await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: {}, deleted: { rulings: ['r2'] } } });
ok((await boot()).rulings.length === 1, 'الحذف الصريح يحذف');
r = await req(H, 'POST', '/api/admin/ruling-file?name=' + encodeURIComponent('حكم.pdf'), { headers: { ...C, 'content-type': 'application/pdf' }, body: Buffer.from('%PDF-1.4 ruling'), raw: true });
ok(r.status === 201 && /^\/api\/media\/[a-f0-9]{12}\.pdf$/.test(r.json.file), 'رفع نص الحكم');
const file = r.json.file;
r = await req(H, 'GET', file, { headers: C });
ok(r.status === 403, 'الملف غير مسموح قبل أن يُربط بحكم محفوظ');
st = await boot();
await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { rulings: [{ ...st.rulings[0], file }] } } });
r = await req(H, 'GET', file, { headers: C });
ok(r.status === 200 && r.body.toString().startsWith('%PDF'), 'موظف المكتب يفتح نص الحكم المحفوظ');
r = await req(H, 'GET', file);
ok(r.status === 403, 'دون جلسة لا يُفتح الملف');
ok(((await req(H, 'GET', '/api/admin/bootstrap', { headers: C })).json.messages || []).length === 0, 'رفع الحكم لا ينشئ رسالة لأي موكل');
r = await req(H, 'POST', '/api/admin/ruling-file?name=x.exe', { headers: { ...C, 'content-type': 'application/octet-stream' }, body: Buffer.from('MZ'), raw: true });
ok(r.status === 415, 'رفض أنواع الملفات غير المسموحة');
// ── اعتماد النماذج القانونية ──
const LF = { id: 'MQ-PS-002', kind: 'B', body: 'نص', version: '1.0', jur: ['WB'], status: 'internal' };
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { lawforms: [LF] } } });
ok(r.status === 403, 'لا اعتماد داخلي دون المعتمِد ورقم المزاولة');
r = await req(H, 'POST', '/api/admin/state', { headers: C, body: { v: 2, changes: { lawforms: [{ ...LF, approvedBy: 'المدير', barNo: '77' }] } } });
ok(r.status === 200 && (await boot()).lawforms[0].status === 'internal', 'المدير يعتمد بالشروط الكاملة');
for (const f of ['rulings.js', 'lawlib.js', 'lawlib-data.js']) { r = await req(H, 'GET', '/' + f, { headers: C }); ok(r.status === 200 && r.body.length > 1000, 'ملف الشاشة ' + f + ' يُخدَم للمكتب') }
console.log(`\n${passes} PASS · ${fails} FAIL`);
process.exit(fails ? 1 : 0);
