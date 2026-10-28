// مصادر الأحكام الجديدة: التمييز الأردني من منشورات عدالة (يُدمج في JO_CASSATION) والدستورية العليا المصرية (EG_CONSTITUTIONAL)
const test = require('node:test'), assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const M = require('../lib/misbar');
const JO = require('../tools/jo-adaleh-build'), EG = require('../tools/eg-scc-build');

const PRIN = '1. اذا كانت الاجرة السنوية تدفع على ثلاثة اقساط، في حين ادعى المدعى عليه بأنه اتفق مع المدعي على تعديل طريقة دفع الاجرة بحيث اصبحت الاجرة تدفع مشاهرة، وحيث يجوز تعديل أي شرط من شروط العقد باتفاق خطي أو شفوي.\n2. النكول عن حلف اليمين الموجهة حجة على الناكل.';
const joRow = { id: 'ADJ-6', item_id: 6, title: 'قرار محكمة التمييز الاردنية الحقوقية / ايجارات رقم 1993/836 (هيئة ثلاثية) تاريخ 1993/10/6', court: 'محكمة التمييز الاردنية الحقوقية / ايجارات',
  branch: 'الحقوقية', subject: 'ايجارات', case_year: 1993, case_number: 836, panel: 'هيئة ثلاثية', decision_date: '1993-10-06',
  legislation_refs: 'المادة 13 من قانون المالكين والمستاجرين رقم 29 لسنة 1982 المادة 826 من القانون المدني رقم 43 لسنة 1976', principles: '____________ ' + PRIN, principles_count: 2, has_text: 1,
  source_url: 'https://adaleh.info/Sys/diligence-item.aspx?item_no=0&id=6', topics: 'عقد ايجار، اجرة سنوية، توجيه يمين' };
const FULL = '﻿المحكمة العليا\nبأسم الأمة\nبالجلسة العلنية المنعقدة فى يوم السبت 10 من أكتوبر سنة 1970\n' + 'وحيث إن النيابة العامة تنازلت عن طلب الفصل فى تنازع الاختصاص '.repeat(8);
const egRow = { id: 'SCC-4551', rule_id: 4551, rule_number: 6, rule_date: '1970-10-10', case_info: 'الدعوى 6 لسنة 1 - تنازع - المحكمة العليا - مرفوعة علنية تم الحكم', case_number: '6', case_year: '1',
  case_type: 'تنازع', subject: 'طلب فيها رفض الطلب', requests: 'تعيين الجهة المختصة بنظر الدعوى .', rule_warding: 'إثبات تنازل النيابة العامة عن طلب الفصل فى تنازع الاختصاص .',
  law: 'قانون المرافعات في المواد المدنية و التجارية الصادر بقانون رقم 13 لسنة 1968', disagree_reason: '  - إثبات تنازل النيابة العامة .', file_path: 'https://www.sccourt.gov.eg/x.html', full_text: FULL };

test('عدالة: المبادئ والتشريعات تُنقل حرفياً، ورقم القضية بصيغة رقم/سنة، والمراجع بصيغة «المادة رقم»', () => {
  const d = JO.convert(joRow);
  assert.strictEqual(d.src, 'JO_CASSATION'); assert.strictEqual(d.ext_id, 'jtm-6'); assert.strictEqual(d.case_no, '836/1993'); assert.strictEqual(d.date, '1993-10-06'); assert.strictEqual(d.ltype, 'حقوقي');
  assert.ok(d.body.includes(PRIN), 'المبادئ كاملة دون تعديل'); assert.ok(!/^_/m.test(d.body.split('المبادئ:\n')[1]), 'بلا خط الفاصل');
  assert.ok(d.body.includes(joRow.legislation_refs), 'التشريعات كاملة');
  assert.deepStrictEqual(d.cites.map(c => c.title), ['المادة رقم 13 من قانون المالكين والمستاجرين رقم 29 لسنة 1982', 'المادة رقم 826 من القانون المدني رقم 43 لسنة 1976']);
  assert.ok(/رقم 836\/1993/.test(d.title) && /عقد ايجار/.test(d.title));
});

