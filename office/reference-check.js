/* المِسْبار — سجل مراجعة مراجع المسودة: لا يمنح توثيقاً رسمياً.
   يعمل بلا اتصال خارجي ويستخرج الترشيحات من بيانات المكتب المسموح عرضها. */
(function(root){
'use strict';
const txt=x=>String(x??'').trim();
const safeUrl=s=>{try{const x=new URL(txt(s));return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}};
const canon=s=>txt(s).replace(/[\u064B-\u065F]/g,'').replace(/[أإآ]/g,'ا').replace(/[ى]/g,'ي').replace(/\s+/g,' ').toLowerCase();
const hash=value=>{const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return s.length+'-'+h.toString(16)};
const refSig=r=>hash([r?.id||'',r?.title||'',r?.ref||'',r?.url||'',r?.kind||'',r?.arts||[]]);
const docSig=d=>hash([String(d?.text||''),String(d?.kind||'')]);
const sourceSig=s=>hash([s?.id||'',s?.title||'',s?.lawName||'',s?.articleNumber||'',s?.lawNumber||'',s?.lawYear||'',s?.judgmentNumber||'',s?.judgmentYear||'',s?.no||'',s?.court||'',s?.date||'',s?.srcUrl||'',s?.text||'',s?.fullText||'']);
const sources=(legalRefs=[],rulings=[])=>[
 ...legalRefs.map(s=>({id:'ref:'+s.id,name:s.title||s.lawName||'مرجع قانوني',type:'ref',url:safeUrl(s.srcUrl||s.sourceUrl),raw:s})),
 ...rulings.map(s=>({id:'ruling:'+s.id,name:s.title||s.principle||s.court+' '+(s.no||''),type:'ruling',url:safeUrl(s.srcUrl||s.sourceUrl),raw:s}))
];
function suggest(ref,lib){
 const title=canon(ref.title),num=canon(ref.ref),url=safeUrl(ref.url);
 return lib.filter(s=>url&&s.url===url||(title.length>5&&canon(s.name)===title)||(num.length>4&&(canon(s.raw.no)===num||canon(s.raw.judgmentNumber)===num))).slice(0,12);
}
function assess(doc,lib){
 const refs=Array.isArray(doc?.refs)?doc.refs:[];
 const reviews=Array.isArray(doc?.citationReviews)?doc.citationReviews:[];
 const entries=refs.map(ref=>{
  const r=reviews.find(x=>x.refId===ref.id),source=r&&lib.find(s=>s.id===r.sourceId);
  const docUnchanged=!!r&&r.docSig===docSig(doc);
  const unchanged=!!r&&r.refSig===refSig(ref);
  const sourceUnchanged=!!r&&(r.sourceId?!!source&&r.sourceSig===sourceSig(source.raw):!!safeUrl(r.sourceUrl));
  const manuallyReviewed=!!r&&r.status==='reviewed'&&docUnchanged&&unchanged&&sourceUnchanged&&!!txt(r.evidenceNote)&&!!(source?.url||safeUrl(r.sourceUrl));
  const status=manuallyReviewed?'reviewed':r&&!docUnchanged?'document-changed':r&&!unchanged?'changed':r&&r.sourceId&&!sourceUnchanged?'source-changed':r?'pending':'unreviewed';
  return {ref,record:r||null,source:source||null,status,suggestions:suggest(ref,lib)};
 });
 return {entries,reviewed:entries.filter(x=>x.status==='reviewed').length,total:entries.length};
}
if(typeof module!=='undefined'&&module.exports)module.exports={safeUrl,refSig,docSig,sourceSig,sources,suggest,assess};
if(root)root.MQ_refCheck={safeUrl,refSig,docSig,sourceSig,sources,suggest,assess};
})(typeof window==='undefined'?null:window);