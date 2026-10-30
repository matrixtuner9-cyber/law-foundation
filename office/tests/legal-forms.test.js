'use strict';
/* النماذج القانونية: كل عنصر في نص النموذج له مصدر (حقل أو بيان من القضية)، وكل نموذج يعلن مواده،
   والميعاد يُحسب من حقل تاريخ، والنقص في ملف القضية يُعلَّم ولا يُطبع فراغاً؛ ونقطة «articles» تعيد نص المواد حرفياً. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const ROOT = path.resolve(__dirname, '..');

function load() {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const tplSrc = app.slice(app.indexOf('const TPL={'), app.indexOf('function tplCtx(){'));
  const ctxSrc = app.slice(app.indexOf('function tplCtx(){'), app.indexOf('V.tpls=()=>'));
  const el = () => ({ style: {}, textContent: '', innerHTML: '', appendChild() {} });
  const sb = { console, Date, Number, String, Math, JSON, Promise, setTimeout, confirm: () => true, fetch: async () => ({ ok: false, json: async () => ({}) }),
    document: { createElement: el, head: { appendChild() {} }, addEventListener() {}, getElementById: () => null, querySelector: () => null } };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(`
   const TODAY=new Date(2026,9,30);const iso=dt=>dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
   const dmy=s=>{const x=new Date(s+'T00:00:00');return x.getDate()+'/'+(x.getMonth()+1)+'/'+x.getFullYear()};const esc=s=>String(s);
   const OFFICE={name:'مكتب الاختبار',lawyer:'المحامي س',city:'نابلس'};
   const clients=[{id:'c1',name:'أحمد',idNo:'123',city:'نابلس'}],opponents=[{id:'o1',name:'خالد'}],courts=[{id:'ct1',name:'محكمة صلح نابلس'}];
   const cases=[{id:'k1',no:'1/2026',court:'ct1',client:'c1',opps:['o1'],role:'مدعٍ',subject:'مطالبة',value:1000}];let deadlines=[];
   const C=id=>clients.find(x=>x.id===id),K=id=>cases.find(x=>x.id===id),O=id=>opponents.find(x=>x.id===id),CT=id=>courts.find(x=>x.id===id);
   const oppNames=k=>(k.opps||[]).map(o=>(O(o)||{}).name||'').join(' و');const nextH=()=>null;
   const S={tpl:'t1',tplCase:'k1',tplVals:{}},V={},A={};const toast=()=>{};const render=()=>{};
   ${tplSrc}${ctxSrc}
   function tplText(html){const c=tplCtx();return TPL[S.tpl].body.join('\\n').split(/(\\{\\w+\\})/).map(p=>{const m=p.match(/^\\{(\\w+)\\}$/);if(m){const v=c[m[1]]??p;return v}return p}).join('')}
   window.TPL=TPL;window.S=S;window.A=A;window.V=V;window.tplText=tplText;window.getDl=()=>deadlines;window.tplCtx=tplCtx;`, sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'ready-templates-palestine.js'), 'utf8'), sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'legal-forms.js'), 'utf8'), sb);
  return sb;
}

test('كل عنصر في نص النموذج له مصدر، ولكل نموذج تصنيف وأساس', () => {
  const sb = load(), CTX = ['client', 'clientId', 'clientAddr', 'clientJob', 'opp', 'oppAddr', 'oppJob', 'court', 'no', 'subject', 'amount', 'role', 'lawyer', 'barNo', 'office', 'officeAddr', 'city', 'date', 'hearing', 'expText2', 'expText3', 'clientJob'];
  const ids = Object.keys(sb.TPL);
  assert.ok(ids.length >= 46, 'عدد النماذج ' + ids.length);
  for (const id of ids) {
    const t = sb.TPL[id], keys = new Set(t.fields.map(f => f[0]));
    for (const m of t.body.join('\n').matchAll(/\{(\w+)\}/g)) assert.ok(keys.has(m[1]) || CTX.includes(m[1]), id + ': {' + m[1] + '} بلا مصدر');
    assert.ok(t.category, id + ' بلا تصنيف'); assert.ok(t.basis, id + ' بلا أساس');
    for (const r of t.refs || []) { assert.ok(r.law.length > 5); assert.ok(r.arts.length); r.arts.forEach(a => assert.match(a, /^\d+$/)) }
    if (t.dl) { const f = t.fields.find(x => x[0] === t.dl.from); assert.ok(f && f[3] === 'date', id + ': حقل الميعاد ليس تاريخاً'); assert.ok(t.dl.days > 0) }
  }
});

test('النقص في ملف القضية يُعلَّم باسمه ولا يُطبع فراغاً', () => {
  const sb = load(); sb.S.tpl = 't27'; // طلب تنفيذ: يحتاج عنوان الخصم وعنوان المكتب
  const txt = sb.tplText();
  assert.match(txt, /\[ناقص: عنوان الخصم\]/);
  assert.match(txt, /123/); // رقم هوية الموكل من ملفه
  assert.match(txt, /\[يُستكمل: السند التنفيذي/);
  assert.doesNotMatch(txt, /undefined|……/);
});

test('حقل التاريخ يُعرض بصيغة يوم/شهر/سنة', () => {
  const sb = load(); sb.S.tpl = 't9'; sb.S.tplVals.judgmentDate = '2026-10-01';
  assert.match(sb.tplText(), /أولاً|الطعن|لائحة/); // النص يُبنى
  const c = sb.tplCtx(); assert.equal(c.judgmentDate, '1/10/2026');
});

test('نقطة المواد تعيد نص المادة حرفياً من القانون الأصلي لا تعديله', async () => {
  const M = require('../lib/misbar');
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lf-')), 'ix.db'), d = new DatabaseSync(f);
  d.exec(`CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT, ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT);
   CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT); CREATE VIRTUAL TABLE fts USING fts5(title, body, content='');`);
  const ins = d.prepare("INSERT INTO docs(src,kind,title,status,body) VALUES('PS_LEGISLATION','law',?,?,?)");
  ins.run('قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001م', 'ساري', 'المادة (52)\nتقام الدعوى بلائحة تودع قلم المحكمة متضمنة ما يلي:\n1- اسم المحكمة.\nالمادة (53)\nيرفق المدعي نسخاً.\nالمادة (205)\nيكون ميعاد الطعن بالاستئناف ثلاثين يوماً.');
  ins.run('قرار بقانون بشأن تعديل قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001', 'ساري', 'المادة (1)\nتعديل.');
  d.close();
  const m = M.createMisbar(M.openFile(f));
  const r = await m.handle('articles', { law: 'أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001', n: '52,205,999' });
  assert.equal(r.status, 200);
  assert.match(r.body.title, /^قانون أصول/);
  assert.equal(r.body.arts[0].text, 'تقام الدعوى بلائحة تودع قلم المحكمة متضمنة ما يلي:\n1- اسم المحكمة.');
  assert.match(r.body.arts[1].text, /ثلاثين يوماً/);
  assert.equal(r.body.arts[2].missing, true);
  assert.equal((await m.handle('articles', { law: 'قانون غير موجود إطلاقاً', n: '1' })).status, 404);
});
