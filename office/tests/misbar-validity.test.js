// محرك السريان والاختصاص في المسبار المحلي: ملاحظات التعديل والإلغاء في نص المادة، ومكان الواقعة وتاريخها، والمواعيد والاختصاص القيمي
const test = require('node:test'), assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const M = require('../lib/misbar');
const L = require('../lib/misbar-local');

const USUL = ['المادة (1) 6 أحكام قضائية', 'سريان القانون 1- يسري هذا القانون على ما لم يكن قد فصل فيه من الدعاوى أو تم من الإجراءات قبل تاريخ العمل به.',
  'المادة (21) 22 حكم قضائي', 'حساب المواعيد 1- إذا كان الميعاد مقدراً بالأيام فلا يحسب منه يوم التبليغ.',
  'المادة (39) 74 حكم قضائي', '1-عدلت بموجب المادة رقم(1) من القانون رقم(5) لسنة2005 بشأن تعديل قانون اصول المحاكمات المدنية والتجارية رقم(2) لسنة2001 وتعديلاته 2-عدلت بموجب المادة رقم(16) من القرار بقانون رقم(24) لسنة 2024 بشأن تعديل قانون اصول المحاكمات المدنية والتجارية رقم(2) لسنة2001وتعديلاته اختصاص محكمة الصلح تختص محكمة الصلح بالنظر فيما يلي: 1- الدعاوى التي لا تتجاوز قيمتها (10,000) عشرة الاف دينار أردني أو ما يعادلها بالعملة المتداولة قانوناً.',
  'المادة (41)', 'اختصاص محكمة البداية 1- تكون محكمة البداية صاحبة الولاية العامة في نظر جميع الدعاوى والطلبات التي لا تدخل في اختصاص محكمة الصلح.',
  'المادة (205) 82 حكم قضائي', 'ميعاد الطعن بالاستئناف 1- يكون ميعاد الطعن بالاستئناف ثلاثين يوماً ما لم ينص القانون على خلاف ذلك. 2- يكون ميعاد الاستئناف في المواد المستعجلة خمسة عشرة يوماً.',
  'المادة (227) 70 حكم قضائي', 'ميعاد الطعن بالنقض يكون ميعاد الطعن بالنقض أربعين يوماً.',
  'المادة (252)', 'ميعاد الطعن بإعادة المحاكمة يكون ميعاد الطعن بطريقة إعادة المحاكمة خمسين يوماً.',
  'المادة (10) حكم قضائي واحد', 'ألغيت هذه المادة بموجب المادة رقم(6) من القرار بقانون رقم (24) لسنة2024م بشأن تعديل قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة2001وتعديلاته تغيير العنوان بعد بدء الخصومة إذا غير أحد الأطراف عنوانه لتبليغ الأوراق القضائية بعد بدء الخصومة اعتبر التبليغ على العنوان القديم صحيحاً.'].join('\n');

function mkdb() {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mbval-')), 'ix.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT, ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
  CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); INSERT INTO meta VALUES('version','t1');
  CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const rows = [
    ['PS_LEGISLATION', 'PS', 'law', 'u2', 'قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001م', 2001, '2', 'ساري النفاذ في الضفة الغربية وغزة', 'in_force', USUL],
    ['PS_LEGISLATION', 'PS', 'law', 'd24', 'قرار بقانون رقم (24) لسنة 2024م بتعديل قانون أصول المحاكمات المدنية والتجارية رقم (2)لسنة 2001م وتعديلاته', 2024, '24', 'ساري النفاذ في الضفة الغربية وغزة', 'in_force', 'المادة (6)\nتلغى المادة (10) من القانون الأصلي.'],
    ['PS_LEGISLATION', 'PS', 'law', 'r62', 'قانون المالكين والمستأجرين قانون رقم (62) لسنة 1953م', 1953, '62', 'ساري النفاذ في الضفة الغربية', 'partial', 'المادة (4)\nتقييد إخراج المستأجر من العقار لا يجوز إخلاء المستأجر من المأجور إلا لعدم دفع الأجرة.'],
  ];
  const ins = d.prepare('INSERT INTO docs(src,country,kind,ext_id,title,year,number,status,status_code,body,has_text,cites,meta,court,case_no,date,ltype,subject,url,file_url) VALUES(?,?,?,?,?,?,?,?,?,?,1,\'[]\',\'{}\',\'\',\'\',\'\',\'\',\'\',\'\',\'\')');
  for (const r of rows) { const x = ins.run(...r); d.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(Number(x.lastInsertRowid), M.norm(r[4]), M.norm(r[9])) }
  d.close();
  return M.createMisbar(M.openFile(f));
}

test('amendNotes: التعديل والإلغاء والإضافة والفقرة والأمر العسكري', () => {
  const n = L.amendNotes('1-عدلت بموجب المادة رقم(1) من القانون رقم(5) لسنة2005 بشأن تعديل 2-عدلت بموجب المادة رقم(16) من القرار بقانون رقم(24) لسنة 2024 بشأن تعديل');
  assert.deepStrictEqual(n.map(x => [x.type, x.kind, x.no, x.year]), [['amended', 'law', '5', 2005], ['amended', 'decree', '24', 2024]]);
  assert.deepStrictEqual(L.amendNotes('عدلت بموجب المادة رقم(1) من أمر بشأن تعديل قانون العقوبات رقم(16)لسنة 1960 (يهودا والسامرة)(رقم890)لسة1981 اعطاء شيك').map(x => [x.kind, x.no, x.year]), [['order', '890', 1981]]);
  assert.deepStrictEqual(L.amendNotes('عدلت الفقرة رقم(2) بموجب المادة رقم(13)من القرار بقانون رقم (22) لسنة 2026م بشأن').map(x => [x.para, x.byArticle, x.year]), [['2', '13', 2026]]);
  assert.strictEqual(L.amendNotes('ألغيت هذه المادة بموجب المادة رقم(6) من القرار بقانون رقم (24) لسنة2024م')[0].type, 'repealed');
  assert.deepStrictEqual(L.amendNotes('نص عادي بلا تعديل'), []);
});

