const test=require('node:test'),assert=require('node:assert');
const W=require('../workflow.js');
test('المساران يمران بعقد موجودة',()=>{for(const p of Object.values(W.PROFILES)){for(const id of p.MAIN)assert.ok(W.byId[id],p.id+' '+id);for(const ph of p.PH)for(const id of ph.n)assert.ok(W.byId[id],ph.id+' '+id)}});
test('المرحلة الحالية تُشتق من خطوة القضية',()=>{assert.equal(W.currentId({step:0}),1);assert.equal(W.byId[W.currentId({step:4})].s,4);assert.equal(W.byId[W.currentId({step:5})].s,5)});
test('الاختيار اليدوي له أولوية والسابق منجز',()=>{const cur=W.currentId({step:0,flowAt:12});assert.equal(cur,12);assert.equal(W.state(12,cur),'cur');assert.equal(W.state(8,cur),'done');assert.equal(W.state(19,cur),'')});
test('القضية الجزائية تأخذ المسار الجزائي تلقائياً',()=>{const k={type:'جزائية',step:4};assert.equal(W.profileOf(k).id,'criminal');assert.equal(W.currentId(k),38);assert.equal(W.profileOf({type:'حقوقية'}).id,'civil');assert.equal(W.profileOf({type:'حقوقية',flow:'criminal'}).id,'criminal')});
test('مرحلة من المسار الآخر لا تُعتمد',()=>{const k={type:'جزائية',flowAt:12,step:1};assert.equal(W.currentId(k),31)});
test('حالات المراحل في المسار الجزائي',()=>{const p=W.PROFILES.criminal,cur=36;assert.equal(W.phaseState(p.PH[0],cur,p),'done');assert.equal(W.phaseState(p.PH[2],cur,p),'done');assert.equal(W.phaseState(p.PH[3],cur,p),'cur');assert.equal(W.phaseState(p.PH[5],cur,p),'')});
