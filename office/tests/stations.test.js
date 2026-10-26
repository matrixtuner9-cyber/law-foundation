const test=require('node:test'),assert=require('node:assert');
const S=require('../stations.js');
const T='2026-10-22';
test('المرحلة تُشتق من بيانات القضية حسب المخطط',()=>{
 assert.equal(S.stationOf({id:'a',no:'قيد التسجيل'},{}),'study');
 assert.equal(S.stationOf({id:'a',no:'قيد التسجيل',accepted:{at:T}},{}),'pending');
 assert.equal(S.stationOf({id:'a',no:'12/2026'},{}),'active');
 assert.equal(S.stationOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01',due:'2026-10-31'}]},{}),'judgment');
 assert.equal(S.stationOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01'}],track:[{lvl:'بداية',from:'2026-01-01'},{lvl:'استئناف',from:'2026-10-10'}]},{}),'appeal');
 assert.equal(S.stationOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01'},{kind:'merits',date:'2026-12-01'}],track:[{lvl:'بداية',from:'2026-01-01'},{lvl:'استئناف',from:'2026-10-10'}]},{}),'judgment');
 assert.equal(S.stationOf({id:'a',type:'تنفيذ'},{}),'exec');
 assert.equal(S.stationOf({id:'a',status:'منتهية'},{}),'closed')});
test('وصف المرحلة من آخر جلسة',()=>{
 const hs=[{k:'a',date:'2026-10-01',purpose:'سماع شهود المدعي'},{k:'a',date:'2026-11-05',purpose:'المرافعة'}];
 assert.match(S.stageOf({id:'a',no:'12/2026'},{hearings:hs,today:T}),/سماع البينات.*5\/11\/2026/);
 assert.match(S.stageOf({id:'a',no:'12/2026'},{hearings:[],today:T}),/الجلسة الأولى/);
 assert.match(S.stageOf({id:'a',no:'12/2026',decisions:[{kind:'merits',date:'2026-10-01',due:'2026-10-31'}]},{today:T}),/الطعن حتى 31\/10\/2026/)});
test('الانتقال يُسجَّل مرة واحدة',()=>{const k={id:'a'};assert.ok(S.setStation(k,'pending','x','سعد','2026-10-22 09:00'));assert.ok(!S.setStation(k,'pending','x','سعد'));assert.equal(k.transitions.length,1);assert.ok(!S.setStation(k,'nope'))});