test('الدستورية العليا: النص الكامل حرفياً بعد بطاقة الدعوى، ورقم الدعوى بصيغة «6/1ق»', () => {
  const d = EG.convert(egRow);
  assert.strictEqual(d.src, 'EG_CONSTITUTIONAL'); assert.strictEqual(d.case_no, '6/1ق'); assert.strictEqual(d.court, 'المحكمة العليا (مصر)'); assert.strictEqual(d.year, 1970);
  assert.ok(d.body.endsWith(FULL.replace('﻿', '').trim()), 'نص الحكم كما هو'); assert.ok(d.body.includes('المنطوق: ' + egRow.rule_warding));
  const noFull = EG.convert({ ...egRow, full_text: '' }); assert.ok(noFull.body.includes('الوقائع: طلب فيها رفض الطلب') && !noFull.meta.full_text);
  assert.strictEqual(M.SOURCES.EG_CONSTITUTIONAL.label, 'مصر · الدستورية العليا');
});

test('الإضافة بالدمج (--merge) لا تحذف ولا تكرر، والمصدر الجديد قابل للبحث', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'newsrc-')), f = path.join(dir, 'li.db');
  const d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT,
    ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
    CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); CREATE TABLE body_parts(id INTEGER, n INTEGER, txt TEXT, PRIMARY KEY(id, n));
    CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const old = 'قرار تمييز سابق في الشفعة '.repeat(12);
  d.prepare("INSERT INTO docs(id,src,country,kind,ext_id,title,body,has_text,cites,meta) VALUES(7,'JO_CASSATION','JO','ruling','old-1','شفعة',?,1,'[]','{}')").run(old);
  d.prepare('INSERT INTO fts(rowid,title,body) VALUES(7,?,?)').run(M.norm('شفعة'), M.norm(old)); d.close();
  const W = (n, rows) => { const p = path.join(dir, n); fs.writeFileSync(p, rows.map(x => JSON.stringify(x)).join('\n')); return p };
  const jo = W('jo.jsonl', [JO.convert(joRow), JO.convert({ ...joRow, item_id: 7, case_number: 780 })]), eg = W('eg.jsonl', [EG.convert(egRow)]);
  const run = (jl, src, ...a) => JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'misbar-append.js'), '--db', f, '--jsonl', jl, '--src', src, ...a], { encoding: 'utf8' }).trim().split('\n').pop());
  assert.throws(() => run(jo, 'JO_CASSATION'), /موجود/);
  const r = run(jo, 'JO_CASSATION', '--merge'); assert.strictEqual(r.removed, 0); assert.strictEqual(r.added, 2); assert.deepStrictEqual(r.ids, [8, 9]);
  const r2 = run(jo, 'JO_CASSATION', '--merge'); assert.strictEqual(r2.added, 0); assert.strictEqual(r2.skipped, 2, 'لا تكرار عند الإعادة');
  const r3 = run(eg, 'EG_CONSTITUTIONAL'); assert.strictEqual(r3.added, 1); assert.strictEqual(r3.total, 4);
  const m = M.createMisbar(M.openFile(f));
  assert.strictEqual((await m.search({ q: 'الشفعة', src: 'JO_CASSATION' })).results[0].id, 7, 'القديم بالرقم نفسه');
  const s = await m.search({ q: 'تعديل طريقة دفع الاجرة', src: 'JO_CASSATION' }); assert.strictEqual(s.total, 2);
  const c = await m.search({ q: 'تنازع الاختصاص', src: 'EG_CONSTITUTIONAL' }); assert.strictEqual(c.total, 1); assert.strictEqual(c.results[0].source, 'مصر · الدستورية العليا');
});

