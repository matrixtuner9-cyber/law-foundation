// عروض المِسْبار: الاستيراد والبحث والاستبعاد والتسجيل
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), os = require('os'), path = require('path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'offers-'));
const bar = path.join(dir, 'lawyers.json');
fs.writeFileSync(bar, JSON.stringify({ fetchedAt: '2026-10-14', source: 'x', lawyers: [
  { name: 'نبيل اندريا بندلي مشحور', status: 'محامي مزاول', mno: 'L1', info: { 'المدينة': 'القدس', 'اسم المكتب': 'مكتب نبيل', 'عنوان المكتب': 'رام الله' }, phones: ['0599369032'], email: 'a@b.ps' },
  { name: 'خالد علي جبارين', status: 'محامي مزاول', mno: 'L2', info: { 'المدينة': 'جنين' }, phones: ['042501234'], email: '' },
  { name: 'سامي متوفى', status: 'محامي متوفي', mno: 'L3', info: { 'المدينة': 'جنين' }, phones: ['0598000000'] },
  { name: 'ليلى مشطوبة', status: 'محامي مشطوب', mno: 'L4', info: {}, phones: ['0568000000'] },
  { name: 'أحمد المتدرب', status: 'محامي متدرب', mno: 'L5', info: { 'المدينة': 'نابلس' }, phones: ['0522123456'] }] }));
process.env.OFFERS_DATA = path.join(dir, 'data');
process.argv.push('--bar', bar);
const S = require('../server.js');
let base;
test.before(async () => { const port = await S.start(0); base = `http://127.0.0.1:${port}` });
test.after(() => S.server.close());
const j = async (u, body) => { const r = await fetch(base + u, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined); return { status: r.status, body: await r.json() } };

test('واتساب: 059/056 فلسطيني و052 إسرائيلي، والأرضي لا', () => {
  assert.strictEqual(S.waNumber('0599369032'), '970599369032'); assert.strictEqual(S.waNumber('0522123456'), '972522123456'); assert.strictEqual(S.waNumber('042501234'), '');
});
test('الاستيراد والبحث: المتوفى والمشطوب لا يظهران، وفلتر الجوال يعمل', async () => {
  const all = (await j('/api/dir?limit=50')).body; assert.deepStrictEqual(all.rows.map(r => r.mno).sort(), ['L1', 'L2', 'L5']);
  const mob = (await j('/api/dir?mobile=1')).body; assert.deepStrictEqual(mob.rows.map(r => r.mno).sort(), ['L1', 'L5']);
  const q = (await j('/api/dir?q=' + encodeURIComponent('مشحور'))).body; assert.strictEqual(q.rows[0].mno, 'L1'); assert.strictEqual(q.rows[0].mobile, '970599369032');
  const ph = (await j('/api/dir?q=599369')).body; assert.strictEqual(ph.rows[0].mno, 'L1');
});
test('التسجيل يحدّث المرحلة والعدّاد، ولا يُسمح بمراسلة المتوفى ومن طلب الإيقاف', async () => {
  const r = await j('/api/log', { mno: 'L1', channel: 'whatsapp', tpl: 'intro', tone: 's', text: 'نص' }); assert.strictEqual(r.status, 200); assert.strictEqual(r.body.contact.stage, 'sent'); assert.strictEqual(r.body.stats.today, 1);
  assert.strictEqual((await j('/api/log', { mno: 'L3', channel: 'whatsapp', text: 'x' })).status, 409);
  await j('/api/contact', { mno: 'L2', optout: true }); assert.strictEqual((await j('/api/log', { mno: 'L2', channel: 'sms', text: 'x' })).status, 409);
  assert.ok(!(await j('/api/dir?limit=50')).body.rows.some(r => r.mno === 'L2'), 'من طلب الإيقاف خارج القوائم');
  const fresh = (await j('/api/dir?fresh=3650&stage=none')).body; assert.deepStrictEqual(fresh.rows.map(r => r.mno), ['L5'], 'حملة «لم يُراسل أبداً»');
  const lw = (await j('/api/lawyer/L1')).body; assert.strictEqual(lw.log.length, 1);
});
test('القوالب: الباقة موجودة، ويمكن إضافة قالب وحذفه', async () => {
  const t = (await j('/api/templates')).body; assert.ok(t.find(x => x.id === 'intro') && t.find(x => x.id === 'demo'));
  const r = await j('/api/templates', { title: 'قالبي', formal: 'نص {الاسم}', short: 'قصير' }); assert.ok(r.body.id);
  await fetch(base + '/api/templates/' + r.body.id, { method: 'DELETE' }); assert.ok(!(await j('/api/templates')).body.find(x => x.id === r.body.id));
});
test('التصدير CSV بترميز عربي (BOM لـExcel)', async () => { const b = Buffer.from(await (await fetch(base + '/api/export.csv')).arrayBuffer()); assert.deepStrictEqual([...b.subarray(0, 3)], [0xef, 0xbb, 0xbf]); assert.ok(b.toString('utf8').includes('نبيل اندريا')) });

test('صور العرض: رفع وعرض وحذف، والاسم آمن', async () => {
  const png = 'data:image/png;base64,' + Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex').toString('base64');
  const r = await j('/api/media', { name: '../لقطة البحث.png', data: png }); assert.strictEqual(r.status, 200); assert.strictEqual(r.body.name, 'لقطة البحث.png');
  const r2 = await j('/api/media', { name: 'لقطة البحث.png', data: png }); assert.strictEqual(r2.body.name, 'لقطة البحث (2).png', 'لا يُستبدل ملف موجود');
  const got = await fetch(base + '/media/' + encodeURIComponent('لقطة البحث.png')); assert.strictEqual(got.headers.get('content-type'), 'image/png');
  assert.strictEqual((await j('/api/media', { name: 'x.exe', data: 'data:application/x-msdownload;base64,AAAA' })).status, 400);
  const del = await (await fetch(base + '/api/media/' + encodeURIComponent('لقطة البحث.png'), { method: 'DELETE' })).json(); assert.deepStrictEqual(del.map(m => m.name), ['لقطة البحث (2).png']);
  assert.strictEqual((await fetch(base + '/media/' + encodeURIComponent('../offers.db'))).status, 404, 'لا يُقرأ ملف خارج مجلد الصور');
});
