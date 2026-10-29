// المسبار المحلي: الاستخراج من النص، والبحث والتحليل والتشريح على قاعدة صغيرة مؤقتة، دون أي اتصال
const test = require('node:test'), assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const M = require('../lib/misbar');
const L = require('../lib/misbar-local');

const LAW = ['المادة (1)', 'لغايات تطبيق أحكام هذا القانون يكون للكلمات المعاني المخصصة لها.', 'المادة (42) 12 حكم قضائي', 'ترك العمل مع الاحتفاظ بالحقوق القانونية يجوز للعامل ترك العمل بعد إشعار صاحب العمل مع احتفاظه بحقوقه القانونية بما فيها مكافأة نهاية الخدمة.',
  'المادة (45) حكمان قضائيان', 'مكافأة نهاية الخدمة للعامل الذي أمضى سنة في العمل الحق في مكافأة نهاية خدمة مقدارها أجر شهر عن كل سنة.', 'المادة (46)', 'الغيت هذه المادة بموجب القرار بقانون.', 'المادة (47)', 'الفصل التعسفي إذا فصل العامل تعسفياً يستحق تعويضاً عن الفصل التعسفي بالإضافة إلى مكافأة نهاية الخدمة.'].join('\n');
const RULING = ['الحـــــكـــم', 'الصادر عن محكمة استئناف رام الله المأذونة بإجراء المحاكمة', 'الهيئة الحاكمة : برئاسة القاضي فلان وعضوية القاضيين علان وفلان', 'المســــتأنف', ':', 'شركة المقاولات الأولى / رام الله', 'وكيلها المحامي سامي حور', 'المستأنف عليه', ':', 'العامل محمد / نابلس',
  'الحكم المستأنف', ':', 'الحكم الصادر عن محكمة بداية رام الله في الدعوى رقم 419/2014 بتاريخ 4/1/2018', 'اسباب الاستئناف', '1- الحكم مخالف للقانون.', '2- أخطأت المحكمة في احتساب مكافأة نهاية الخدمة.', 'المحكمـــــــة', 'وبعد التدقيق والمداولة نجد أن المادة (45) من قانون العمل الفلسطيني تقضي بمكافأة نهاية الخدمة أجر شهر عن كل سنة، وأن العامل فصل تعسفياً فيستحق التعويض.', 'لذلـــــــك', 'تقرر المحكمة رد الاستئناف موضوعا وتأييد الحكم المستأنف وتضمين المستأنفة الرسوم والمصاريف ومبلغ 200 دينار أتعاب محاماة.', 'حكماً حضورياً صدر وتلي علناً باسم الشعب العربي الفلسطيني وافهم في 24/10/2018', 'الكاتب'].join('\n');

function mkdb() {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mbloc-')), 'ix.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT, ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
  CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); INSERT INTO meta VALUES('version','t1');
  CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const rows = [
    ['PS_LEGISLATION', 'PS', 'law', 'l7', 'قانون العمل الفلسطيني رقم (7) لسنة 2000م', 2000, '7', '', '', '', 'قانون عادي', '', 'ساري النفاذ في الضفة الغربية وغزة', 'in_force', LAW, '[]'],
    ['PS_LEGISLATION', 'PS', 'law', 'l8', 'قرار بقانون بشأن تعديل قانون العمل الفلسطيني رقم (7) لسنة 2000م', 2012, '8', '', '', '', 'قرار بقانون', '', 'ساري', 'in_force', 'المادة (1)\nيعدل قانون العمل.', '[]'],
    ['PS_JUDGMENT', 'PS', 'ruling', 'r1', 'القضية رقم 102/2018 المنعقدة في محكمة استئناف رام الله بتاريخ 2018-10-24', 2018, '', 'محكمة استئناف رام الله', '102/2018', '2018-10-24', 'حقوق', '', '', '', RULING, JSON.stringify([{ title: 'المادة رقم 45 من قانون العمل الفلسطيني رقم (7) لسنة 2000م', text: 'مكافأة نهاية الخدمة للعامل الذي أمضى سنة.' }])],
    ['PS_JUDGMENT', 'PS', 'ruling', 'r2', 'القضية رقم 5/2020 المنعقدة في محكمة النقض بتاريخ 2020-01-01', 2020, '', 'محكمة النقض', '5/2020', '2020-01-01', 'حقوق', '', '', '', 'الحكم\n' + 'تمهيد '.repeat(20) + '\nنظرت المحكمة في ايجار المأجور والمادة 45 من قانون التجارة ولا علاقة لها بالعمل الفلسطيني ولا بمكافأة.\nلذلك\nتقرر رد الطعن.', '[]'],
    ['JO_CASSATION', 'JO', 'ruling', 'j1', 'مكافأة نهاية الخدمة / فصل تعسفي', 2015, '', 'محكمة التمييز الأردنية', '1/2015', '', 'حقوق', '', '', '', 'يستحق العامل المفصول تعسفياً تعويضاً عن الفصل التعسفي ومكافأة نهاية الخدمة وفق قانون العمل الأردني.', '[]'],
  ];
  const ins = d.prepare('INSERT INTO docs(src,country,kind,ext_id,title,year,number,court,case_no,date,ltype,subject,status,status_code,body,cites,has_text,url,file_url,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  for (const r of rows) { const x = ins.run(...r, 1, '', '', '{}'); d.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(Number(x.lastInsertRowid), M.norm(r[4] + ' ' + r[8]), M.norm(r[14])) }
  d.close();
  return M.createMisbar(M.openFile(f));
}