test('عدالة: تُزال إشارات جهة النشر من النص والموضوعات والرابط، ولا تُمس كلمة «العدالة» في المبادئ', () => {
  const d = JO.convert({ ...joRow, topics: 'منشورات عدالة ايجارات', principles: '1. تقتضي العدالة تصحيحه. (تمييز حقوق رقم 1046 / 87 / منشورات عدالة ايجارات). 2. (تمييز حقوق رقم 6467/ 2018 / عدالة تجارية).' });
  assert.ok(!/منشورات عدالة|مركز عدالة|adaleh|\/ عدالة/.test(JSON.stringify(d)), JSON.stringify(d).match(/.{20}عدالة.{20}/g));
  assert.ok(d.body.includes('تقتضي العدالة تصحيحه') && d.body.includes('/ 87 / ايجارات)') && d.body.includes('/ 2018 / تجارية)'));
  assert.strictEqual(d.url, ''); assert.ok(d.title.endsWith('— ايجارات'));
});

test('misbar-unbrand: ينظّف الأحكام القديمة في مكانها ويحدّث الفهرس، والأسطر الأخرى كما هي', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unb-')), f = path.join(dir, 'li.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT,
    ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
    CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const body = 'وحيث إن العدالة تقتضي ذلك  ،\nقرار صادر عن محكمة التمييز الاردنية الحقوقية رقم 49/ 2024/هيئة خماسية/منشورات عدالة مدنية\n(تمييز حقوق رقم 1008/ 2022/ منشورات عدالة).';
  d.prepare("INSERT INTO docs(id,src,ext_id,title,body,case_no,subject) VALUES(5,'JO_CASSATION','x','الإقالة',?,'',' ')").run(body);
  d.prepare('INSERT INTO fts(rowid,title,body) VALUES(5,?,?)').run(M.norm('الإقالة   '), M.norm(body)); d.close();
  const r = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'misbar-unbrand.js'), '--db', f, '--sql', path.join(dir, 'u.sql')], { encoding: 'utf8' }).trim().split('\n').pop());
  assert.deepStrictEqual(r.ids, [5]);
  const b = new DatabaseSync(f).prepare('SELECT body FROM docs WHERE id=5').get().body;
  assert.strictEqual(b, 'وحيث إن العدالة تقتضي ذلك  ،\nقرار صادر عن محكمة التمييز الاردنية الحقوقية رقم 49/ 2024/هيئة خماسية/مدنية\n(تمييز حقوق رقم 1008/ 2022).');
  assert.ok(fs.readFileSync(path.join(dir, 'u.sql'), 'utf8').includes('UPDATE docs SET'));
});

test('إعلانات مدوّنات المحاماة: تُحذف بيانات التواصل وقائمة المقالات وعبارات الدعاية، ويبقى القرار والشرح', () => {
  const C = require('../tools/jo-ads-clean');
  const b = ['محكمة التمييز الأردنية الحقوقية رقم 3340/ 2024/هيئة خماسية', '', '1- إذا كان موضوع الدعوى مطالبة بمبالغ مستحقة فإنها لا تتطلب توجيه إنذار عدلي.', '', 'خلاصة: لا يشترط الإنذار العدلي.', '',
    'مكتب العبادي للمحاماة', 'تواصل معنا من خلال رقم هاتف المكتب :', '0798333357 / 0799999604 / 064922183.', 'HTTPS://BIT.LY/3ZMVQXT', 'تواصل معنا بواسطة الواتس آب',
    'الأردن ، عمان ، العبدلي ، شارع الملك حسين، مجمع عقاركو التجاري، الطابق رقم 4، مكتب رقم 4.', 'Section Title', 'قانون العقوبات العسكري أحدث نسخة 2026', 'By mohammad al abbadi', 'أغسطس 15, 2026', 'القوانين', 'Read More'].join('\n');
  assert.strictEqual(C.cleanBody(b), 'محكمة التمييز الأردنية الحقوقية رقم 3340/ 2024/هيئة خماسية\n\n1- إذا كان موضوع الدعوى مطالبة بمبالغ مستحقة فإنها لا تتطلب توجيه إنذار عدلي.\n\nخلاصة: لا يشترط الإنذار العدلي.');
  const side = ['بيانات الشيك الإلزامية | محامي مختص', 'By mohammad al abbadi', 'يناير 9, 2024', 'معلومات قانونية مهمة', 'محامي مختص مطالبات مالية من مكتبنا ، يقدم معلومة...', 'Read More', 'المادة (228): يشتمل الشيك على البيانات الآتية'].join('\n');
  assert.strictEqual(C.cleanBody(side), 'المادة (228): يشتمل الشيك على البيانات الآتية');
  assert.strictEqual(C.cleanTitle('دمج عقوبات | أفضل محامي دمج عقوبات | أحدث قرار بدمج العقوبات'), 'دمج عقوبات | أحدث قرار بدمج العقوبات');
  assert.strictEqual(C.cleanBody('حكمت المحكمة برد الطعن وتضمين الطاعن الرسوم والمصاريف ومبلغ 250 ديناراً أتعاب محاماة.'), 'حكمت المحكمة برد الطعن وتضمين الطاعن الرسوم والمصاريف ومبلغ 250 ديناراً أتعاب محاماة.', 'لا مساس بنص الحكم');
});

