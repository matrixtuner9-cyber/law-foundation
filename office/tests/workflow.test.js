const test=require('node:test'),assert=require('node:assert');
const W=require('../workflow.js');
test('المسار الرئيسي يمر بعقد موجودة',()=>{for(const id of W.MAIN)assert.ok(W.byId[id],'id '+id)});
test('المرحلة الحالية تُشتق من خطوة القضية',()=>{assert.equal(W.currentId({step:0}),1);assert.equal(W.byId[W.currentId({step:4})].s,4);assert.equal(W.byId[W.currentId({step:5})].s,5)});
test('الاختيار اليدوي له أولوية والسابق منجز',()=>{const cur=W.currentId({step:0,flowAt:12});assert.equal(cur,12);assert.equal(W.state(12,cur),'cur');assert.equal(W.state(8,cur),'done');assert.equal(W.state(19,cur),'')});