test('citations: المادة/المواد/للمادة، اسم القانون المختصر، «منه» و«القانون ذاته»، ولا يُعتدّ بـ«م/1» ولا بكلمة تحوي «مادة»', () => {
  const t = 'استناداً للمادة (240) من قانون أصول المحاكمات المدنية والتجارية والمادتين 12 و13 من قانون البينات، والمادة 223/2 من قانون الأصول، والمادة 5 منه، والمواد 1-3 من قانون العمل الفلسطيني والمادة 9 من القانون ذاته. والمبرز م/1. وتم اعتماده. والمادة 10 من أصول المحاكمات الشرعية';
  const c = L.citations(t).map(x => [x.article, x.para, x.law]);
  assert.deepStrictEqual(c, [['240', '', 'usul'], ['12', '', 'bayyinat'], ['13', '', 'bayyinat'], ['223', '2', 'usul'], ['5', '', 'usul'], ['1', '', 'labour'], ['2', '', 'labour'], ['3', '', 'labour'], ['9', '', 'labour'], ['10', '', 'usulshari']]);
  assert.strictEqual(L.matchLaw('اللائحة التنفيذية'), null, 'لا يطابق «التنفيذ» داخل كلمة');
});
test('dates/amounts/caseNos: صيغ التاريخ والأشهر العربية، المبالغ بالفواصل، أرقام الدعاوى', () => {
  const t = 'وقع الحادث في 3/5/2021 وأُقيمت الدعوى رقم 412/2022 في 2022-01-15 وصدر الحكم في 15 آذار 2023 بمبلغ 12,500 دينار و3000 شيكل، وتاريخ خاطئ 31/2/2020.';
  assert.deepStrictEqual(L.dates(t).map(d => d.date), ['2021-05-03', '2022-01-15', '2023-03-15']);
  assert.deepStrictEqual(L.amounts(t).map(a => [a.value, a.currency]), [[12500, 'دينار أردني'], [3000, 'شيكل']]);
  assert.deepStrictEqual(L.caseNos(t).map(c => c.no), ['412/2022']);
});
test('topics: الكلمة العابرة لا تُظهر موضوعاً ثانياً، والكلمات الدالّة تُعرض', () => {
  const tp = L.topics('موكلي عامل في شركة مقاولات فصله صاحب العمل فصلاً تعسفياً دون دفع مكافأة نهاية الخدمة');
  assert.strictEqual(tp[0].id, 'labour'); assert.ok(!tp.some(t => t.id === 'companies'), JSON.stringify(tp.map(t => t.id)));
  assert.ok(tp[0].hits.includes('صاحب العمل'));
});
test('splitArticles: المادة بعنوانها ونصها كاملاً، وعدد الأحكام لا يدخل في النص، والملغاة معلّمة', () => {
  const a = L.splitArticles(LAW);
  assert.deepStrictEqual(a.map(x => x.n), ['1', '42', '45', '46', '47']);
  assert.ok(a[1].text.startsWith('ترك العمل') && !/حكم قضائي/.test(a[1].text));
  assert.strictEqual(a[3].repealed, true);
});