test('إعلانات: ذكر «الواتس» في وقائع الحكم لا يُحذف، ويُحذف في بيانات التواصل', () => {
  const C = require('../tools/jo-ads-clean');
  const court = 'تجد محكمتنا أن المشتكى عليه قام بإرسال رسالة عبر تطبيق الواتس آب إلى المشتكية تتضمن عبارات ذم.';
  assert.strictEqual(C.cleanBody(court), court);
  const arb = 'تضمنت المادة (6/أ) من قانون التحكيم نصا خاصا بشأن التبليغ وتم تبليغ قرار التحكيم بواسطة تطبيق واتس أب.';
  assert.strictEqual(C.cleanBody(arb), arb);
  assert.strictEqual(C.cleanBody('نص\nتواصل معنا بواسطة الواتس آب\n– وبواسطة الواتس آب\nوبواسطة الواتس آب'), 'نص');
});

test('بقايا HTML وسطر العنوان البريدي للمكتب تُحذف، ونص فيه وسم مع كلام عربي لا يُحذف', () => {
  const C = require('../tools/jo-ads-clean');
  assert.strictEqual(C.cleanJunk('<div id="\nحكمت المحكمة برد الطعن.'), 'حكمت المحكمة برد الطعن.');
  assert.strictEqual(C.cleanBody('نص القرار\nالأردن، عمان، العبدلي، شارع الملك الحسين.\nمكتب محامي في العبدلي عمان'), 'نص القرار');
  assert.strictEqual(C.cleanBody('أ- لواء قصبة عمان ومركزه منطقة العبدلي'), 'أ- لواء قصبة عمان ومركزه منطقة العبدلي', 'العبدلي في نص تشريعي يبقى');
});

test('عناوين المكتب بصيغ أخرى تُحذف من صفحات المدوّنة', () => {
  const C = require('../tools/jo-ads-clean');
  assert.strictEqual(C.cleanBody('نص القرار\nعمان / الأردن / العبدلي\nمكتب محاماة في الأردن ، عمان العاصمة ، العبدلي'), 'نص القرار');
});

