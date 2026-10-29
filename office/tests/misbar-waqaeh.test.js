// الوقائع الفلسطينية: مطابقة بالعنوان أو بالرقم والسنة، الأرقام لا تتغيّر، النص حرفي، وغير المؤكد لا يُدمج؛ وتصفّح العدد
const test = require('node:test'), assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), os = require('node:os'), { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const M = require('../lib/misbar');

function mkdb(dir) {
  const f = path.join(dir, 'ix.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT, ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, body TEXT, cites TEXT, has_text INTEGER, file_url TEXT, meta TEXT);
  CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); INSERT INTO meta VALUES('version','t1');
  CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const ins = d.prepare('INSERT INTO docs(src,country,kind,ext_id,title,year,number,date,ltype,status,status_code,body,cites,has_text,url,file_url,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const rows = [
    ['قانون المرور رقم (5) لسنة 2000م', 2000, '5', 'المادة (1)\n' + 'نص كامل من مصدر آخر '.repeat(20), '{}'],
    ['قرار بقانون رقم (3) لسنة 2020م بشأن تعديل قانون المرور', 2020, '3', '', '{}'],
    ['قانون الكهرباء رقم (13) لسنة 2009م', 2009, '13', 'نص مستخرج من PDF '.repeat(20), '{"text_src":"pdf"}'],
    ['قرار رقم (4) لسنة 1994 بشأن أ', 1994, '4', '', '{}'],
    ['قرار رقم (4) لسنة 1994 بشأن ب', 1994, '4', '', '{}'],
  ];
  for (const [t, y, n, b, m] of rows) { const x = ins.run('PS_LEGISLATION', 'PS', 'law', 'x' + n + y, t, y, n, '', 'قانون', '', '', b, '[]', b.length > 200 ? 1 : 0, '', '', m); d.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(Number(x.lastInsertRowid), M.norm(t), M.norm(b)) }
  d.close(); return f;
}
const file = (root, y, iss, id, title, body, issue = 'العدد مئة وخمسة وستون ( 19-03-2020)') => { const d = path.join(root, String(y), iss); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'id_' + id + '.txt'), `﻿Source: Al-Muqtafi, Institute of Law, Birzeit University\nSource URL: http://muqtafi.birzeit.edu/pg/getleg.asp?id=${id}\nYear: ${y}\nIssue/index: ${issue}\nTitle: ${title}\nFor authoritative legal verification, consult the printed Official Gazette.\n${body}`) };

test('misbar-waqaeh: يملأ ويحسّن ويضيف دون تغيير الأرقام، ولا يدمج غير المؤكد، ويُتصفّح العدد', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'waq-')), db = mkdb(dir), T = path.join(dir, 'texts');
  const B = n => 'مادة (1)\nنص الوقائع رقم ' + n + ' كما هو حرفياً، دون اختصار. '.repeat(8);
  file(T, 2020, 'issue_165', 17272, 'قرار بقانون رقم (3) لسنة 2020م بشأن تعديل قانون المرور رقم (5) لسنة 2000م وتعديلاته', B(1));
  file(T, 2000, 'issue_33', 1, 'قانون المرور رقم (5) لسنة 2000م', B(2), 'العدد ثلاثة وثلاثون ( 30-06-2000)');
  file(T, 2009, 'issue_80', 2, 'قانون الكهرباء رقم (13) لسنة 2009م', B(3), 'العدد ( 01-01-2009)');
  file(T, 1994, 'special_42mm', 3, 'قرار رقم (4) لسنة 1994', B(4), '( 05-05-1994)');
  file(T, 2020, 'issue_165', 17273, 'قرار بقانون رقم (4) لسنة 2020م بشأن مكافآت', B(5));
  const out = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '../tools/misbar-waqaeh.js'), '--db', db, '--dir', T, '--report', path.join(dir, 'r.json')]).toString().trim().split('\n').pop());
  assert.deepStrictEqual([out.filled, out.gazetteOnly, out.replacedPdf, out.unsure, out.added], [1, 1, 1, 1, 1]);
  const m = M.createMisbar(M.openFile(db));
  const d2 = await m.doc(2); assert.match(d2.body, /نص الوقائع رقم 1/); assert.strictEqual(d2.meta.gazette_number, '165'); assert.strictEqual(d2.meta.gazette_date, '2020-03-19'); assert.strictEqual(d2.meta.text_src, 'waqaeh');
  const d1 = await m.doc(1); assert.match(d1.body, /مصدر آخر/, 'النص الكامل من مصدر آخر لا يُمس'); assert.strictEqual(d1.meta.gazette_number, '33');
  const d3 = await m.doc(3); assert.match(d3.body, /نص الوقائع رقم 3/);
  const d6 = await m.doc(6); assert.strictEqual(d6.ext_id, 'mq17273'); assert.strictEqual(d6.number, '4');
  assert.strictEqual((await m.search({ q: 'الوقائع', src: 'PS_LEGISLATION' })).total >= 3, true, 'النصوص الجديدة مفهرسة');
  const g = await m.search({ gazette: '165', src: 'PS_LEGISLATION' }); assert.deepStrictEqual(g.results.map(r => r.id).sort(), [2, 6]);
  const r = JSON.parse(fs.readFileSync(path.join(dir, 'r.json'), 'utf8')); assert.strictEqual(r.unsure[0].candidates.length, 2);
  const again = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '../tools/misbar-waqaeh.js'), '--db', db, '--dir', T]).toString().trim().split('\n').pop());
  assert.strictEqual(again.added, 0, 'التشغيل الثاني لا يكرّر');
});
