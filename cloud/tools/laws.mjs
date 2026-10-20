// اختبارات مكتبة التشريعات على المحاكي المحلي (wrangler dev): الاستيراد، البحث العربي، الفلاتر، الصلاحيات، التصدير والحذف
import http from 'node:http';
const PORT = +process.env.PORT || 8790, OPS = process.env.OPS || 'devtoken123';
let fails = 0, passes = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✘ ') + msg); c ? passes++ : fails++ };
function req(host, method, path, { body, headers = {} } = {}) {
  return new Promise((res, rej) => {
    const data = body == null ? null : Buffer.from(JSON.stringify(body));
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path, headers: { host, ...(data ? { 'content-type': 'application/json', 'content-length': data.length } : {}), ...headers } }, s => {
      const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { const b = Buffer.concat(ch); let j = null; try { j = JSON.parse(b) } catch (e) {} res({ status: s.statusCode, headers: s.headers, json: j }) });
    }); r.on('error', rej); if (data) r.write(data); r.end();
  });
}
const opsH = { authorization: 'Bearer ' + OPS };
const slug = 'l' + Date.now().toString(36).slice(-6), H = slug + '.localhost';
let r = await req('localhost', 'POST', '/_ops/offices', { headers: opsH, body: { slug, name: 'مكتب اختبار التشريعات', lawyer: 'محامٍ', city: 'نابلس' } });
ok(r.status === 201, 'إنشاء مكتب');
const link = (await req('localhost', 'POST', `/_ops/offices/${slug}/setup-link`, { headers: opsH })).json;
r = await req(H, 'POST', '/api/auth/setup', { body: { name: 'المدير', username: 'admin', password: 'Pass1234', setupToken: link.token } });
const A = { cookie: r.headers['set-cookie'][0].split(';')[0] };
r = await req(H, 'POST', '/api/users', { headers: A, body: { name: 'محامٍ', username: 'lawyer1', role: 'lawyer', password: 'Lawyer12345' } }); ok(r.status === 201, 'إنشاء محامٍ ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 120));
r = await req(H, 'POST', '/api/auth/login', { body: { username: 'lawyer1', password: 'Lawyer12345' } }); if (!r.headers['set-cookie']) console.log(r.status, r.json);
const L = { cookie: r.headers['set-cookie'][0].split(';')[0] };

r = await req(H, 'GET', '/api/admin/laws/search', { headers: L });
ok(r.status === 200 && r.json.total === 0, 'المكتبة فارغة في البداية');
/* بيانات اختبار وهمية صراحة */
const ROWS = [
  { 'العنوان': 'قانون تجريبي للإجازات', 'النوع': 'قانون', 'المصدر': 'المجلس التشريعي', 'الملخص': 'ملخص', 'المحتوى': 'المادة 2: يستحق العامل إجازة سنوية.', 'رقم المرجع': '1/2001', 'تاريخ الإصدار': '15/03/2001' },
  { titleAr: 'قرار بقانون تجريبي', type: 'قرار بقانون', source: 'رئيس دولة فلسطين', status: 'معدل', summary: 's', content: 'c', referenceNumber: '2/2018' },
  { titleAr: 'خطأ', type: 'لائحة', source: 'المجلس التشريعي', summary: 's', content: 'c' },
];
r = await req(H, 'POST', '/api/admin/laws/import', { headers: L, body: { records: ROWS } });
ok(r.status === 403, 'المحامي لا يستورد');
r = await req(H, 'POST', '/api/admin/laws/import', { headers: A, body: { records: ROWS } });
ok(r.status === 200 && r.json.added === 2 && r.json.failed === 1 && r.json.errors[0].row === 3, 'المدير يستورد: صالحان ويُرفض الخاطئ برقم صفه');
r = await req(H, 'GET', '/api/admin/laws/search?q=' + encodeURIComponent('اجازه سنويه'), { headers: L });
ok(r.json.total === 1 && /إجازة سنوية/.test(r.json.items[0].hit || '') && r.json.items[0].year === 2001, 'البحث بالتطبيع العربي ومقتطف من النص');
const id = r.json.items[0].id;
r = await req(H, 'GET', '/api/admin/laws/search?type=' + encodeURIComponent('قرار بقانون') + '&sort=year_desc', { headers: L });
ok(r.json.total === 1 && r.json.facets.total === 2, 'فلتر النوع والإحصاءات');
r = await req(H, 'GET', '/api/admin/laws/item?id=' + id, { headers: L });
ok(r.status === 200 && /المادة 2/.test(r.json.rec.content), 'عرض التشريع كاملاً');
r = await req(H, 'GET', '/api/admin/laws/items?ids=' + id, { headers: L });
ok(r.status === 200 && r.json.recs.length === 1 && /المادة 2/.test(r.json.recs[0].content), 'استخراج تشريعات كاملة للصفحة المستقلة');
r = await req(H, 'GET', '/api/admin/laws/export', { headers: L });
ok(r.status === 200 && /attachment/.test(r.headers['content-disposition']) && r.json.count === 2, 'التصدير');
r = await req(H, 'POST', '/api/admin/laws/delete', { headers: A, body: { all: true, confirm: 'حذف الكل' } });
ok(r.status === 200 && r.json.n === 2, 'حذف الكل بتأكيد مكتوب');
r = await req(H, 'GET', '/legislation.js', { headers: A });
ok(r.status === 200 && r.json === null, 'ملف الشاشة يُخدم من السحابة');

console.log(`\n${passes} ✔  ${fails} ✘`); process.exit(fails ? 1 : 0);
