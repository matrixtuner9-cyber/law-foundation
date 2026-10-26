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

test('النصوص الطويلة المقسّمة (صيغة السحابة): البحث يجد المطابقة في جزء لاحق، والمستند يُعاد كاملاً، وبلا تكرار في النتائج', async () => {
  const { execFileSync } = require('node:child_process');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'misbar-src-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true }); fs.mkdirSync(path.join(root, 'legislation', 'data'), { recursive: true });
  const long = 'مقدمة الحكم '.repeat(5000) + ' وحيث إن الكمبيالة المحجوزة سند تنفيذي ' + 'خاتمة '.repeat(4000);
  fs.writeFileSync(path.join(root, 'data', 'judgments.jsonl'), [
    { id: '1', url: 'u1', title: 'القضية رقم 1/2020 المنعقدة في محكمة النقض بتاريخ 2021-01-01', year: '2020', case_number: '1', court: 'محكمة النقض', litigation_type: 'طعون حقوقية', classifications: '[]', full_text: long, cited_legislation: '[]' },
    { id: '2', url: 'u2', title: 'القضية رقم 2/2020 المنعقدة في محكمة النقض بتاريخ 2021-01-02', year: '2020', case_number: '2', court: 'محكمة النقض', litigation_type: 'طعون حقوقية', classifications: '[]', full_text: 'حكم قصير عن الكمبيالة فقط.', cited_legislation: '[]' },
  ].map(x => JSON.stringify(x)).join('\n'));
  fs.writeFileSync(path.join(root, 'legislation', 'data', 'legislation.json'), '[]');
  const db = path.join(root, 'ix.db'), sql = path.join(root, 'ix.sql');
  execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'misbar-build.js'), '--src', root, '--out', db, '--sql', sql], { stdio: 'pipe' });
  /* الصيغة المقسّمة تُبنى من ملف SQL كما تُستورد في D1 */
  const cdb = path.join(root, 'cloud.db'), d = new DatabaseSync(cdb); d.exec(fs.readFileSync(sql, 'utf8')); 
  assert.ok(d.prepare('SELECT COUNT(*) n FROM body_parts').get().n >= 1, 'نص طويل قُسِّم');
  assert.ok(d.prepare('SELECT MAX(LENGTH(body)) n FROM docs').get().n <= M.CHUNK);
  d.close();
  for (const f of [db, cdb]) {
    const m = M.createMisbar(M.openFile(f));
    const r = await m.search({ q: 'الكمبيالة المحجوزة' });
    assert.strictEqual(r.total, 1, f); assert.strictEqual(r.results.length, 1); assert.ok(r.results[0].excerpt.includes('الكمبيالة المحجوزة'), r.results[0].excerpt.slice(0, 80));
    const any = await m.search({ q: 'الكمبيالة', mode: 'any' }); assert.strictEqual(any.total, 2); assert.strictEqual(any.results.length, 2);
    const doc = await m.doc(1); assert.strictEqual(doc.body, long.trim(), 'النص الكامل يُعاد من الأجزاء');
    assert.strictEqual((await m.verifyQuote(1, 'الكمبيالة المحجوزة سند تنفيذي')).ok, true);
  }
});

test('مختبر التحليل: استعلامات من النموذج، مراجع من القاعدة فقط، الموافقة، اختيار المزوّد، وبلا مفتاح', async () => {
  const A = require('../lib/misbar-ai');
  const m = mkdb(), calls = [];
  const fetchImpl = async (url, o) => {
    const b = JSON.parse(o.body); calls.push({ url, b, h: o.headers });
    const isQ = JSON.stringify(b).includes('محرك توليد استعلامات');
    const text = isQ ? '{"queries":["شيك","عدم كفاية الرصيد"]}' : 'الجواب: الشيك المرتجع يجيز المطالبة [M1]، ومبدأ أردني للاستئناس [M4]، ومادة مخترعة [M999] (يحتاج تحقق).';
    if (url.includes('deepseek')) return { ok: true, json: async () => ({ choices: [{ message: { content: text } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }) };
    return { ok: true, json: async () => ({ content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 5 } }) };
  };
  const audits = [];
  const an = A.createAnalyzer({ misbar: m, keys: { deepseek: () => 'sk-test-deepseek-000000', anthropic: () => '' }, audit: x => audits.push(x), fetchImpl });
  assert.strictEqual((await an.analyze({ task: 'search', question: 'شيك', consent: false })).status, 400, 'الموافقة مطلوبة');
  const r = await an.analyze({ task: 'search', question: 'ما حكم الشيك المرتجع؟', consent: true }, { id: 'u1' });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body)); assert.strictEqual(r.body.provider, 'deepseek');
  assert.ok(calls.every(c => c.url.includes('deepseek') && c.h.authorization === 'Bearer sk-test-deepseek-000000'));
  assert.ok(r.body.refs.length >= 2); assert.ok(r.body.refs.every(x => x.ref.startsWith('M')));
  assert.deepStrictEqual(r.body.refs.filter(x => x.cited).map(x => x.id).sort(), [1, 4], 'المرجع المخترع M999 لا يُحسب');
  const last = calls[calls.length - 1].b.messages[1].content; assert.ok(last.includes('[M1]') && last.includes('للمقارنة والاستئناس'));
  assert.strictEqual(audits[0].action, 'misbar.analyze');
  /* Claude عند طلبه صراحة دون مفتاح يرجع إلى DeepSeek */
  assert.strictEqual((await an.analyze({ task: 'search', question: 'الشيك', consent: true, provider: 'claude' }, { id: 'u2' })).body.provider, 'deepseek');
  const none = A.createAnalyzer({ misbar: m, keys: { deepseek: () => '', anthropic: () => '' }, fetchImpl });
  const n = await none.analyze({ task: 'search', question: 'الشيك', consent: true }); assert.strictEqual(n.status, 503); assert.strictEqual(n.body.needKey, true);
  const cl = A.createAnalyzer({ misbar: m, keys: { deepseek: () => '', anthropic: () => 'sk-ant-test' }, fetchImpl });
  const c = await cl.analyze({ task: 'legal_question', question: 'مكافأة نهاية الخدمة للعامل', facts: 'عامل عمل عشر سنوات ثم أنهى صاحب العمل خدمته دون إنذار مسبق', consent: true }, { id: 'u3' });
  assert.strictEqual(c.status, 200); assert.strictEqual(c.body.provider, 'claude'); assert.ok(calls[calls.length - 1].url.includes('anthropic'));
  assert.strictEqual((await an.analyze({ task: 'appeal', consent: true, facts: 'قصير' })).status, 400, 'الطعن يحتاج نص الحكم');
});
