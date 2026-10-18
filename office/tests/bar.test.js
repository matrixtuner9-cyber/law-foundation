// دليل المحامين: قارئ Excel، تحميل الملف المضمّن، البحث، والاستيراد من مدير المكتب
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const X = require('../lib/xlsx');

/* ملف xlsx مصغّر (بلا ضغط) لاختبار القارئ دون أي مكتبة */
function makeXlsx(rows, { prefix = '' } = {}) {
  const P = prefix ? prefix + ':' : '', esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const strings = [], idx = v => { let i = strings.indexOf(v); if (i < 0) { strings.push(v); i = strings.length - 1 } return i };
  const col = i => String.fromCharCode(65 + i);
  const sheet = `<?xml version="1.0"?><${P}worksheet xmlns${prefix ? ':' + prefix : ''}="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><${P}sheetData>${rows.map((r, ri) => `<${P}row r="${ri + 1}">${r.map((v, ci) => typeof v === 'number' ? `<${P}c r="${col(ci)}${ri + 1}"><${P}v>${v}</${P}v></${P}c>` : `<${P}c r="${col(ci)}${ri + 1}" t="s"><${P}v>${idx(v)}</${P}v></${P}c>`).join('')}</${P}row>`).join('')}</${P}sheetData></${P}worksheet>`;
  const ss = `<?xml version="1.0"?><${P}sst xmlns${prefix ? ':' + prefix : ''}="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${strings.map(s => `<${P}si><${P}t>${esc(s)}</${P}t></${P}si>`).join('')}</${P}sst>`;
  const files = { 'xl/worksheets/sheet1.xml': sheet, 'xl/sharedStrings.xml': ss };
  const parts = [], central = []; let off = 0;
  for (const [name, txt] of Object.entries(files)) {
    const data = Buffer.from(txt, 'utf8'), nb = Buffer.from(name), crc = zlib.crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nb.length, 26);
    parts.push(lh, nb, data);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, nb); off += 30 + nb.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(2, 8); end.writeUInt16LE(2, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}
const ROWS = [['name', 'phone', 'email', 'segment', 'city', 'consent'], ['سامر عبد الله يوسف', '0599111222', 'Samer@X.ps', 'محامي', 'نابلس', 'none'], ['ريم & طوقان', 598333444, 'reem@x.ps', 'محامٍ متدرب', 'رام الله والبيرة', 'none'], ['', '0599', '', '', '', ''], ['سامر عبد الله يوسف', '0599111222', 'dup@x.ps', 'محامي', 'نابلس', '']];

test('قارئ Excel: نصوص مشتركة وأرقام وبادئات العناصر، والأعمدة بالإنجليزية', () => {
  for (const prefix of ['', 'x']) {
    const rows = X.readSheet(makeXlsx(ROWS, { prefix }));
    assert.deepEqual(rows[0], ['name', 'phone', 'email', 'segment', 'city', 'consent']);
    assert.equal(rows[2][0], 'ريم & طوقان'); assert.equal(rows[2][1], '598333444');
  }
  const L = X.lawyersFromRows(X.readSheet(makeXlsx(ROWS)));
  assert.equal(L.length, 2, 'صف بلا اسم يُتجاهل، والمكرر تماماً يُحذف');
  assert.deepEqual(L.find(l => l.name.startsWith('ريم')).phones, ['0598333444'], 'رقم بلا صفر في أوله يُصحَّح');
  assert.equal(L[0].email, 'samer@x.ps'); assert.deepEqual(L[0].info, { 'المدينة': 'نابلس' }); assert.match(L[0].mno, /^L\d{5}$/);
  assert.ok(!('consent' in L[0]), 'عمود الموافقة لا يُخزَّن');
});
test('قارئ Excel: أعمدة عربية، وأخطاء واضحة', () => {
  const L = X.lawyersFromRows([['الاسم', 'الهاتف', 'المدينة', 'رقم العضوية'], ['خالد', '0599000111, 0568000222', 'جنين', 'A123']]);
  assert.deepEqual(L[0].phones, ['0599000111', '0568000222']); assert.equal(L[0].mno, 'A123');
  assert.throws(() => X.lawyersFromRows([['phone'], ['0599']]), /عمود الاسم/);
  assert.throws(() => X.readSheet(Buffer.from('not a zip')), /Excel/);
});

