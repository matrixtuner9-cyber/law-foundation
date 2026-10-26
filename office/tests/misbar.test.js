// مِسْبار: التطبيع، صيغة البحث، المقتطف، والبحث والفلاتر والتحقق من الاقتباس على قاعدة صغيرة مؤقتة
const test = require('node:test'), assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const M = require('../lib/misbar');

test('norm: تشكيل وهمزات وتاء مربوطة وأرقام هندية وأدوات التعريف الملتصقة', () => {
  assert.strictEqual(M.norm('الشِّيكُ المُرتجَع ٢٠١٩'), 'شيك مرتجع 2019');
  assert.strictEqual(M.norm('بالشيك والكمبيالة'), 'شيك كمبياله');
  assert.strictEqual(M.norm('أحكام إيجار الأماكن'), 'احكام ايجار اماكن');
  assert.strictEqual(M.norm('في'), 'في'); // الكلمات القصيرة لا تُقصّ
});
test('ftsQuery: كلمات ببادئة، عبارة بين تنصيص كما هي، وإهمال كلمات الوقف، وأي بدل كل', () => {
  assert.strictEqual(M.ftsQuery('بالشيك المرتجع في 2019'), '"شيك"* AND "مرتجع"* AND "2019"');
  assert.strictEqual(M.ftsQuery('"عدم كفاية الرصيد" شيك'), '"عدم كفايه رصيد" AND "شيك"*');
  assert.strictEqual(M.ftsQuery('شيك مرتجع', 'any'), '"شيك"* OR "مرتجع"*');
  assert.strictEqual(M.ftsQuery('   '), '');
  assert.ok(!M.ftsQuery('x"y(z) OR NEAR').includes('('), 'لا رموز FTS خام');
});
test('snippet: يقع على الكلمة المطابقة رغم التشكيل وأل التعريف', () => {
  const body = 'س '.repeat(200) + 'وقد أُعيد الشيكُ بدون صرف بسبب عدم كفاية الرصيد عند عرضه ' + 'ص '.repeat(200);
  const s = M.snippet(body, 'بالشيك المرتجع', 80);
  assert.ok(s.includes('الشيكُ بدون صرف'), s);
  assert.ok(s.startsWith('… ') && s.endsWith(' …'));
  assert.strictEqual(M.snippet('', 'x'), '');
});

function mkdb() {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'misbar-')), 'ix.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT, ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
  CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); INSERT INTO meta VALUES('version','t1');
  CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const rows = [
    ['PS_JUDGMENT', 'PS', 'ruling', '1', 'القضية رقم 690/2023 المنعقدة في محكمة النقض بتاريخ 2024-06-24', 2023, '690', 'محكمة النقض', '690/2023', '2024-06-24', 'طعون حقوقية', '', '', '', 'https://maqam.najah.edu/judgments/1/', 'وحيث إن الشيك المرتجع أُعيد بدون صرف لعدم كفاية الرصيد فإن الطعن مقبول شكلاً ومردود موضوعاً.', '[{"title":"المادة 186 من قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001م","url":"u","text":"x"}]'],
    ['PS_LEGISLATION', 'PS', 'law', '7', 'قانون العمل الفلسطيني رقم (7) لسنة 2000م', 2000, '7', '', '', '', 'قانون عادي', 'العمل', 'ساري النفاذ في الضفة الغربية وغزة', 'in_force', 'https://maqam.najah.edu/legislation/1/', 'المادة (45) يستحق العامل مكافأة نهاية خدمة مقدارها أجر شهر عن كل سنة.', '[]'],
    ['PS_LEGISLATION', 'PS', 'law', '8', 'قرار بقانون ملغى بشأن الشيكات', 2010, '8', '', '', '', 'قرار بقانون', '', 'مُلغى', 'repealed', '', '', '[]'],
    ['JO_CASSATION', 'JO', 'ruling', 'a1', 'الشرط الجزائي / ضرر مفترض', 2015, '', 'محكمة التمييز الأردنية', '3092/2015', '', 'حقوق', '', '', '', 'https://jc', 'عدم استحقاق الشرط الجزائي دون إثبات الضرر، والشيك سند تنفيذي.', '[]'],
  ];
  const ins = d.prepare('INSERT INTO docs(src,country,kind,ext_id,title,year,number,court,case_no,date,ltype,subject,status,status_code,url,body,cites,has_text,file_url,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  for (const r of rows) { const x = ins.run(...r, r[15].length > 20 ? 1 : 0, '', '{}'); d.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(Number(x.lastInsertRowid), M.norm(r[4] + ' ' + r[8]), M.norm(r[15])) }
  d.close();
  return M.createMisbar(M.openFile(f));
}

