const test=require('node:test'),assert=require('node:assert');
const S=require('../stations.js');
const T='2026-10-22';
test('المحطة تُشتق من بيانات القضية',()=>{
 assert.equal(S.stationOf({id:'a',no:'قيد التسجيل'},{}),'intake');
 assert.equal(S.stationOf({id:'a',no:'قيد التسجيل',gate:{conflictOk:true,feeOk:true}},{}),'study');
 assert.equal(S.stationOf({id:'a',no:'12/2026'},{}),'follow');
 assert.equal(S.stationOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01',due:'2026-10-31'}]},{}),'post');
 assert.equal(S.stationOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01'}],track:[{lvl:'بداية',from:'2026-01-01'},{lvl:'استئناف',from:'2026-10-10'}]},{}),'follow');
 assert.equal(S.stationOf({id:'a',status:'منتهية'},{}),'closed')});
test('المرحلة تُشتق من آخر جلسة',()=>{
 const hs=[{k:'a',date:'2026-10-01',purpose:'سماع شهود المدعي'},{k:'a',date:'2026-11-05',purpose:'المرافعة'}];
 assert.match(S.stageOf({id:'a',no:'12/2026'},{hearings:hs,today:T}),/سماع البينات.*5\/11\/2026/);
 assert.match(S.stageOf({id:'a',no:'12/2026'},{hearings:[],today:T}),/بانتظار التبليغ/);
 assert.match(S.stageOf({id:'a',type:'جزائية',complaintNo:'ش/5'},{hearings:[],today:T}),/شكوى مسجلة/);
 assert.match(S.stageOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01',due:'2026-10-31'}]},{today:T}),/آخر موعد للطعن 31\/10\/2026/)});
test('الانتقال يُسجَّل مرة واحدة باسم صاحبه',()=>{const k={id:'a'};assert.ok(S.setStation(k,'study','x','سعد','2026-10-22 09:00'));assert.ok(!S.setStation(k,'study','x','سعد'));assert.equal(k.transitions.length,1);assert.equal(k.transitions[0].by,'سعد');assert.ok(!S.setStation(k,'nope'))});
