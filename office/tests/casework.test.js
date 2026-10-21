const test=require('node:test'),assert=require('node:assert');
const W=require('../casework.js');
test('قائمة المستندات الافتراضية تتبع نوع القضية',()=>{const a=W.gatherDefaults({type:'جزائية',subject:'شيك دون رصيد'});assert.ok(a.some(x=>/الشيك/.test(x.t)));assert.ok(a.some(x=>/النيابة/.test(x.t)));assert.ok(a.every(x=>x.st==='client'))});
test('التوصيات تشير إلى عقد صحيحة في المخطط',()=>{const F=require('../workflow.js');for(const [k,[t,n]] of Object.entries(W.RECS))if(n!=null)assert.ok(F.byId[n],k)});
