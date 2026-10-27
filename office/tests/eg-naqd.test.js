// أحكام محكمة النقض المصرية: التحويل من جداول الموسوعة القديمة، والإضافة إلى قاعدة مِسْبار دون تغيير أرقام المستندات الحالية
const test = require('node:test'), assert = require('node:assert'), path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const M = require('../lib/misbar');
const { build, appealOf } = require('../tools/eg-naqd-build');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'naqd-'));
const W = (dir, t, rows) => fs.writeFileSync(path.join(dir, t + '.jsonl'), rows.map(r => JSON.stringify({ _t: t, ...r })).join('\n') + '\n');
const FULL = 'جلسة 3 يناير سنة 1990\r\nبرئاسة السيد المستشار / وليم رزق بدوي\r\n( 1 )\r\n   الطعن رقم 1561 لسنة 57 ق\r\nملكية . حيازة .\r\nثمار الشيء المنتفع به . حق للمنتفع بنسبة مدة انتفاعه . م 987 مدني .\r\n" المحكمة "\r\nبعد الإطلاع على الأوراق وسماع التقرير ' + 'وحيث إن '.repeat(60);
function raw() {
  const d = tmp();
  W(d, 'low19', [{ a1: 1990, a2: '1990-01-03', a3: 1, a4: 5, a5: 'حيازة', a6: 'ثمار الشىء المنتفع به . حق للمنتفع بنسبة مدة انتفاعه .م987 مدنى .', a7: 1561, a8: '57', a9: 'الطعن رقم 1561 لسنة 57ق', a10: 'الحادى عشر' },
    { a1: 1990, a2: '1990-01-04', a3: 3, a4: 16, a5: 'استئناف', a6: 'الطلب الأصلى فى الدعوى. جواز تغيير سببه.', a7: 593, a8: '55', a9: 'الطعن رقم 593 لسنة 55ق', a10: 'الحادى عشر' }]);
  W(d, 'low26', [{ a2: 1, a3: '1990-01-03', a4: '??????' + FULL }]);
  W(d, 'low6', [{ a2: 101, a3: '1985-12-17', a4: 'قبول الطلب العارض. شرطه . قيام الخصومة الاصلية .\r\n-لئن كان للمدعى عليه أن يقدم من الطلبات العارضة' }]);
  W(d, 'low23', [{ T0: 1, T1: 'الطعن رقم 2134 لسنة 51ق', T2: '1985-12-17', T3: '101', T4: 'دعوى', t5: 'low6' }]);
  W(d, 'low22', [{ a2: 1, a3: '1995-01-11', a4: 'جلسة 11 يناير سنة 1995\r\n(1)\r\nالطعنان رقما 8100 ، 8241 لسنة 63 ق\r\nمجتمعات عمرانية جديدة.' }]);
  W(d, 'low2', [{ a1: 1, a2: 'اجانب' }]);
  return d;
}

test('appealOf: صيغ رقم الطعن المتنوعة في الموسوعة', () => {
  assert.deepStrictEqual(appealOf('الطعن رقم 30     لسنة 53ق'), { nos: ['30'], jy: '53' });
  assert.deepStrictEqual(appealOf('الطعنان رقما 8100 ، 8241 لسنة 63 ق'), { nos: ['8100', '8241'], jy: '63' });
  assert.deepStrictEqual(appealOf('الطعن رقم 1306 اسنة 50 ق'), { nos: ['1306'], jy: '50' });
  assert.deepStrictEqual(appealOf('الطعن رقن 1165 لسنة 55ق'), { nos: ['1165'], jy: '55' });
  assert.deepStrictEqual(appealOf('الطعن رقم 734 سنة 54 ق'), { nos: ['734'], jy: '54' });
  assert.strictEqual(appealOf('لا رقم هنا'), null);
});