test('إثراء التشريعات الأردنية من LawCodex: الرقم والتاريخ والجريدة والتعديلات، وتصحيح العنوان الناقص فقط، والنص لا يُمس', () => {
  const J = require('../tools/jo-lawcodex-meta');
  const md = `---\ntitle: قانون مرتبات عائلات شهداء الجنود " اثناء الوظيفة "\nidentifier: lob.gov.jo:2:989\nnumber: 016\nyear: 1960\ndate: '1960-01-01'\nin_force_from: '1960-06-01'\ngazette_number: 1487\ngazette_page: 374\nlast_amended: '2025'\namended_by:\n- قانون معدل لقانون العقوبات رقم 9 لسنة 1988\n- قانون معدل  لقانون العقوبات رقم 27 لسنة 2017\nstatus: in_force\nretrieved: '2026-10-13'\n---\n\n# عنوان\n\n##### المادة 1\n\nنص مختلف لا يُستعمل\n`;
  const F = J.fieldsOf(J.frontMatter(md));
  assert.strictEqual(F.id, 'lob.gov.jo:2:989'); assert.strictEqual(F.number, '16'); assert.strictEqual(F.date, '1960-01-01');
  assert.deepStrictEqual(F.meta.amended_by, ['قانون معدل لقانون العقوبات رقم 9 لسنة 1988', 'قانون معدل لقانون العقوبات رقم 27 لسنة 2017']);
  assert.strictEqual(F.meta.gazette_number, '1487'); assert.strictEqual(F.meta.last_amended, '2025');
  assert.strictEqual(J.betterTitle('قانون مرتبات عائلات شهداء الجنود " اثناء الوظيفة', F.title), F.title, 'علامة التنصيص الناقصة تُضاف');
  assert.strictEqual(J.betterTitle('قانون العقوبات', 'قانون أصول المحاكمات'), 'قانون العقوبات', 'عنوان مختلف لا يُستبدل');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-')), f = path.join(dir, 'li.db'); fs.mkdirSync(path.join(dir, 'ar', 'laws'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ar', 'laws', 'x.md'), md);
  const d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT,
    ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
    CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const body = 'المادة 1\nيسمى هذا القانون قانون مرتبات عائلات شهداء الجنود ويعمل به من تاريخ نشره.';
  d.prepare("INSERT INTO docs(id,src,country,kind,ext_id,title,year,number,date,body,has_text,cites,meta,case_no,subject) VALUES(9,'JO_LEGISLATION','JO','law','lob.gov.jo:2:989',?,1960,'','',?,1,'[]','{\"origin\":\"lob.gov.jo\"}','','')").run('قانون مرتبات عائلات شهداء الجنود " اثناء الوظيفة', body);
  d.prepare('INSERT INTO fts(rowid,title,body) VALUES(9,?,?)').run(M.norm('قانون مرتبات عائلات شهداء الجنود " اثناء الوظيفة  '), M.norm(body));
  const st = J.run({ db: d, dir: path.join(dir, 'ar'), norm: M.norm });
  assert.strictEqual(st.matched, 1); assert.strictEqual(st.titles, 1);
  const r = d.prepare('SELECT title, number, date, body, meta FROM docs WHERE id=9').get();
  assert.strictEqual(r.number, '16'); assert.strictEqual(r.date, '1960-01-01'); assert.strictEqual(r.body, body, 'النص كما هو');
  const meta = JSON.parse(r.meta); assert.strictEqual(meta.origin, 'lob.gov.jo'); assert.strictEqual(meta.amended_by.length, 2);
  assert.strictEqual(d.prepare("SELECT count(*) n FROM fts WHERE fts MATCH ?").get(M.norm('اثناء الوظيفه')).n, 1, 'الفهرس محدَّث'); assert.strictEqual(d.prepare("SELECT count(*) n FROM fts WHERE fts MATCH ?").get(M.norm('تاريخ نشره')).n, 1, 'النص في الفهرس مرة واحدة'); d.exec("INSERT INTO fts(fts) VALUES('integrity-check')");
});

