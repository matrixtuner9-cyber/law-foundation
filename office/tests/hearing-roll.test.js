'use strict';
/* رول الجلسات: جلسات اليوم المختار فقط، مجمّعة حسب المحكمة ومرتبة بالساعة، مع ما جرى في الجلسة السابقة */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
test('الرول يجمع جلسات اليوم حسب المحكمة ويرتبها بالساعة', () => {
  const sb = { console, Date, String, Number, Math, JSON, Array, Map, Set, document: { createElement: () => ({ style: {} }), head: { appendChild() {} }, addEventListener() {} } };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(`var V={agenda:()=>'AG'},A={},S={rollDay:'2026-11-03'},OFFICE={name:'م'};
   var cases=[{id:'k1',no:'1/2026',court:'c1',client:'p1',role:'مدعٍ'},{id:'k2',no:'2/2026',court:'c2',client:'p1'},{id:'k3',no:'3/2026',court:'c1',client:'p1'}];
   var hearings=[{id:'a',k:'k1',date:'2026-11-03',time:'11:00',purpose:'مرافعة'},{id:'b',k:'k3',date:'2026-11-03',time:'09:00',purpose:'بينات'},{id:'c',k:'k2',date:'2026-11-03',time:'10:00'},{id:'d',k:'k1',date:'2026-10-01',result:'تأجيل لإحضار الشهود'},{id:'e',k:'k2',date:'2026-11-04',purpose:'غير هذا اليوم'}];
   var K=id=>cases.find(x=>x.id===id),C=()=>({name:'موكل'}),CT=id=>({name:id==='c1'?'بداية نابلس':'صلح رام الله'}),oppNames=()=>'خصم',render=()=>{};`, sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'hearing-roll.js'), 'utf8'), sb);
  const html = vm.runInContext('V.roll()', sb);
  assert.equal((html.match(/<section class="rl-ct">/g) || []).length, 2);
  assert.ok(html.indexOf('بداية نابلس') < html.indexOf('صلح رام الله'));
  assert.ok(html.indexOf('3/2026') < html.indexOf('1/2026'), 'الساعة 09:00 قبل 11:00 في المحكمة نفسها');
  assert.match(html, /تأجيل لإحضار الشهود/);
  assert.doesNotMatch(html, /غير هذا اليوم/);
  assert.match(vm.runInContext('V.agenda()', sb), /رول الجلسات اليومي/);
});
