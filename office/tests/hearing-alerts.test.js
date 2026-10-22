const test=require('node:test'),assert=require('node:assert');
const H=require('../lib/hearing-alerts.js');
const st={clients:[{id:'c1'}],cases:[{id:'k1',no:'5/2026',client:'c1',court:'ct1'}],hearings:[{id:'h1',k:'k1',date:'2026-11-05',time:'09:00',attend:true,purpose:'سماع البينات'},{id:'h2',k:'k1',date:'2026-11-05',time:'10:00',attend:false}]};
const at=H.hearingMs(st.hearings[0]);
test('توقيت فلسطين',()=>{assert.equal(new Date(at).toISOString(),'2026-11-05T07:00:00.000Z')});
test('لا تذكير قبل 48 ساعة ولا بعد الموعد',()=>{assert.equal(H.plan(st,{now:at-49*3600e3}).length,0);assert.equal(H.plan(st,{now:at+60e3}).length,0)});
test('تذكير كل 8 ساعات لمطلوب الحضور فقط، دون تكرار',()=>{const keys=new Set();for(let hrs=47.5;hrs>0;hrs-=1){const r=H.plan(st,{now:at-hrs*3600e3,sent:Object.fromEntries([...keys].map(k=>[k,1]))});for(const x of r){assert.equal(x.hearing,'h1');keys.add(x.key)}}assert.equal(keys.size,6)});
test('نص التذكير',()=>{const r=H.plan(st,{now:at-30*3600e3,courts:[{id:'ct1',name:'محكمة بداية نابلس'}]})[0];assert.match(r.text,/5\/2026/);assert.match(r.text,/محكمة بداية نابلس/);assert.match(r.text,/حضوركم شخصياً مطلوب/)});
test('جلسة لها نتيجة أو قضية منتهية لا تذكير',()=>{const s2=JSON.parse(JSON.stringify(st));s2.cases[0].status='منتهية';assert.equal(H.plan(s2,{now:at-10*3600e3}).length,0)});