test('تشريعات مصر من LawCodex: الجديد فقط بعلامة «كما صدر»، والموجود بالرقم والسنة لا يُكرر، والدستور يُستبدل في مكانه', () => {
  const E = require('../tools/eg-lawcodex-build');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eglc-')), ar = path.join(dir, 'ar');
  for (const p of ['laws/1937', 'laws/1957', 'constitution']) fs.mkdirSync(path.join(ar, p), { recursive: true });
  const law = (t, id, y) => `---\ntitle: "${t}"\nidentifier: "${id}"\ntype: law\npublished: ${y}-07-13\ngazette: "الوقائع المصرية"\nstatus: unknown\n---\n\n# ${t}\n\nباسم الأمة\n\n###### مادة ١\n\nيرخص لوزير الصناعة فى التعاقد ${'مع الشركة العامة للبترول '.repeat(10)}\n`;
  fs.writeFileSync(path.join(ar, 'laws/1937/law-1937-58.md'), law('قانون العقوبات رقم ٥٨ لسنة ١٩٣٧', 'قانون رقم ٥٨ لسنة ١٩٣٧', 1937));
  fs.writeFileSync(path.join(ar, 'laws/1957/law-1957-149.md'), law('قانون رقم ١٤٩ لسنة ١٩٥٧ بالترخيص لوزير الصناعة', 'قانون رقم ١٤٩ لسنة ١٩٥٧', 1957));
  fs.writeFileSync(path.join(ar, 'constitution/constitution-2014.md'), `---\ntitle: "دستور جمهورية مصر العربية"\nidentifier: "Constitution 2014 (amended 2019)"\ntype: constitution\ndate: 2014-01-18\nlast_amended: 2019-04-23\n---\n\n# دستور جمهورية مصر العربية\n\n##### المادة 248\n\nيختص مجلس الشيوخ ${'بدراسة واقتراح ما يراه كفيلاً بتوسيد دعائم الديمقراطية '.repeat(5)}\n`);
  const f = path.join(dir, 'li.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT,
    ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
    CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  const old = 'نص الدستور القديم '.repeat(20);
  d.prepare("INSERT INTO docs(id,src,country,kind,ext_id,title,year,number,body,has_text,cites,meta,case_no,subject) VALUES(3,'EG_LEGISLATION','EG','law','w1','قانون العقوبات رقم 58 لسنة 1937',1937,'','نص',1,'[]','{}','',''),(4,'EG_LEGISLATION','EG','law','w2','دستور جمهورية مصر العربية (2014) - ويكي مصدر',2014,'',?,1,'[]','{}','','')").run(old);
  d.prepare('INSERT INTO fts(rowid,title,body) VALUES(4,?,?)').run(M.norm('دستور جمهورية مصر العربية (2014) - ويكي مصدر  '), M.norm(old)); d.close();
  const out = path.join(dir, 'eg.jsonl');
  const r = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'eg-lawcodex-build.js'), '--db', f, '--dir', ar, '--out', out, '--apply'], { encoding: 'utf8' }).trim().split('\n').pop());
  assert.strictEqual(r.new, 1); assert.strictEqual(r.skippedExisting, 1); assert.strictEqual(r.constitution.id, 4);
  const doc = JSON.parse(fs.readFileSync(out, 'utf8').trim());
  assert.strictEqual(doc.number, '149'); assert.strictEqual(doc.year, 1957); assert.strictEqual(doc.date, '1957-07-13'); assert.ok(/كما صدر/.test(doc.meta.note));
  assert.ok(doc.body.startsWith('باسم الأمة') && doc.body.includes('مادة ١\n\nيرخص') && !/#/.test(doc.body), 'النص حرفياً بلا علامات Markdown');
  const c = new DatabaseSync(f).prepare('SELECT title, status_code, body FROM docs WHERE id=4').get();
  assert.strictEqual(c.title, 'دستور جمهورية مصر العربية'); assert.strictEqual(c.status_code, 'in_force'); assert.ok(c.body.includes('يختص مجلس الشيوخ'));
  const d2 = new DatabaseSync(f); d2.exec("INSERT INTO fts(fts) VALUES('integrity-check')");
  assert.strictEqual(d2.prepare('SELECT count(*) n FROM fts WHERE fts MATCH ?').get('"مجلس" AND "' + M.norm('الشيوخ') + '"').n, 1);
  assert.strictEqual(d2.prepare('SELECT count(*) n FROM fts WHERE fts MATCH ?').get('"القديم"').n, 0, 'النص القديم خرج من الفهرس');
});
