const test=require('node:test'),assert=require('node:assert');
const C=require('../case-steps.js');
test('قضية جديدة تبدأ بالاستقبال، والخطوات بالتسلسل',()=>{const k={id:'a',no:'قيد التسجيل'};assert.equal(C.current(k,{docs:[]}).n,1);
 k.gather={facts:'x'};assert.equal(C.current(k,{docs:[]}).n,2);k.gate={conflictOk:true};assert.equal(C.current(k,{}).n,3);
 k.study={rec:'court'};assert.equal(C.current(k,{}).n,4);k.gate.feeOk=true;assert.equal(C.current(k,{}).n,5);k.file={no:'1'};assert.equal(C.current(k,{docs:[]}).n,6);
 assert.equal(C.current(k,{docs:[{k:'a',title:'عقد'}]}).n,7)});
test('قضية مسجلة سابقاً: المراحل الأولى مستكملة',()=>{const k={id:'a',no:'5/2026'};assert.equal(C.current(k,{docs:[]}).n,9);k.decisions=[{kind:'merits'}];assert.equal(C.current(k,{}).n,10);k.status='منتهية';assert.equal(C.steps(k,{}).every(x=>x.done),true)});