const ROOT = path.resolve(__dirname, '..');
async function boot(TMP) {
  const PORT = 23000 + Math.floor(Math.random() * 900), B = `http://127.0.0.1:${PORT}`;
  const srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', MQ_EDITION: 'connected' }, stdio: 'ignore' });
  for (let i = 0; i < 80; i++) { try { if ((await fetch(B + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  return { B, stop: async () => { if (srv.exitCode === null) { const g = new Promise(r => srv.once('exit', r)); srv.kill(); await g } } };
}
test('الخادم: يحمّل الملف المضمّن ويبحث فيه، ويستورد ملف المدير ولا يعيد الملف المضمّن فوقه', async t => {
  if (!fs.existsSync(path.join(ROOT, 'bar', 'directory.json'))) return t.skip('ملف المحامين المضمّن غير موجود بعد (بانتظار مراجعة الأرقام)');
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-bar-')), seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'bar', 'directory.json'), 'utf8'));
  let S = await boot(TMP);
  try {
    const s = await fetch(S.B + '/api/auth/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', name: 'مدير', password: 'Test12345' }) });
    const cookie = (s.headers.get('set-cookie') || '').split(';')[0], g = async q => (await fetch(S.B + '/api/bar?' + q, { headers: { cookie } })).json();
    let d = await g('q=');
    assert.equal(d.total, seed.lawyers.length); assert.equal(d.meta.kind, 'bundled'); assert.equal(d.canImport, true);
    const one = seed.lawyers[123], first = one.name.split(' ')[0], last = one.name.split(' ').slice(-1)[0];
    assert.ok((await g('q=' + encodeURIComponent(first + ' ' + last))).rows.some(r => r.name === one.name), 'البحث بالاسم الأول والأخير');
    assert.ok((await g('q=' + one.phones[0].slice(-7))).rows.some(r => r.name === one.name), 'البحث بجزء من الهاتف');
    assert.ok((await g('q=' + encodeURIComponent(one.email.split('@')[0]))).rows.some(r => r.name === one.name), 'البحث بالبريد');
    const city = one.info['المدينة']; d = await g('city=' + encodeURIComponent(city)); assert.equal(d.total, seed.lawyers.filter(l => l.info['المدينة'] === city).length);
    assert.ok(d.facets.statuses.some(x => /متدرب/.test(x.s)));
    /* استيراد ملف المدير */
    const many = [ROWS[0], ...Array.from({ length: 12 }, (_, i) => ['محامٍ تجريبي ' + i, '05990000' + String(i).padStart(2, '0'), '', 'محامي', 'جنين', 'none'])];
    const up = await fetch(S.B + '/api/bar/import?name=test.xlsx', { method: 'POST', headers: { cookie, 'content-type': 'application/octet-stream' }, body: makeXlsx(many) });
    const uj = await up.json(); assert.equal(up.status, 200, JSON.stringify(uj)); assert.equal(uj.n, 12);
    assert.equal((await fetch(S.B + '/api/bar/import', { method: 'POST', headers: { cookie }, body: 'xx' })).status, 400);
    await S.stop(); S = await boot(TMP);
    const c2 = (await (await fetch(S.B + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'Test12345' }) })).headers.get('set-cookie') || '').split(';')[0];
    const d2 = await (await fetch(S.B + '/api/bar?q=', { headers: { cookie: c2 } })).json();
    assert.equal(d2.total, 12, 'الملف المضمّن لا يحل محل ملف استورده المكتب'); assert.equal(d2.meta.kind, 'upload');
  } finally { await S.stop(); try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {} }
});
