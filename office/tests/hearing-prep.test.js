'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {build,TASKS}=require('../hearing-prep');
const k={id:'k1',no:'7/2026',stage:'سماع البينات'};
const data={
 hearings:[{id:'a',k:'k1',date:'2026-10-02',time:'10:00',purpose:'سماع الشهود',result:'إرجاء لاستكمال المستندات'},
   {id:'b',k:'k1',date:'2026-11-04',time:'09:30',purpose:'استكمال البينات',attend:true},
   {id:'c',k:'k2',date:'2026-10-28',purpose:'قضية أخرى'}],
 docs:[{id:'d1',k:'k1',title:'سند',kind:'بينة',evidence360:{position:'support',fact:'تسليم'}},
   {id:'d2',k:'k1',title:'مستند إضافي'},
   {id:'x',k:'k2',title:'مستند سري'}],
 deadlines:[{k:'k1',title:'مهلة سابقة',due:'2026-10-18',kind:'إجرائية'},
   {k:'k1',title:'إحضار بينة',due:'2026-11-01',kind:'داخلية'},
   {k:'k2',title:'مهلة أخرى',due:'2026-11-02'}]
};
test('hearing prep: next hearing and previous recorded decision are scoped to same case',()=>{
 const m=build(k,data,'2026-10-21');
 assert.equal(m.current.id,'b');assert.equal(m.next.id,'b');assert.equal(m.previous.id,'a');
 assert.match(m.previous.result,/إرجاء/);
 assert.equal(m.documents.length,2);assert.equal(m.upcoming.length,1);assert.equal(m.pastDeadlines.length,1);
 assert.equal(m.withEvidence.length,1);assert.equal(m.pendingEvidence.length,1);
 assert.ok(!JSON.stringify(m).includes('مستند سري'));assert.ok(!JSON.stringify(m).includes('قضية أخرى'));
});
test('hearing prep: no next session does not invent a future session',()=>{
 const m=build(k,{hearings:[{id:'past',k:'k1',date:'2026-07-01',purpose:'سماع'}]},'2026-10-21');
 assert.equal(m.next,null);assert.equal(m.current.id,'past');
 assert.ok(m.warnings.some(s=>s.includes('لا توجد جلسة قادمة')));
 assert.ok(m.warnings.some(s=>s.includes('بتاريخ سابق')));
});
test('hearing prep: selecting an existing hearing is deterministic and wrong-case ids ignored',()=>{
 assert.equal(build(k,data,'2026-10-21','a').current.id,'a');
 assert.equal(build(k,data,'2026-10-21','c').current.id,'b');
});
test('hearing prep: contextual changes invalidate prior preparation fingerprint',()=>{
 const m=build(k,data,'2026-10-21'),n=build(k,{...data,docs:data.docs.map(d=>d.id==='d1'?{...d,evidence360:{position:'oppose',fact:'تسليم'}}:d)},'2026-10-21');
 assert.notEqual(m.sourceSig,n.sourceSig);
 const changedTime=build(k,{...data,hearings:data.hearings.map(h=>h.id==='b'?{...h,time:'11:00'}:h)},'2026-10-21');
 assert.notEqual(m.sourceSig,changedTime.sourceSig);
});
test('hearing prep: checklists are suggestions, not court requirements or AI approvals',()=>{
 assert.equal(TASKS.length,7);assert.ok(TASKS.every(t=>t.id&&t.label&&t.hint));
 const m=build(k,data,'2026-10-21');assert.ok(!Object.hasOwn(m,'approved'));assert.ok(!Object.hasOwn(m,'legalDeadlineCalculated'));
});