test('build: مستند لكل طعن يجمع المبدأ والنص الكامل حرفياً، والربط بالفهرس حين يغيب الرقم من النص', () => {
  const { docs, stats } = build(raw());
  assert.strictEqual(stats.docs, 4); assert.strictEqual(stats.both, 1); assert.strictEqual(stats.linked_via_index, 1);
  const a = docs.find(d => d.case_no === '1561/57ق');
  assert.ok(a.body.includes('المبادئ القانونية:\nثمار الشىء المنتفع به'), 'المبدأ');
  assert.ok(a.body.includes('نص الحكم:\nجلسة 3 يناير سنة 1990'), 'النص الكامل بلا علامات «?» في أوله');
  assert.ok(a.body.includes('وحيث إن '.repeat(60).trim()), 'النص كاملاً دون اختصار');
  assert.ok(a.body.includes('مجموعة الأحكام: الجزء الحادى عشر — ص 5 — القاعدة 1'));
  assert.strictEqual(a.src, 'EG_CASSATION'); assert.strictEqual(a.year, 1990); assert.strictEqual(a.court, 'محكمة النقض المصرية');
  assert.ok(a.title.startsWith('نقض مدني — الطعن رقم 1561 لسنة 57 ق — جلسة 3/1/1990'));
  const b = docs.find(d => d.case_no === '2134/51ق'); assert.ok(b, 'رقم الطعن من الفهرس'); assert.strictEqual(b.subject, 'دعوى');
  const c = docs.find(d => d.number === '8100'); assert.ok(c.title.includes('الطعنان رقما 8100 و8241'));
  assert.strictEqual(new Set(docs.map(d => d.ext_id)).size, docs.length, 'ext_id فريد');
});

test('misbar-append: يضيف بعد أكبر رقم دون مسّ المستندات الحالية، ويُبحث فيه، ويستبدل عند --replace، ويكتب SQL للسحابة', async () => {
  const dir = tmp(), f = path.join(dir, 'ix.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT,
    ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
    CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); INSERT INTO meta VALUES('version','old');
    CREATE TABLE body_parts(id INTEGER, n INTEGER, txt TEXT, PRIMARY KEY(id, n));
    CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
  d.prepare("INSERT INTO docs(id,src,country,kind,ext_id,title,body,has_text,cites,meta) VALUES(41,'PS_JUDGMENT','PS','ruling','x','حكم فلسطيني في الحيازة',?,1,'[]','{}')").run('نص الحكم الفلسطيني في الحيازة '.repeat(10));
  d.prepare('INSERT INTO fts(rowid,title,body) VALUES(41,?,?)').run(M.norm('حكم فلسطيني في الحيازة'), M.norm('نص الحكم الفلسطيني في الحيازة '.repeat(10))); d.close();
  const jl = path.join(dir, 'eg.jsonl'); fs.writeFileSync(jl, build(raw()).docs.map(x => JSON.stringify(x)).join('\n'));
  const run = (...a) => JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'misbar-append.js'), '--db', f, '--jsonl', jl, '--src', 'EG_CASSATION', ...a], { encoding: 'utf8' }).trim().split('\n').pop());
  const sql = path.join(dir, 'd1.sql'), r = run('--sql', sql);
  assert.deepStrictEqual(r.ids, [42, 45]); assert.strictEqual(r.added, 4); assert.strictEqual(r.total, 5);
  const m = M.createMisbar(M.openFile(f));
  const s = await m.search({ q: 'ثمار المنتفع', src: 'EG_CASSATION' });
  assert.strictEqual(s.total, 1); assert.strictEqual(s.results[0].source, 'مصر · نقض'); assert.strictEqual(s.results[0].primary, false, 'للاستئناس');
  assert.strictEqual((await m.search({ q: 'الحيازة', src: 'PS_JUDGMENT' })).results[0].id, 41, 'المستند الحالي بالرقم نفسه');
  const text = fs.readFileSync(sql, 'utf8');
  assert.ok(/INSERT INTO docs\(id,src[^)]*\) VALUES\(42,'EG_CASSATION'/.test(text) && text.includes("VALUES('version'"), 'SQL بالأرقام نفسها');
  assert.throws(() => run(), /موجود/, 'لا تكرار بلا --replace');
  const r2 = run('--replace'); assert.strictEqual(r2.removed, 4); assert.deepStrictEqual(r2.ids, [42, 45], 'كل مستند يحتفظ برقمه عند الاستبدال');
  const m2 = M.createMisbar(M.openFile(f));
  assert.strictEqual((await m2.search({ q: 'ثمار المنتفع', src: 'EG_CASSATION' })).total, 1, 'لا بقايا في الفهرس بعد الاستبدال');
});