test('analyze: نص المادة المذكورة حرفياً من القانون الأصلي لا من قرار التعديل، وأقرب المواد، وأحكام تحقّق ورود المادة فيها، والمقارن منفصل', async () => {
  const loc = L.createLocal({ misbar: mkdb(), now: () => new Date('2026-10-28T00:00:00Z') });
  const r = await loc.analyze({ text: 'فصل صاحب العمل الموكل العامل بتاريخ 3/2/2024 فصلاً تعسفياً ولم يدفع مكافأة نهاية الخدمة بمبلغ 9,000 شيكل، فهل يستحق التعويض وفق المادة 45 من قانون العمل الفلسطيني؟' });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const b = r.body, c = b.citations[0];
  assert.strictEqual(c.found, true); assert.strictEqual(c.lawTitle, 'قانون العمل الفلسطيني رقم (7) لسنة 2000م');
  assert.strictEqual(c.text, L.splitArticles(LAW)[2].text, 'نص المادة كما هو');
  const law = b.laws.find(l => l.title.startsWith('قانون العمل'));
  assert.ok(law && law.articles.some(a => a.n === '47'), 'المادة 47 (الفصل التعسفي) مقترحة'); assert.ok(!law.articles.some(a => a.n === '46'), 'الملغاة لا تُقترح'); assert.ok(!law.articles.some(a => a.n === '45'), 'المذكورة لا تتكرر');
  assert.strictEqual(b.rulings[0].case_no, '102/2018');
  assert.ok(b.rulings[0].why.some(w => w.startsWith('ورد فيه المادة (45)')), JSON.stringify(b.rulings[0].why));
  assert.ok(!b.rulings.some(x => x.case_no === '5/2020' && x.why.every(w => w.startsWith('ورد فيه'))), 'المادة 45 من قانون آخر لا تُحسب');
  assert.ok(b.rulings.every(x => x.primary), 'الفلسطيني وحده في الأحكام'); assert.ok(b.comparative.length && b.comparative.every(x => !x.primary));
  assert.deepStrictEqual(b.timeline.map(t => [t.date, t.fromToday]), [['2024-02-03', 998]]);
  assert.deepStrictEqual(b.amountTotals, { 'شيكل': 9000 });
  assert.ok(b.offline && /دون إنترنت/.test(b.notice));
  assert.strictEqual((await loc.analyze({ text: 'قصير' })).status, 400);
});

test('dissect: الهيئة والأطراف والوكلاء والحكم المستأنف وأسباب الطعن والتسبيب والمنطوق والنتيجة، حرفياً', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const r = await loc.dissect({ id: 3 });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const b = r.body;
  assert.deepStrictEqual(b.parties.map(p => p.role), ['المستأنف', 'المستأنف عليه']);
  assert.strictEqual(b.parties[0].name, 'شركة المقاولات الأولى / رام الله'); assert.deepStrictEqual(b.counsel, ['سامي حور']);
  assert.match(b.panel, /^برئاسة القاضي فلان/); assert.match(b.appealed, /419\/2014/);
  assert.match(b.grounds, /أخطأت المحكمة في احتساب/); assert.match(b.reasoning, /^المحكم/); assert.match(b.reasoning, /فيستحق التعويض/);
  assert.match(b.operative, /^لذلـ+ك\nتقرر المحكمة رد الاستئناف موضوعا/); assert.ok(!/حكماً حضورياً/.test(b.operative)); assert.match(b.closing, /حكماً حضورياً/);
  assert.ok(b.result.includes('رُدّ الطعن موضوعاً وأُيّد الحكم'));
  assert.strictEqual(b.citations[0].article, '45'); assert.strictEqual(b.citations[0].found, true);
  assert.strictEqual(b.dbCites.length, 1);
  assert.strictEqual((await loc.dissect({ id: 1 })).status, 400, 'تشريع لا حكم');
  assert.strictEqual((await loc.dissect({ id: 999 })).status, 404);
  const t = await loc.dissect({ text: RULING }); assert.strictEqual(t.status, 200); assert.strictEqual(t.body.case_no, '419/2014');
});

