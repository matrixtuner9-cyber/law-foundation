'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../reference-check');
const REF={id:'R2',title:'قانون الإجراءات المدنية والتجارية',ref:'2/2001',kind:'legislation',arts:['المادة 3'],url:''};
const law={id:'legal1',title:'قانون الإجراءات المدنية والتجارية',lawNumber:'2',lawYear:'2001',articleNumber:'3',srcUrl:'https://example.org/original',text:'نص تجريبي'};
const doc={id:'d1',refs:[REF]};
test('reference ledger: matches library metadata but never treats a suggestion as verification',()=>{
 const li=R.sources([law],[]),state=R.assess(doc,li);assert.equal(state.total,1);assert.equal(state.reviewed,0);assert.equal(state.entries[0].suggestions.length,1);assert.equal(state.entries[0].status,'unreviewed');
});
test('reference ledger: marked review requires original source link, reviewer note and stable snapshots',()=>{
 const li=R.sources([law],[]),entry={refId:'R2',refSig:R.refSig(REF),docSig:R.docSig(doc),sourceId:'ref:legal1',sourceSig:R.sourceSig(law),sourceUrl:law.srcUrl,evidenceNote:'راجعت المادة الثالثة في المصدر الأصلي بتاريخ اليوم',status:'reviewed'};
 assert.equal(R.assess({...doc,citationReviews:[entry]},li).reviewed,1);
 assert.equal(R.assess({...doc,text:'أضيفت فقرة جديدة',citationReviews:[entry]},li).entries[0].status,'document-changed');
 assert.equal(R.assess({...doc,citationReviews:[{...entry,evidenceNote:''}]},li).reviewed,0);
 assert.equal(R.assess({...doc,citationReviews:[{...entry,sourceUrl:''}]},li).reviewed,1); // link from source
 const changedRef={...REF,arts:['المادة 4']};
 assert.equal(R.assess({...doc,refs:[changedRef],citationReviews:[entry]},li).entries[0].status,'changed');
 const changedLaw={...law,articleNumber:'4'};
 assert.equal(R.assess({...doc,citationReviews:[entry]},R.sources([changedLaw],[])).entries[0].status,'source-changed');
 assert.equal(R.assess({...doc,citationReviews:[entry]},[]).entries[0].status,'source-changed');
});
test('reference ledger: do not accept invalid schemes or source without link',()=>{
 for(const u of ['javascript:alert(1)','file:///x','data:text/html,Hi','ftp://somewhere',''])assert.equal(R.safeUrl(u),'');
 const li=R.sources([{...law,srcUrl:''}],[]);
 const rec={refId:'R2',refSig:R.refSig(REF),docSig:R.docSig(doc),sourceId:'ref:legal1',sourceSig:R.sourceSig({...law,srcUrl:''}),sourceUrl:'',evidenceNote:'ملاحظة تمتد على سطرٍ كامل',status:'reviewed'};
 assert.equal(R.assess({...doc,citationReviews:[rec]},li).reviewed,0);
});
test('reference ledger: metadata across independent sources cannot be conflated',()=>{
 const l=R.sources([{...law,id:'a1'}, {...law,id:'a2',title:'قانون آخر'}],[{id:'x1',no:'102/2026',court:'النقض',srcUrl:'https://example.com/a'}]);
 assert.equal(l.length,3);assert.notEqual(R.sourceSig(l[0].raw),R.sourceSig(l[1].raw));
 assert.equal(R.assess(doc,l).entries[0].suggestions.length,1);
});
