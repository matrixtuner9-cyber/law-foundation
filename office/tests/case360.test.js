'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {build,STATUSES}=require('../case360.js');
const CASE={id:'k1',no:'1/2026',client:'c1'};
test('360°: فصل سجلات القضايا الأخرى ومراجعة بيانات القضية فقط',()=>{
 const data={
  docs:[{id:'d1',k:'k1',title:'عقد'},{id:'d2',k:'k2',title:'خاص بموكل آخر'},{id:'d3',k:'k1',title:'بيّنة',evidence360:{position:'support',fact:'الواقعة',updatedAt:'2026-10-21'}}],
  hearings:[{k:'k1',date:'2026-10-20',purpose:'جلسة'},{k:'k2',date:'2026-10-22',result:'مؤجلة'}],
  deadlines:[{k:'k1',due:'2026-10-19',title:'مهلة'},{k:'k2',due:'2026-10-23',title:'مهلة أخرى'}]
 };
 const x=build(CASE,data,'2026-10-21');
 assert.equal(x.ds.length,2);assert.equal(x.hs.length,1);assert.equal(x.dl.length,1);
 assert.equal(x.reviewedEvidence.length,1);assert.equal(x.pendingEvidence.length,1);
 assert.equal(x.overdue.length,1);assert.equal(x.missingMinutes.length,1);
 assert.ok(x.checks.some(x=>x.type==='urgent'));assert.ok(!JSON.stringify(x).includes('خاص بموكل آخر'));
});
test('360°: الترتيب الزمني والمهل والنتائج المدونة',()=>{
 const x=build(CASE,{
 docs:[{k:'k1',id:'d1',title:'لائحة',date:'2026-10-12',kind:'لائحة',tplStatus:'draft'}],
 hearings:[{k:'k1',date:'2026-11-08',time:'10:00',purpose:'جلسة مقبلة'},
           {k:'k1',date:'2026-10-04',result:'صدر قرار',purpose:'جلسة سابقة'}],
 deadlines:[{k:'k1',due:'2026-11-06',title:'مهلة تقديم مستند'}]
 },'2026-10-21');
 assert.equal(x.next.date,'2026-11-08');assert.equal(x.missingMinutes.length,0);
 assert.equal(x.drafts.length,1);assert.equal(x.upcoming[0].due,'2026-11-06');
 assert.deepEqual(x.events.map(x=>x.date),['2026-11-08','2026-11-06','2026-10-12','2026-10-04']);
});
test('360°: خطوات المراجعة المهنية محفوظة حسب القضية ولا تختلط بين الملفات',()=>{
 const a=build({id:'k1',caseReview360:{checks:{facts:true,evidence:true,dates:false}}},{docs:[]},'2026-10-21');
 const b=build({id:'k2'}, {docs:[]}, '2026-10-21');
 assert.equal(a.reviewedSteps,2);assert.equal(a.reviewTotal,6);assert.equal(b.reviewedSteps,0);
 assert.equal(a.review.checks.evidence,true);assert.equal(b.review.checks,undefined);
});
test('360°: لا افتراض لقوة البينة أو صحة المستند والبيانات الناقصة تُعامل كغير مراجع',()=>{
 const x=build(CASE,{docs:[
 {k:'k1',id:'a',title:'فاتورة',evidence360:{position:'verify'}},
 {k:'k1',id:'b',title:'مستند غير مُراجع'},
 {k:'k1',id:'c',title:'مستند مدعى مراجعته',evidence360:{position:'bogus'}}
 ]},'2026-10-21');
 assert.equal(x.reviewedEvidence.length,0);assert.equal(x.pendingEvidence.length,3);
 assert.equal(Object.keys(STATUSES).length,4);assert.ok(x.checks.every(y=>!y.text.includes('ناجحة')));
});
