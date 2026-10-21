'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {sig,isDraft,saveRevision,reviewState,submitReview,MAX_HISTORY}=require('../draft-versions');
const original={id:'d1',k:'k1',title:'لائحة جوابية',aiDraft:true,shared:false,text:'هذه مسودة أولية للائحة جوابية تحتوي فقرة طويلة خاصة بوقائع الدعوى وتحتاج مراجعة.'};
test('revisions: rejects approved or client-visible documents and empty/duplicate writes',()=>{
 assert.equal(isDraft({...original,shared:true}),false);
 assert.equal(saveRevision({...original,shared:true},original.text+' تحديث',{reason:'تحديث فقرة'}).ok,false);
 assert.equal(saveRevision(original,original.text,{reason:'لا يوجد تغيير'}).ok,false);
 assert.equal(saveRevision(original,'نص قصير',{reason:'سبب مهني'}).ok,false);
 assert.equal(saveRevision(original,original.text+' فقرة',{reason:'خ'}).ok,false);
});
test('revisions: preserve full prior text and append version number with author and reason',()=>{
 const r=saveRevision(original,original.text+' تعديل',{reason:'تصحيح بيانات القضية',user:'qa_lawyer',at:'2026-10-21T12:00:00'});
 assert.equal(r.ok,true);assert.equal(r.document.versionCurrent,2);
 assert.equal(r.document.versionHistory.length,1);assert.equal(r.document.versionHistory[0].text,original.text);
 assert.equal(r.document.versionHistory[0].version,1);
 assert.equal(r.document.versionHistory[0].reason,'تصحيح بيانات القضية');
 assert.equal(original.text.includes('تعديل'),false);
});
test('revisions: 20 previous versions is hard ceiling and never silently discards',()=>{
 const d={...original,versionCurrent:21,versionHistory:Array.from({length:MAX_HISTORY},(_,i)=>({version:i+1,text:'مضمون '+i}))};
 const r=saveRevision(d,original.text+' تحديث',{reason:'تحديث ضروري'});
 assert.equal(r.ok,false);assert.equal(d.versionHistory.length,MAX_HISTORY);
});
test('review: explicitly requested by the user, becomes stale when document changes',()=>{
 assert.equal(reviewState(original),'none');
 const r=submitReview(original,{user:'qa_lawyer',at:'2026-10-21T12:00:00',note:'يرجى تدقيق النص'});
 assert.equal(r.ok,true);assert.equal(reviewState(r.document),'requested');
 assert.equal(reviewState({...r.document,text:r.document.text+' تعديل'}),'stale');
 assert.equal(r.document.aiDraft,true);assert.equal(r.document.shared,false);
 assert.equal(sig(original.text),r.document.draftReview360.textSignature);
});
test('review: cannot request for approved/shared document',()=>{
 assert.equal(submitReview({...original,shared:true}).ok,false);
 assert.equal(submitReview({...original,text:''}).ok,false);
});