test('analyze: المواد التي استندت إليها الأحكام المعروضة تُضاف إلى تشريعها بنصها وعدد الأحكام', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const r = await loc.analyze({ text: 'العامل فُصل فصلاً تعسفياً ويطالب صاحب العمل بمكافأة نهاية الخدمة' });
  const law = r.body.laws.find(l => l.title.startsWith('قانون العمل'));
  const a = law.articles.find(x => x.n === '45');
  assert.ok(a, JSON.stringify(law.articles.map(x => x.n))); assert.match(a.why, /^استند إليها حكم واحد/); assert.strictEqual(a.text, L.splitArticles(LAW)[2].text);
});

test('dissect: ملخص وقائع لا حكم كامل — يُستخرج ما قضت به المحكمة ويُنبَّه أنه ليس حكماً', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const t = 'وقائع القضية: قام خالد بتحرير شيك بتاريخ 1 مارس 2025 وأعاده البنك بتاريخ 10 مارس 2025 لعدم كفاية الرصيد. ' + 'تفصيل '.repeat(20) + '\nوأمام المحكمة ثبت أن الحساب ليس به رصيد، وبناء عليه أصدرت المحكمة حكماً غيابياً بإدانة المتهم والحكم عليه بالحبس لمدة سنة.';
  const r = await loc.dissect({ text: t });
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.judgmentLike, false); assert.strictEqual(r.body.operative, '');
  assert.match(r.body.opGuess, /أصدرت المحكمة حكماً غيابياً/); assert.ok(r.body.result.includes('غيابياً') && r.body.result.includes('الإدانة/عقوبة'));
  assert.deepStrictEqual(r.body.dates.map(d => d.sincePrev), [null, 9]);
});

test('تعليم المسبار: التقييم السالب يخفي النتيجة في الأسئلة المشابهة، والموجب يرفعها ويضيفها، والقاموس يضيف المرادف والمادة المثبّتة', async () => {
  const loc = L.createLocal({ misbar: mkdb() }), me = { id: 'u1', name: 'محامٍ' };
  const q = 'العامل فصل تعسفياً ويطالب صاحب العمل بمكافأة نهاية الخدمة';
  let r = (await loc.analyze({ text: q })).body;
  const law = r.laws.find(l => l.title.startsWith('قانون العمل')); const bad = law.articles.find(a => a.n === '42');
  assert.ok(bad, 'المادة 42 ظاهرة قبل التعليم');
  assert.strictEqual((await loc.handle('feedback', { key: 'A:' + law.lawId + ':42', vote: -1, terms: r.qterms }, me)).status, 200);
  assert.strictEqual((await loc.handle('feedback', { key: 'R:3', vote: 1, terms: r.qterms }, me)).status, 200);
  r = (await loc.analyze({ text: 'فصل العامل تعسفياً من صاحب العمل دون مكافأة' })).body;
  const law2 = r.laws.find(l => l.title.startsWith('قانون العمل'));
  assert.ok(!law2.articles.some(a => a.n === '42'), 'أُخفيت في سؤال مشابه'); assert.ok(r.learned.hidden >= 1);
  assert.strictEqual(r.rulings[0].id, 3); assert.match(r.rulings[0].why[0], /قيّمه المكتب مفيداً/);
  r = (await loc.analyze({ text: 'ما حكم إخلاء المأجور لعدم دفع الأجرة' })).body;
  assert.ok(!r.rulings.some(x => x.id === 3 && x.liked), 'سؤال مختلف لا يتأثر');
  assert.strictEqual((await loc.handle('feedback', { key: 'bad', vote: 1, terms: ['x'] }, me)).status, 400);
  // القاموس
  const d = (await loc.handle('dict-save', { syn: [{ a: 'تسريح', b: 'فصل تعسفي' }, { a: 'x', b: 'x' }], pins: [{ phrase: 'تسريح العامل', lawId: 1, n: '46', title: 'قانون العمل' }, { phrase: 'مكافأة العامل', lawId: 1, n: '47', title: 'قانون العمل', label: 'المادة (47)' }] }, me)).body;
  assert.strictEqual(d.syn.length, 1); assert.strictEqual(d.pins.length, 2);
  r = (await loc.analyze({ text: 'تم تسريح العامل من عمله دون إنذار' })).body;
  assert.deepStrictEqual(r.learned.synonyms, ['فصل تعسفي']); assert.ok(r.topics.some(t => t.id === 'labour'), 'المرادف أظهر الموضوع');
  const p = r.laws.find(l => l.lawId === 1).articles[0]; assert.strictEqual(p.n, '46'); assert.match(p.why, /^مثبّتة في قاموس المكتب/);
});