test('السريان: مادة عُدّلت بعد الواقعة تُنبَّه ويُفتح قرار التعديل، وقبلها معلومة، وقاعدة المادة 1 تظهر', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const r = (await loc.analyze({ text: 'دعوى مطالبة بمبلغ 8,000 دينار رفعت سنة 1998، وقد استند المدعى عليه إلى المادة 39 من قانون الأصول للدفع بعدم الاختصاص', eventDate: '1998-05-01' })).body;
  const c = r.citations.find(x => x.article === '39');
  assert.ok(c && c.found, JSON.stringify(r.citations));
  const fl = c.valid.flags;
  assert.ok(fl.some(f => f.level === 'warn' && /2005/.test(f.text) && /بعد الواقعة \(1998\)/.test(f.text)), JSON.stringify(fl));
  const f24 = fl.find(f => f.note && f.note.year === 2024); assert.ok(f24.note.instId, 'قرار التعديل 24/2024 وُجد في القاعدة'); assert.match(f24.note.instTitle, /رقم \(24\) لسنة 2024/);
  assert.ok(r.timeRule && r.timeRule.label === 'المادة (1)', 'قاعدة سريان قانون الأصول من حيث الزمان');
  assert.strictEqual(r.ctx.eventDate, '1998-05-01'); assert.strictEqual(r.ctx.eventFrom, 'user');
  // الاختصاص القيمي من نص المادة 39
  assert.strictEqual(r.jurisdiction.limit, 10000); assert.strictEqual(r.jurisdiction.claim, 8000); assert.match(r.jurisdiction.verdict, /لا يتجاوز حد محكمة الصلح/);
  const r2 = (await loc.analyze({ text: 'مطالبة بمبلغ 15,000 دينار والدفع بعدم الاختصاص القيمي أمام محكمة الصلح' })).body;
  assert.match(r2.jurisdiction.verdict, /يتجاوز حد محكمة الصلح.*البداية \(المادة 41\)/);
  assert.ok(!r2.ctx.eventDate, 'لا تاريخ في النص');
  const f2 = r2.jurisdiction.valid.flags; assert.ok(f2.every(f => f.level !== 'warn'), 'بلا تاريخ واقعة: معلومات فقط');
});

test('المواعيد: تُحسب فقط إن وُجدت عبارة المدة حرفياً في نص المادة، والمكان: تشريع الضفة فقط في واقعة بغزة', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const r = (await loc.analyze({ text: 'صدر الحكم بتاريخ 2025-03-01 وتبلغناه، فما ميعاد الطعن بالاستئناف والنقض؟', region: 'wb' })).body;
  const d = id => r.deadlines.find(x => x.id === id);
  assert.strictEqual(d('civ-appeal').days, 30); assert.strictEqual(d('civ-cassation').days, 40); assert.strictEqual(d('civ-appeal-urgent').days, 15);
  assert.strictEqual(d('civ-retrial').days, null, 'النص المخزّن لا يقول «ثلاثين يوماً» فلا يُحسب'); assert.strictEqual(d('civ-retrial').verified, false);
  assert.ok(r.countRule && r.countRule.label === 'المادة (21)');
  const g = (await loc.analyze({ text: 'المستأجر لم يدفع الأجرة ونريد إخلاء المأجور', region: 'gaza' })).body;
  const rent = g.laws.find(l => l.title.startsWith('قانون المالكين'));
  assert.ok(rent.valid.flags.some(f => f.level === 'bad' && /الضفة الغربية فقط/.test(f.text)), JSON.stringify(rent.valid));
  const w = (await loc.analyze({ text: 'المستأجر لم يدفع الأجرة ونريد إخلاء المأجور', region: 'wb' })).body;
  assert.ok(!w.laws.find(l => l.title.startsWith('قانون المالكين')).valid.flags.some(f => f.level === 'bad'));
});

test('السريان: مادة أُلغيت بعد الواقعة كانت قائمة وقتها', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const r = (await loc.analyze({ text: 'وفق المادة 10 من قانون أصول المحاكمات المدنية والتجارية فإن التبليغ على العنوان القديم صحيح', eventDate: '2010-01-01' })).body;
  const c = r.citations[0]; assert.strictEqual(c.repealed, true);
  assert.ok(c.valid.flags.some(f => f.level === 'warn' && /أُلغيت/.test(f.text) && /كانت قائمة وقتها/.test(f.text)), JSON.stringify(c.valid.flags));
  const r2 = (await loc.analyze({ text: 'وفق المادة 10 من قانون أصول المحاكمات المدنية والتجارية فإن التبليغ على العنوان القديم صحيح', eventDate: '2025-06-01' })).body;
  assert.ok(r2.citations[0].valid.flags.some(f => f.level === 'bad' && /قبل الواقعة/.test(f.text)));
});
