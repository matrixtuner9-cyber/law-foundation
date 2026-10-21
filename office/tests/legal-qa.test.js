'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {review,fingerprint}=require('../legal-qa.js');
const CASE={id:'k1',no:'220/2026',court:'ct1'};
const DOC={id:'d1',k:'k1',kind:'لائحة جوابية',title:'مسودة لائحة جوابية',aiDraft:true,
 text:'لدى محكمة صلح نابلس\nالدعوى 220/2026\nالوقائع\nجرى الاتفاق على مبلغ 15000 شيكل وتم دفع 12000 شيكل.\nنطلب رد الدعوى. [R1] [R9] {تاريخ العقد}\n[مرجع يحتاج تحقق: التقادم]',
 refs:[{id:'R1',title:'قانون العمل',ref:'7/2000'}],unverified:['التحقق من التقادم']};
const run=(d=DOC,more={})=>review({caseFile:CASE,doc:d,documents:[DOC,{id:'d2',k:'k1',title:'عقد',kind:'بينة'}, {id:'x1',k:'k2',title:'مستند جهة أخرى'}],deadlines:[{k:'k1',due:'2026-10-10',title:'إيداع'}, {k:'k2',due:'2026-10-10',title:'سري'}],today:'2026-10-21',...more});
test('Legal QA: detects placeholders, unverified authorities and citation without matching source',()=>{
 const r=run(); const ids=r.issues.map(x=>x.id);
 for(const id of ['blanks','citation-placeholder','unverified','orphan','source-check','amounts','deadlines','evidence','draft'])assert.ok(ids.includes(id),id);
 assert.equal(r.counts.attention,r.issues.filter(x=>x.level==='attention').length);
 assert.ok(!JSON.stringify(r).includes('سري'));
});
test('Legal QA: no fabricated source verification or conclusion of substantive contradiction',()=>{
 const r=run();assert.match(r.issues.find(x=>x.id==='amounts').detail,/قد تكون/);
 assert.ok(!r.issues.some(x=>/موثّق بالكامل|صحيح قانونياً|ناجحة/.test(x.detail)));
 assert.match(r.issues.find(x=>x.id==='source-check').detail,/ليس إثباتاً/);
});
test('Legal QA: draft without extracted content does not pretend to analyze attachments',()=>{
 const r=run({id:'empty',k:'k1',title:'مرفق',text:'',refs:[]});
 assert.ok(r.issues.some(x=>x.id==='text'));assert.equal(r.fingerprint,fingerprint({text:'',refs:[]}));
});
test('Legal QA: completed review keeps change fingerprint and detects content changes',()=>{
 const x=run();assert.equal(x.fingerprint,fingerprint(DOC));
 const next={...DOC,text:DOC.text+' إضافة فقرة جديدة'};
 assert.notEqual(x.fingerprint,fingerprint(next));
});
test('Legal QA: other cases deadline and evidence data do not affect selected file',()=>{
 const r=review({caseFile:{id:'k1',no:'11',court:'c'},doc:{id:'d1',text:'مذكرة'.repeat(20)},
 documents:[{id:'b',k:'k2',title:'سري'}],deadlines:[{k:'k2',due:'2026-01-01',title:'مهلة جهة أخرى'}],today:'2026-10-21'});
 assert.ok(!r.issues.some(x=>x.id==='deadlines'||x.id==='evidence'));
 assert.ok(!JSON.stringify(r).includes('سري'));
});
test('Legal QA: reported findings are review prompts, never an approval action',()=>{
 const r=run();assert.equal(r.version,1);assert.equal(r.docId,'d1');
 assert.ok(!Object.hasOwn(r,'approved'));assert.match(r.scope,/فحص قواعد محلي فقط/);
});