test('اكتشف ما فاتك: المواد التي استشهدت بها الأحكام ولم تُذكر في المذكرة، والأحكام غير المذكورة بموقفها، ودفوع لم ترد', async () => {
  const loc = L.createLocal({ misbar: mkdb() });
  const memo = 'بصفتي وكيلاً عن المدعي العامل أتقدم بهذه المذكرة: فصل صاحب العمل موكلي فصلاً تعسفياً ولم يدفع مكافأة نهاية الخدمة، واستناداً إلى المادة 42 من قانون العمل الفلسطيني نلتمس الحكم بالمكافأة والتعويض. ' + 'تفصيل '.repeat(10);
  const r = await loc.gaps({ text: memo });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const b = r.body;
  assert.ok(b.missed.some(m => m.n === '45' && m.lawTitle.startsWith('قانون العمل')), 'المادة 45 استشهد بها الحكم ولم تُذكر: ' + JSON.stringify(b.missed.map(m => m.n)));
  assert.ok(!b.missed.some(m => m.n === '42'), 'المذكورة لا تُعدّ فائتة');
  assert.ok(b.missed[0].text.startsWith('مكافأة نهاية الخدمة'), 'نص المادة الفائتة حرفياً');
  assert.strictEqual(b.missed[0].rulings[0].case_no, '102/2018');
  assert.strictEqual(b.role, 'plaintiff');
  const u = b.unseenRulings.find(x => x.case_no === '102/2018'); assert.ok(u); assert.match(u.stance, /قد يعارض/, 'رُدّ الاستئناف فيعارض المدعي');
  assert.deepStrictEqual(b.defenses, [], 'لا قانون أصول في هذه القاعدة فلا دفوع تُقترح');
  assert.strictEqual((await loc.gaps({ text: 'قصير' })).status, 400);
});

test('أداة القياس: Recall@10 وMRR على أسئلة معروفة الإجابة', async () => {
  const { evaluate } = require('../tools/misbar-eval/run');
  const r = await evaluate(mkdb(), [{ id: 'a', q: 'العامل فُصل تعسفياً فما التعويض؟', articles: ['labour:47'] }, { id: 'b', q: 'مكافأة نهاية الخدمة للعامل', articles: ['labour:45'], rulings: ['102/2018'] }, { id: 'c', q: 'عقوبة السرقة', articles: ['penal:399'] }]);
  assert.strictEqual(r.n, 3); assert.strictEqual(r.rows[0].recall, 1); assert.ok(r.rows[0].rr > 0);
  assert.strictEqual(r.rows[1].recall, 1, JSON.stringify(r.rows[1].hits)); assert.deepStrictEqual(r.rows[2].missingLaw, ['penal'], 'القانون غير موجود في القاعدة يُذكر');
  assert.ok(r.recall > 0.6 && r.recall < 0.7);
});

test('النفي لا يقلب المعنى: «القتل غير العمد» يُبحث بألفاظ م343 لا بالقتل العمد', () => {
  const L = require('../lib/misbar-local');
  for (const q of ['القتل غير العمد تشريعات وقرارات', 'قتل خطأ في حادث سير', 'القتل غير المقصود']) {
    const r = L.rewriteNeg(q), kt = L.keyterms(r).terms;
    assert.ok(kt.includes('اهمال') && kt.includes('احتراز'), q + ' → ' + kt);
    assert.ok(!kt.includes('عمد') && !kt.includes('قتل'), q + ' → ' + kt);
    assert.ok(!kt.includes('تشريعات') && !kt.includes('وقرارات'), 'كلمات الطلب ليست كلمات بحث');
    assert.equal(L.topics(r)[0].id, 'penal');
  }
  /* القتل العمد يبقى كما هو */
  assert.ok(L.keyterms(L.rewriteNeg('القتل العمد مع سبق الاصرار')).terms.includes('عمد'));
});