test('search: بالكلمات مع الفلاتر والترتيب الفلسطيني أولاً والفهارس', async () => {
  const m = mkdb();
  let r = await m.search({ q: 'الشيك' });
  assert.strictEqual(r.total, 3); assert.strictEqual(r.results[2].src, 'JO_CASSATION', 'الفلسطيني أولاً'); assert.ok(r.results.find(x => x.src === 'PS_JUDGMENT').excerpt.includes('الشيك'));
  assert.deepStrictEqual(r.facets.src, { PS_JUDGMENT: 1, PS_LEGISLATION: 1, JO_CASSATION: 1 });
  r = await m.search({ q: 'شيك', has_text: '1' }); assert.strictEqual(r.total, 2);
  r = await m.search({ q: 'شيك', country: 'JO' }); assert.strictEqual(r.total, 1); assert.strictEqual(r.results[0].primary, false);
  r = await m.search({ case_no: '690/2023' }); assert.strictEqual(r.total, 1);
  r = await m.search({ case_no: '690' }); assert.strictEqual(r.total, 1);
  r = await m.search({ src: 'PS_LEGISLATION', status: 'in_force' }); assert.strictEqual(r.total, 1); assert.strictEqual(r.results[0].number, '7');
  r = await m.search({ q: '"نهاية خدمة"' }); assert.strictEqual(r.total, 1);
  r = await m.search({ q: 'لا شيء هنا' }); assert.strictEqual(r.total, 0);
  r = await m.search({}); assert.strictEqual(r.total, 0);
  r = await m.search({ q: 'شيك', year_from: 2015, sort: 'year_desc' }); assert.deepStrictEqual(r.results.map(x => x.year), [2023, 2015]);
});
test('doc/stats/verifyQuote/excerpts/adapters', async () => {
  const m = mkdb();
  const d = await m.doc(1); assert.strictEqual(d.cites.length, 1); assert.strictEqual(d.primary, true);
  assert.strictEqual(await m.doc('x'), null); assert.strictEqual(await m.doc(99), null);
  const st = await m.stats(); assert.strictEqual(st.version, 't1'); assert.strictEqual(st.sources.find(s => s.src === 'PS_LEGISLATION').texts, 1);
  assert.strictEqual((await m.verifyQuote(1, 'أُعيد بدون صرف لعدم كفاية الرصيد')).ok, true);
  assert.strictEqual((await m.verifyQuote(1, 'نص غير موجود في الحكم إطلاقاً')).ok, false);
  assert.strictEqual((await m.verifyQuote(3, 'قصير')).ok, false);
  const ex = await m.excerpts('مكافأة نهاية الخدمة'); assert.strictEqual(ex.length, 1); assert.strictEqual(ex[0].ref, 'M2');
  const { lawSearch, rulingSearch } = M.adapters(m);
  const s = await lawSearch('search', { q: 'نهاية الخدمة' }); assert.strictEqual(s.status, 200); assert.strictEqual(s.body.items.length, 1);
  const it = await lawSearch('item', { id: s.body.items[0].id }); assert.ok(it.body.item.content.includes('المادة (45)'));
  const rs = await rulingSearch('الشيك', null, 1); assert.strictEqual(rs.length, 1); assert.strictEqual(rs[0].id, 'M1');
});
test('handle: الأخطاء المفهومة', async () => {
  const m = mkdb();
  assert.strictEqual((await m.handle('doc', { id: 99 })).status, 404);
  assert.strictEqual((await m.handle('nope', {})).status, 404);
  assert.strictEqual((await m.handle('search', { q: 'شيك' })).status, 200);
  const none = M.createMisbar(M.openFile(path.join(os.tmpdir(), 'no-such-dir-x', 'x.db')));
  const r = await none.handle('stats', {}); assert.strictEqual(r.status, 503); assert.strictEqual(r.body.code, 'NO_INDEX');
});
