/* ── مركز التواصل المهني: التواصل مع الزملاء المحامين ──
   يُفتح من أيقونة مميزة في أعلى شاشة الإدارة (من أي مكان)، ومن ملف القضية (مرتبطاً بها تلقائياً).
   • المستلم: دليل النقابة (بحث بالاسم/العضوية/الهاتف)، وكيل الخصم مقترحاً من القضية، المفضّلون، وآخر من تواصلت معهم.
   • باقة قوالب مهنية مصنّفة (الجلسات، اللوائح والبينات، التسوية، الإنابة والتعاون، الإدارية، المجاملات) بصيغتين: رسمية ومختصرة.
   • القنوات: واتساب، اتصال، رسالة SMS، بريد إلكتروني، نسخ.
   • كل تواصل يُسجَّل في سجل القضية، مع خيار «ذكّرني بالمتابعة» يضيف مهلة متابعة للقضية، و«سجل التواصل» لكل القضايا.
   لا يُرسل شيء تلقائياً: الرسالة تُفتح في التطبيق المختار ليراجعها المحامي ويرسلها بنفسه.
   ملاحظة مهنية: التواصل مع وكيل الخصم لا مع الخصم نفسه. */
(function(){
'use strict';
const root=typeof window!=='undefined'?window:globalThis;
/* رقم واتساب دولي من رقم محلي: 059/056 جوال فلسطيني (970)، و05x الأخرى إسرائيلي (972)؛ الأرضي لا يصلح لواتساب */
function waNumber(p){let d=String(p||'').replace(/[^\d+]/g,'');if(!d)return '';
 if(d.startsWith('+'))d=d.slice(1);else if(d.startsWith('00'))d=d.slice(2);
 if(/^(970|972)5\d{8}$/.test(d))return d;
 if(/^05\d{8}$/.test(d))return (/^05[69]/.test(d)?'970':'972')+d.slice(1);
 if(/^5\d{8}$/.test(d))return (/^5[69]/.test(d)?'970':'972')+d;
 return ''}
const isMobile=p=>!!waNumber(p);
const bare=s=>String(s||'').replace(/^(?:الأستاذة?|الاستاذة?|المحامية?|أ\.|ا\.|د\.)\s*/g,'').replace(/^(?:الأستاذة?|المحامية?)\s*/,'').trim();

/* ── باقة القوالب ── {ق}=سطر القضية، {الجلسة}، {التاريخ}، {الموضوع}، {المحكمة}، {رقم} ── */
const CATS=[['hearing','الجلسات','⚖'],['plead','اللوائح والبينات','📑'],['settle','التسوية','🤝'],['coop','الإنابة والتعاون','🧑‍⚖️'],['admin','إدارية','🗂'],['courtesy','مجاملات','🌿']];
const TPL=[
 {id:'coord',cat:'hearing',t:'تنسيق بخصوص الجلسة',f:'{ق}\nأرجو التنسيق معكم بخصوص الجلسة القادمة{الجلسة_ب}، للاتفاق على ما يلزم تقديمه فيها.',s:'{ق_مختصر} أرجو التنسيق بخصوص الجلسة القادمة{الجلسة_ب}.'},
 {id:'adjourn',cat:'hearing',t:'طلب تأجيل باتفاق الطرفين',f:'{ق}\nنظراً لظرف طارئ، أرجو موافقتكم على طلب تأجيل الجلسة{الجلسة_ب} باتفاق الطرفين، على أن نتقدّم بالطلب مشتركاً أو أن تتكرّموا بعدم الممانعة أمام عدالة المحكمة.',s:'{ق_مختصر} هل توافق على تأجيل الجلسة{الجلسة_ب} باتفاق الطرفين؟'},
 {id:'remind',cat:'hearing',t:'تذكير بموعد جلسة',f:'{ق}\nللتذكير، الجلسة القادمة{الجلسة_ب}.',s:'{ق_مختصر} تذكير بالجلسة{الجلسة_ب}.'},
 {id:'decision',cat:'hearing',t:'إبلاغ بقرار المحكمة',f:'{ق}\nأحيطكم علماً بأن المحكمة قررت في الجلسة الأخيرة: {القرار}.',s:'{ق_مختصر} قرار المحكمة: {القرار}.'},
 {id:'exchange',cat:'plead',t:'تبادل اللوائح والبينات',f:'{ق}\nبخصوص تبادل اللوائح والبينات، أرجو تزويدي بنسخة عن لائحتكم وقائمة بيناتكم، وسأزوّدكم بالمقابل بما لدينا ضمن المدة القانونية.',s:'{ق_مختصر} أرجو تزويدي بنسخة عن لائحتكم وبيناتكم للتبادل.'},
 {id:'copy',cat:'plead',t:'طلب نسخة مستند',f:'{ق}\nأرجو التكرّم بتزويدي بنسخة عن {المستند} المقدّم في الملف، وذلك لغايات الرد ضمن المدة.',s:'{ق_مختصر} أرجو تزويدي بنسخة عن {المستند}.'},
 {id:'served',cat:'plead',t:'تأكيد التبليغ والاستلام',f:'{ق}\nأؤكد لكم استلام {المستند} بتاريخ {التاريخ}، وشكراً على تعاونكم.',s:'{ق_مختصر} تم استلام {المستند} بتاريخ {التاريخ}، شكراً.'},
 {id:'settle',cat:'settle',t:'بحث التسوية الودية',f:'{ق}\nأود بحث إمكانية التسوية الودية في هذه القضية إن كان ذلك مناسباً لموكلكم، بما يحفظ حقوق الطرفين ويختصر إجراءات التقاضي.',s:'{ق_مختصر} هل لدى موكلكم استعداد لبحث تسوية ودية؟'},
 {id:'offer',cat:'settle',t:'عرض تسوية',f:'{ق}\nبناءً على تعليمات موكلي، وبدون إقرار بأي مسؤولية، أعرض عليكم تسوية النزاع على أساس: {العرض}.\nهذا العرض ساري حتى تاريخ {التاريخ}، ولا يجوز الاحتجاج به أمام المحكمة.',s:'{ق_مختصر} عرض تسوية (دون إقرار): {العرض}. ساري حتى {التاريخ}.'},
 {id:'meet',cat:'settle',t:'دعوة لاجتماع تسوية',f:'{ق}\nأقترح عقد اجتماع بحضور الطرفين لبحث التسوية، بتاريخ {التاريخ} في مكتبنا، أو في الموعد والمكان الذي ترونه مناسباً.',s:'{ق_مختصر} أقترح اجتماع تسوية بتاريخ {التاريخ}، هل يناسبكم؟'},
 {id:'followup',cat:'settle',t:'متابعة عرض سابق',f:'{ق}\nأتابع معكم بخصوص العرض المرسل سابقاً، وأرجو إفادتي بموقف موكلكم منه.',s:'{ق_مختصر} أتابع بخصوص العرض السابق، ما موقف موكلكم؟'},
 {id:'proxy',cat:'coop',t:'طلب إنابة لحضور جلسة',f:'{ق}\nأرجو التكرّم بالإنابة عني في حضور الجلسة{الجلسة_ب}، والمطلوب فيها: {المطلوب}. وسأزوّدكم بالوكالة وكل ما يلزم.',s:'{ق_مختصر} هل يمكنك الإنابة عني في الجلسة{الجلسة_ب}؟ المطلوب: {المطلوب}.'},
 {id:'proxythanks',cat:'coop',t:'شكر على إنابة',f:'{ق}\nأشكركم جزيل الشكر على تفضّلكم بالإنابة وحضور الجلسة، وأرجو إفادتي بما جرى فيها.',s:'شكراً جزيلاً على الإنابة، أرجو إفادتي بما جرى.'},
 {id:'consult',cat:'coop',t:'استشارة زميل',f:'أودّ الاستئناس برأيكم المهني في مسألة تتعلق بـ {المسألة}، لما لكم من خبرة في هذا المجال، وذلك في الوقت الذي يناسبكم.',s:'أودّ أخذ رأيك في مسألة: {المسألة}. متى يناسبك؟'},
 {id:'refer',cat:'coop',t:'إحالة موكل',f:'أحيل إليكم موكلاً يحتاج إلى متابعة في قضية {الموضوع}، لاختصاصكم في هذا المجال، وسيتواصل معكم مباشرة.',s:'سأحيل إليك موكلاً في قضية {الموضوع}، سيتواصل معك.'},
 {id:'address',cat:'admin',t:'طلب عنوان التبليغ',f:'{ق}\nأرجو تزويدي بعنوان التبليغ المعتمد لموكلكم، لغايات استكمال إجراءات التبليغ.',s:'{ق_مختصر} أرجو تزويدي بعنوان التبليغ المعتمد لموكلكم.'},
 {id:'resched',cat:'admin',t:'تعديل موعد اجتماع',f:'أعتذر عن تعديل موعد اجتماعنا، وأقترح بدلاً منه {التاريخ}، أو أي موعد آخر يناسبكم.',s:'أعتذر، هل يناسبك تعديل الموعد إلى {التاريخ}؟'},
 {id:'received',cat:'admin',t:'تأكيد استلام رسالة',f:'أؤكد استلام رسالتكم، وسأعود إليكم بالرد في أقرب وقت.',s:'وصلت رسالتك، سأرد قريباً.'},
 {id:'congrats',cat:'courtesy',t:'تهنئة',f:'أتقدّم إليكم بأحرّ التهاني بمناسبة {المناسبة}، متمنياً لكم دوام التوفيق والنجاح.',s:'ألف مبروك {المناسبة}، بالتوفيق دائماً.'},
 {id:'condole',cat:'courtesy',t:'تعزية',f:'تلقيت ببالغ الحزن نبأ {المناسبة}، أتقدّم إليكم بخالص العزاء والمواساة، سائلاً المولى أن يتغمّد الفقيد بواسع رحمته.',s:'أحرّ التعازي، رحم الله الفقيد.'},
 {id:'thanks',cat:'courtesy',t:'شكر وتقدير',f:'أشكركم على تعاونكم المهني الكريم، وهو محلّ تقدير.',s:'شكراً على تعاونك.'},
 {id:'free',cat:'admin',t:'رسالة حرّة',f:'{ق}\n',s:'{ق_مختصر}'}];
/* القيم التي يكتبها المحامي في القالب (تظهر حقولاً عند الحاجة) */
const FIELDS={'القرار':'قرار المحكمة','المستند':'المستند','العرض':'أساس العرض','المطلوب':'المطلوب في الجلسة','المسألة':'المسألة','الموضوع':'موضوع القضية','المناسبة':'المناسبة','التاريخ':'التاريخ'};
/* بناء الرسالة: تحية + نص القالب + ختام؛ الحقول الناقصة تبقى بين [ ] لتُكمل */
function build(id,{tone='f',name='',me='',office='',no='',court='',subject='',next='',vals={}}={}){
 const t=TPL.find(x=>x.id===id)||TPL[TPL.length-1];
 const caseLine=no?`بخصوص القضية رقم ${no}${court?' لدى '+court:''}${subject?' ('+subject+')':''}.`:'';
 const caseShort=no?`بخصوص القضية ${no}${court?' ('+court+')':''}:`:'';
 const v=k=>(vals[k]||(k==='الموضوع'?subject:'')||'').trim()||'['+(FIELDS[k]||k)+']';
 let body=(tone==='s'?t.s:t.f).replace('{ق}',caseLine).replace('{ق_مختصر}',caseShort).replace(/\{الجلسة_ب\}/g,next?' بتاريخ '+next:'').replace(/\{([^{}]+)\}/g,(m,k)=>v(k)).replace(/^\n+/,'').replace(/\n{3,}/g,'\n\n').trim();
 const hello=tone==='s'?`الأستاذ/ة ${name||'[اسم الزميل]'}، تحية طيبة،`:`الزميل/ة الأستاذ/ة ${name||'[اسم الزميل]'} المحترم/ة،\nتحية طيبة وبعد،`;
 const intro=tone==='s'?'':`\nمعك ${me?'المحامي '+me:'المحامي'}${office?' من '+office:''}.`;
 const bye=tone==='s'?`\n\n${me||''}`:`\n\nمع وافر الاحترام،\n${me||''}${office?'\n'+office:''}`;
 return (hello+intro+'\n'+body+bye).replace(/\n{3,}/g,'\n\n').trim()}
const missing=t=>[...new Set((String(t).match(/\[[^\]\n]{2,30}\]/g)||[]))];
/* التوافق مع النسخة السابقة (والاختبارات) */
const REASON_TXT={coord:'أرجو التنسيق معك بخصوص الجلسة القادمة.',settle:'أود بحث إمكانية التسوية الودية في هذه القضية إن كان ذلك مناسباً لموكلك.',exchange:'بخصوص تبادل اللوائح والبينات، أرجو التنسيق لتبادل النسخ.',adjourn:'أرجو التنسيق بخصوص طلب التأجيل باتفاق الطرفين.',proxy:'أرجو التكرم بالإنابة عني في حضور الجلسة.'};
function compose(k,o){const s=(root.MQ&&MQ.settings)||{},me=(root.MQ&&MQ.user&&MQ.user.name)||s.lawyerName||'';
 const lines=[`الزميل/ة الأستاذ/ة ${o.name||''} المحترم/ة،`,'تحية طيبة وبعد،',`معك ${me?('المحامي '+me):'المحامي'}${(s.officeName||o.office)?' من '+(s.officeName||o.office):''}.`,`أتواصل معك بخصوص القضية رقم ${o.no||'—'}${o.court?' لدى '+o.court:''}${o.subject?' ('+o.subject+')':''}.`];
 if(o.next)lines.push(`الجلسة القادمة بتاريخ ${o.next}.`);if(REASON_TXT[o.reason])lines.push(REASON_TXT[o.reason]);if(o.extra)lines.push(o.extra);
 lines.push('','مع الاحترام،',me||'');return lines.join('\n').trim()}
if(typeof module!=='undefined'){module.exports={waNumber,isMobile,bare,compose,build,missing,TPL,CATS};return}
if(typeof document==='undefined')return;

/* ── الواجهة ── */
const doc=document,e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(_){return d}},SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const st={k:null,tab:'dir',q:'',rows:[],sel:null,busy:false,tpl:LS('mq_lc_tpl','coord'),tone:LS('mq_lc_tone','f'),cat:'',vals:{},text:'',edited:false,manual:'',follow:0,view:'compose',hq:''};
const allCases=()=>typeof cases!=='undefined'?cases:[];
const courtName=k=>{try{const c=(typeof courts!=='undefined'?courts:[]).find(c=>c.id===k.court);return c?c.name:(k.court||'')}catch(x){return ''}};
const nextHearing=k=>{try{const t=new Date().toISOString().slice(0,10);const h=(typeof hearings!=='undefined'?hearings:[]).filter(h=>h.k===k.id&&h.date>=t).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))[0];if(!h)return '';const[y,m,d]=h.date.split('-');return `${+d}/${+m}/${y}${h.time?' الساعة '+h.time:''}`}catch(x){return ''}};
const oppLawyers=k=>{try{return (k.opps||[]).map(id=>(typeof opponents!=='undefined'?opponents:[]).find(o=>o.id===id)).filter(o=>o&&o.lawyer&&!/النيابة/.test(o.lawyer)).map(o=>({lawyer:bare(o.lawyer),opp:o.name}))}catch(x){return []}};
const me=()=>(root.MQ&&MQ.user&&MQ.user.name)||((root.MQ&&MQ.settings)||{}).lawyerName||'';
const office=()=>((root.MQ&&MQ.settings)||{}).officeName||'';
const favs=()=>LS('mq_lc_fav',[]);
/* آخر من تواصلت معهم: من سجل كل القضايا (مشترك بين أجهزة المكتب) */
function history(){const out=[];for(const k of allCases())for(const n of k.notes||[])if(n.kind==='lawyer-contact')out.push({k,n});return out.sort((a,b)=>String(b.n.at).localeCompare(String(a.n.at)))}
function recents(){const seen=new Set(),out=[];for(const {n} of history()){const key=n.mno||n.to;if(!key||seen.has(key))continue;seen.add(key);out.push({name:n.to||'',mno:n.mno||'',phones:n.phone?[n.phone]:[],city:n.city||'',office:n.office||''});if(out.length>=15)break}return out}

function regen(){if(st.edited)return;const k=st.k;st.text=build(st.tpl,{tone:st.tone,name:st.sel?st.sel.name:'',me:me(),office:office(),no:k?k.no:'',court:k?courtName(k):'',subject:k?k.subject:'',next:k?nextHearing(k):'',vals:st.vals})}
function search(q){st.q=q;st.busy=true;drawRes();
 fetch('/api/bar?limit=14&q='+encodeURIComponent(q)).then(r=>r.ok?r.json():{rows:[]}).then(d=>{if(st.q!==q)return;st.rows=d.rows||[];st.busy=false;drawRes()}).catch(()=>{st.busy=false;st.rows=[];drawRes()})}
let tq=null;
const ICON=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5l4-2 5 2.5 5-2.5 4 2"/><path d="M7 5.5v6.5M17 5.5v6.5M5 12l2-4 2 4a2 2 0 0 1-4 0zM15 12l2-4 2 4a2 2 0 0 1-4 0z"/><path d="M8.5 19.5c1-1.8 2.2-2.6 3.5-2.6s2.5.8 3.5 2.6M12 16.9V10"/></svg>`;

function open(kid){const k=kid?(typeof K==='function'?K(kid):null):((typeof S!=='undefined'&&S.caseId&&['client','case'].includes(S.view))?K(S.caseId):null);
 Object.assign(st,{k,sel:null,rows:[],q:'',vals:{},edited:false,manual:'',follow:0,view:'compose',tab:k&&oppLawyers(k).length?'dir':(recents().length?'recent':'dir')});
 doc.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal lc-m" role="dialog" aria-label="مركز التواصل المهني">
  <div class="lc-hd"><span class="lc-logo">${ICON}</span><div><h1>مركز التواصل المهني</h1><small>التواصل مع الزملاء المحامين: قوالب جاهزة، دليل النقابة، وسجل لكل قضية</small></div>
   <nav class="lc-views"><button type="button" data-act="lcView" data-v="compose" class="on">رسالة جديدة</button><button type="button" data-act="lcView" data-v="log">سجل التواصل <span class="cnt">${history().length||''}</span></button></nav><button class="btn sm" data-act="close">إغلاق</button></div>
  <div id="lcBody"></div></div></div>`;
 regen();drawBody();
 const ops=k?oppLawyers(k):[];if(ops[0]){search(ops[0].lawyer)}}
function drawBody(){const b=doc.getElementById('lcBody');if(!b)return;
 doc.querySelectorAll('.lc-views button').forEach(x=>x.classList.toggle('on',x.dataset.v===st.view));
 if(st.view==='log'){b.innerHTML=logView();const i=doc.getElementById('lcHq');if(i)i.oninput=()=>{st.hq=i.value;b.querySelector('.lc-log').outerHTML=logList()};return}
 const k=st.k,ops=k?oppLawyers(k):[];
 b.innerHTML=`<div class="lc-grid">
  <section class="lc-col"><h3><i>1</i> المستلم</h3>
   <div class="lc-tabs"><button type="button" data-act="lcTab" data-v="dir" class="${st.tab==='dir'?'on':''}">دليل النقابة</button><button type="button" data-act="lcTab" data-v="fav" class="${st.tab==='fav'?'on':''}">المفضّلون <span class="cnt">${favs().length||''}</span></button><button type="button" data-act="lcTab" data-v="recent" class="${st.tab==='recent'?'on':''}">الأخيرة</button></div>
   ${ops.length?`<div class="lc-ops"><span>وكيل الخصم:</span>${ops.map(x=>`<button type="button" class="chip" data-act="lcQ" data-v="${e(x.lawyer)}">${e(x.lawyer)} <small>· عن ${e(x.opp)}</small></button>`).join('')}</div>`:''}
   ${st.tab==='dir'?`<input class="field" id="lcQ" placeholder="الاسم، رقم العضوية، أو الهاتف…" value="${e(st.q)}" autocomplete="off">`:''}
   <div id="lcRes" class="lc-res"></div></section>
  <section class="lc-col"><h3><i>2</i> القضية والقالب</h3>
   <label class="lc-l">القضية<select class="field" id="lcK"><option value="">بدون قضية (رسالة عامة)</option>${allCases().filter(x=>x.status!=='منتهية'||x===k).map(x=>`<option value="${x.id}"${k&&x.id===k.id?' selected':''}>${e(x.no||'—')} · ${e(String(x.subject||'').slice(0,40))}</option>`).join('')}</select></label>
   <div class="lc-tone"><button type="button" data-act="lcTone" data-v="f" class="${st.tone==='f'?'on':''}">صيغة رسمية</button><button type="button" data-act="lcTone" data-v="s" class="${st.tone==='s'?'on':''}">مختصرة (واتساب)</button></div>
   <div class="lc-cats"><button type="button" data-act="lcCat" data-v="" class="${!st.cat?'on':''}">الكل</button>${CATS.map(([c,t,ic])=>`<button type="button" data-act="lcCat" data-v="${c}" class="${st.cat===c?'on':''}">${ic} ${t}</button>`).join('')}</div>
   <div class="lc-tpls">${TPL.filter(t=>!st.cat||t.cat===st.cat).map(t=>{const c=CATS.find(x=>x[0]===t.cat);return `<button type="button" class="lc-tpl ${st.tpl===t.id?'on':''}" data-act="lcTpl" data-v="${t.id}"><span>${c[2]}</span><b>${e(t.t)}</b><small>${e(c[1])}</small></button>`}).join('')}</div></section>
  <section class="lc-col lc-msg"><h3><i>3</i> الرسالة والإرسال</h3><div id="lcMsg"></div></section></div>`;
 const i=doc.getElementById('lcQ');if(i)i.addEventListener('input',()=>{clearTimeout(tq);const v=i.value.trim();tq=setTimeout(()=>v.length>=2?search(v):(st.rows=[],drawRes()),250)});
 doc.getElementById('lcK').onchange=ev=>{st.k=ev.target.value?K(ev.target.value):null;st.edited=false;regen();drawBody();const o=st.k?oppLawyers(st.k):[];if(o[0]&&!st.sel)search(o[0].lawyer)};
 drawRes();drawMsg()}
function rowsOf(){return st.tab==='fav'?favs():st.tab==='recent'?recents():st.rows}
function drawRes(){const r=doc.getElementById('lcRes');if(!r)return;const rows=rowsOf(),F=new Set(favs().map(x=>x.mno||x.name));
 r.innerHTML=st.tab==='dir'&&st.busy?'<div class="m">جارٍ البحث في الدليل…</div>':rows.length?rows.map((x,i)=>{const mob=(x.phones||[]).filter(isMobile).length,act=!x.status||/مزاول|فعال|عامل/.test(x.status);
  return `<div class="lc-row ${st.sel&&(st.sel.mno||st.sel.name)===(x.mno||x.name)?'on':''}"><button type="button" class="lc-pick" data-act="lcPick" data-v="${i}"><b>${e(x.name)}</b><span>${x.mno?'عضوية '+e(x.mno):''}${x.city?' · '+e(x.city):''}${x.office?' · '+e(x.office):''}</span><em>${mob?'📱 واتساب متاح':(x.phones||[]).length?'☎ هاتف أرضي فقط':'لا رقم في الدليل'}${act?'':' · '+e(x.status)}</em></button><button type="button" class="lc-star ${F.has(x.mno||x.name)?'on':''}" data-act="lcFav" data-v="${i}" title="المفضّلون">★</button></div>`}).join(''):
  `<div class="m lc-empty">${st.tab==='fav'?'لا مفضّلين بعد. اضغط ★ بجانب أي زميل لإضافته.':st.tab==='recent'?'لم تتواصل مع أحد بعد.':'ابحث في دليل النقابة (أكثر من 18 ألف محامٍ) بالاسم أو رقم العضوية أو الهاتف.'}</div>`}
function drawMsg(){const m=doc.getElementById('lcMsg');if(!m)return;const o=st.sel,phones=o?(o.phones||[]):[],mob=phones.map(waNumber).filter(Boolean),wa=mob[0]||waNumber(st.manual);
 const t=TPL.find(x=>x.id===st.tpl)||TPL[0];const need=[...new Set(((st.tone==='s'?t.s:t.f).match(/\{([^{}]+)\}/g)||[]).map(x=>x.slice(1,-1)).filter(x=>FIELDS[x]&&!(x==='الموضوع'&&st.k)))];
 const miss=missing(st.text);
 m.innerHTML=`${o?`<div class="lc-who"><b>${e(o.name)}</b><span>${o.mno?'عضوية '+e(o.mno):''}${o.city?' · '+e(o.city):''}${phones.length?' · '+phones.map(e).join('، '):''}</span></div>`:'<div class="lc-who m">اختر الزميل من القائمة (أو اكتب الرسالة واختر لاحقاً)</div>'}
  ${need.length?`<div class="lc-fields">${need.map(f=>`<label>${e(FIELDS[f])}<input class="field" data-fv="${e(f)}" value="${e(st.vals[f]||'')}" ${f==='التاريخ'?'placeholder="مثال: الأحد 2/11/2026"':''}></label>`).join('')}</div>`:''}
  <label class="lc-l">نص الرسالة <small class="m">${st.edited?'عدّلتَه يدوياً — <button type="button" class="link" data-act="lcReset">إعادة من القالب</button>':'يمكنك التعديل قبل الإرسال'}</small><textarea class="field" id="lcT" rows="11">${e(st.text)}</textarea></label>
  <div class="lc-meta"><span>${st.text.length} حرفاً</span>${miss.length?`<span class="lc-miss">ينقص: ${miss.map(e).join('، ')}</span>`:''}</div>
  ${o&&!mob.length?`<label class="lc-l">رقم جوال الزميل (غير موجود في الدليل)<input class="field mono" id="lcPh" dir="ltr" value="${e(st.manual)}" placeholder="059xxxxxxx"></label>`:''}
  ${st.k?`<label class="lc-follow"><input type="checkbox" id="lcF" ${st.follow?'checked':''}> ذكّرني بمتابعة الرد بعد <input type="number" id="lcFd" min="1" max="60" value="${st.follow||3}" class="field"> أيام (تُضاف مهلة متابعة في القضية)</label>`:''}
  <div class="lc-send"><button type="button" class="btn pri lc-wa" data-act="lcSend" data-v="wa" ${wa?'':'disabled'}>واتساب</button>
   <button type="button" class="btn" data-act="lcSend" data-v="call" ${phones[0]||st.manual?'':'disabled'}>اتصال</button>
   <button type="button" class="btn" data-act="lcSend" data-v="sms" ${wa?'':'disabled'}>رسالة SMS</button>
   <button type="button" class="btn" data-act="lcSend" data-v="mail" ${o&&o.email?'':'disabled'} title="${o&&o.email?e(o.email):'لا بريد في الدليل'}">بريد</button>
   <button type="button" class="btn" data-act="lcSend" data-v="copy">نسخ</button></div>
  <p class="m lc-note">تُفتح الرسالة في التطبيق لتراجعها وترسلها بنفسك، ويُسجَّل التواصل${st.k?' في سجل القضية '+e(st.k.no||''):' في سجل التواصل'}. التواصل مع وكيل الخصم لا مع الخصم نفسه.</p>`;
 const T=doc.getElementById('lcT');T.oninput=()=>{st.text=T.value;st.edited=true;const mt=m.querySelector('.lc-meta');if(mt){const ms=missing(st.text);mt.innerHTML=`<span>${st.text.length} حرفاً</span>${ms.length?`<span class="lc-miss">ينقص: ${ms.map(e).join('، ')}</span>`:''}`}};
 m.querySelectorAll('[data-fv]').forEach(i=>i.oninput=()=>{st.vals[i.dataset.fv]=i.value;st.edited=false;regen();T.value=st.text;const mt=m.querySelector('.lc-meta');if(mt){const ms=missing(st.text);mt.innerHTML=`<span>${st.text.length} حرفاً</span>${ms.length?`<span class="lc-miss">ينقص: ${ms.map(e).join('، ')}</span>`:''}`}});
 const P=doc.getElementById('lcPh');if(P)P.oninput=()=>{st.manual=P.value;const ok=!!waNumber(P.value);m.querySelectorAll('[data-v="wa"],[data-v="sms"],[data-v="call"]').forEach(b=>b.disabled=!ok&&b.dataset.v!=='call'?true:!P.value)};
 const F=doc.getElementById('lcF'),FD=doc.getElementById('lcFd');if(F){F.onchange=()=>{st.follow=F.checked?(+FD.value||3):0};FD.oninput=()=>{if(F.checked)st.follow=+FD.value||3}}}
function logList(){const q=String(st.hq||'').trim(),rows=history().filter(({k,n})=>!q||[n.text,n.to,k.no,k.subject].join(' ').includes(q));
 return `<div class="lc-log">${rows.length?rows.slice(0,200).map(({k,n})=>`<div class="lc-lrow"><time>${e(n.at||'')}</time><b>${e(n.to||'')}</b><span class="pill">${e(n.via||'')}</span><button class="link mono" data-act="lcOpenCase" data-v="${k.id}">${e(k.no||'')}</button><small>${e(n.tpl||'')}${n.by?' · '+e(n.by):''}</small></div>`).join(''):'<div class="m">لا تواصل مسجّل بعد.</div>'}</div>`}
function logView(){return `<div class="lc-logv"><input class="field" id="lcHq" placeholder="بحث في السجل: اسم الزميل، رقم القضية، القالب…" value="${e(st.hq||'')}">${logList()}</div>`}

function addNote(via){const o=st.sel,k=st.k,at=new Date(),p=n=>String(n).padStart(2,'0'),stamp=`${at.getFullYear()}-${p(at.getMonth()+1)}-${p(at.getDate())} ${p(at.getHours())}:${p(at.getMinutes())}`;
 const t=TPL.find(x=>x.id===st.tpl)||{};const who=o?o.name:'(بدون مستلم محدد)';
 const note={id:'n'+Date.now().toString(36),at:stamp,by:me(),kind:'lawyer-contact',to:who,mno:o&&o.mno||'',phone:o&&((o.phones||[])[0])||st.manual||'',city:o&&o.city||'',office:o&&o.office||'',via,tpl:t.t||'',text:`تواصل مع ${o?'المحامي '+who+(o.mno?' (عضوية '+o.mno+')':''):'زميل'} ${via} — ${t.t||''}:\n${st.text}`};
 if(k){k.notes=[...(k.notes||[]),note];
  if(st.follow>0&&typeof deadlines!=='undefined'){const d=new Date();d.setDate(d.getDate()+st.follow);deadlines.push({id:'d'+Date.now().toString(36),k:k.id,title:`متابعة رد ${who} (${t.t||'تواصل'})`,due:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,kind:'متابعة',done:false})}}
 else{/* بلا قضية: يُحفظ في سجل محلي لهذا الجهاز */const g=LS('mq_lc_general',[]);g.unshift(note);SV('mq_lc_general',g.slice(0,300))}
 if(root.MQ&&MQ.saveState)MQ.saveState()}
const VIA={wa:'عبر واتساب',call:'باتصال هاتفي',sms:'برسالة SMS',mail:'بالبريد الإلكتروني',copy:'برسالة منسوخة'};
A.lcOpen=v=>open(v||'');
A.lcView=v=>{st.view=v;drawBody()};
A.lcTab=v=>{st.tab=v;drawBody();if(v==='dir'){const i=doc.getElementById('lcQ');if(i)i.focus()}};
A.lcQ=v=>{st.tab='dir';drawBody();const i=doc.getElementById('lcQ');if(i)i.value=v;search(v)};
A.lcPick=v=>{st.sel=rowsOf()[+v]||null;st.manual='';regen();drawRes();drawMsg()};
A.lcFav=v=>{const x=rowsOf()[+v];if(!x)return;let f=favs();const key=x.mno||x.name;f=f.some(y=>(y.mno||y.name)===key)?f.filter(y=>(y.mno||y.name)!==key):[{name:x.name,mno:x.mno,phones:x.phones||[],city:x.city||'',office:x.office||'',email:x.email||''},...f].slice(0,60);SV('mq_lc_fav',f);drawBody()};
A.lcTpl=v=>{st.tpl=v;SV('mq_lc_tpl',v);st.edited=false;regen();drawBody()};
A.lcCat=v=>{st.cat=v;drawBody()};
A.lcTone=v=>{st.tone=v==='s'?'s':'f';SV('mq_lc_tone',st.tone);st.edited=false;regen();drawBody()};
A.lcReset=()=>{st.edited=false;regen();drawMsg()};
A.lcOpenCase=v=>{A.close();A.openCase(v)};
A.lcSend=v=>{const o=st.sel,text=st.text,n=(o&&(o.phones||[]).map(waNumber).find(Boolean))||waNumber(st.manual);
 const ms=missing(text);if(ms.length&&v!=='copy'&&!confirm('في الرسالة حقول لم تُكمل: '+ms.join('، ')+'\nهل تريد المتابعة؟'))return;
 if(v==='wa'){if(!n)return;window.open('https://wa.me/'+n+'?text='+encodeURIComponent(text),'_blank','noopener')}
 else if(v==='sms'){if(!n)return;location.href='sms:+'+n+'?body='+encodeURIComponent(text)}
 else if(v==='call'){const ph=(o&&(o.phones||[])[0])||st.manual;if(!ph)return;location.href='tel:'+String(ph).replace(/[^\d+]/g,'')}
 else if(v==='mail'){if(!o||!o.email)return;location.href='mailto:'+o.email+'?subject='+encodeURIComponent((TPL.find(x=>x.id===st.tpl)||{}).t||'')+'&body='+encodeURIComponent(text)}
 else if(v==='copy'){(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).catch(()=>{})}
 addNote(VIA[v]);if(typeof toast==='function')toast((v==='copy'?'نُسخت الرسالة':'فُتحت الرسالة')+(st.k?' وسُجّل التواصل في القضية '+(st.k.no||''):' وسُجّل في سجل التواصل')+(st.follow&&st.k?' مع مهلة متابعة':''));
 A.close();if(typeof render==='function')render()};
A.lcCall=()=>A.lcSend('call');A.lcCopy=()=>A.lcSend('copy');

/* زر في شريط أوامر القضية */
if(typeof V!=='undefined'&&typeof V.case==='function'){const v0=V.case;V.case=function(){const h=v0.apply(this,arguments);const k=typeof K==='function'?K(S.caseId):null;if(!k)return h;
 return h.replace(/(<div class="hub-acts"[^>]*>)/,`$1<button type="button" class="btn sm lc-casebtn" data-act="lcOpen" data-v="${e(k.id)}"><span class="lc-ic">${ICON}</span>تواصل مع محامٍ</button>`)}}
/* اختصار دائم في أعلى شاشة الإدارة: أيقونة مميزة صغيرة بجانب الإشعارات */
function mountTop(){const ic=doc.getElementById('topIcons');if(!ic)return;if(doc.getElementById('lcTop'))return;
 const b=doc.createElement('button');b.id='lcTop';b.className='tico lc-top';b.type='button';b.dataset.act='lcOpen';b.title='مركز التواصل المهني: مراسلة زميل محامٍ (Ctrl+Alt+L)';b.setAttribute('aria-label','مركز التواصل المهني');b.innerHTML=ICON;ic.prepend(b)}
setInterval(mountTop,1500);setTimeout(mountTop,300);
doc.addEventListener('keydown',ev=>{if(ev.ctrlKey&&ev.altKey&&ev.code==='KeyL'){ev.preventDefault();open('')}});

const css=doc.createElement('style');css.textContent=`
.lc-m{max-width:1180px;width:min(1180px,97vw);padding:0!important;overflow:hidden}
.lc-hd{display:flex;align-items:center;gap:12px;padding:14px 18px;background:linear-gradient(135deg,#0B1B2B,#16324D);color:#F2E6C4;border-bottom:2px solid #C9A24A}
.lc-hd h1{margin:0;font-size:20px;color:#F3D58A}.lc-hd small{color:#C9D4DB;font-size:12.5px}.lc-hd>div{flex:1}
.lc-hd .btn{background:transparent;color:#F3D58A;border-color:#C9A24A}
.lc-logo{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#F3D58A;color:#0B1B2B}.lc-logo svg{width:26px;height:26px}
.lc-views{display:flex;gap:4px;background:rgb(255 255 255 / .08);padding:4px;border-radius:10px}.lc-views button{border:0;background:none;color:#E9E2D0;padding:7px 12px;border-radius:8px;font:inherit;font-size:13px;cursor:pointer}.lc-views button.on{background:#F3D58A;color:#0B1B2B;font-weight:700}
#lcBody{padding:14px 16px;max-height:calc(92vh - 80px);overflow:auto}
.lc-grid{display:grid;grid-template-columns:1fr 1.05fr 1.25fr;gap:14px}@media(max-width:1000px){.lc-grid{grid-template-columns:1fr}}
.lc-col{background:var(--surface,#fff);border:1px solid var(--line,#E5DCC6);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.lc-col h3{margin:0 0 2px;font-size:15px;display:flex;align-items:center;gap:8px}.lc-col h3 i{font-style:normal;width:22px;height:22px;border-radius:50%;background:#0B1B2B;color:#F3D58A;display:grid;place-items:center;font-size:12px}
.lc-tabs,.lc-tone,.lc-cats{display:flex;flex-wrap:wrap;gap:4px}
.lc-tabs button,.lc-tone button,.lc-cats button{border:1px solid var(--line,#E2D7BF);background:var(--surface,#fff);border-radius:999px;padding:5px 11px;font:inherit;font-size:12.5px;cursor:pointer;color:inherit}
.lc-tabs button.on,.lc-tone button.on,.lc-cats button.on{background:#0B1B2B;color:#F3D58A;border-color:#0B1B2B}
.lc-ops{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.lc-ops>span{font-size:12.5px;color:var(--muted,#6B5E44)}
.lc-res{max-height:52vh;overflow:auto;display:flex;flex-direction:column;gap:6px}
.lc-row{display:flex;align-items:stretch;border:1px solid var(--line,#E5DCC6);border-radius:10px;overflow:hidden}
.lc-row.on{border-color:#C9A24A;box-shadow:0 0 0 2px rgb(201 162 74 / .25)}
.lc-pick{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:right;padding:8px 11px;border:0;background:var(--surface,#fff);cursor:pointer;font:inherit;color:inherit}
.lc-row.on .lc-pick{background:#FBF3DD}.lc-pick span{font-size:12px;color:var(--muted,#6B5E44)}.lc-pick em{font-size:11.5px;color:#2F7D4A;font-style:normal}
.lc-star{border:0;border-inline-start:1px solid var(--line,#E5DCC6);background:var(--surface,#fff);color:#C9C2B0;font-size:18px;width:38px;cursor:pointer}.lc-star.on{color:#E0A800}
.lc-empty{padding:10px;line-height:1.8}
.lc-l{display:flex;flex-direction:column;gap:4px;font-size:13px}
.lc-tpls{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;max-height:46vh;overflow:auto;padding:2px}
.lc-tpl{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;border:1px solid var(--line,#E5DCC6);border-radius:10px;background:var(--surface,#fff);cursor:pointer;text-align:right;font:inherit;color:inherit}
.lc-tpl span{font-size:17px}.lc-tpl b{font-size:13px}.lc-tpl small{font-size:11px;color:var(--muted,#7A6A48)}
.lc-tpl:hover{border-color:#C9A24A}.lc-tpl.on{border-color:#C9A24A;background:#FBF3DD;box-shadow:0 0 0 2px rgb(201 162 74 / .25)}
.lc-who{padding:9px 12px;border-radius:10px;background:#0B1B2B;color:#F2E6C4}.lc-who b{display:block;color:#F3D58A}.lc-who span{font-size:12px}.lc-who.m{background:var(--surface,#F4F1EA);color:inherit;border:1px dashed var(--line,#E2D7BF)}
.lc-fields{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lc-fields label{display:flex;flex-direction:column;gap:3px;font-size:12.5px}
.lc-msg textarea{font-size:14px;line-height:1.9;min-height:220px}
.lc-meta{display:flex;justify-content:space-between;font-size:12px;color:var(--muted,#7A8592)}.lc-miss{color:#B23A3A;font-weight:600}
.lc-follow{display:flex;align-items:center;gap:6px;font-size:13px;flex-wrap:wrap}.lc-follow input[type=number]{width:64px;padding:4px 6px}
.lc-send{display:flex;flex-wrap:wrap;gap:6px}.lc-wa{background:#1F9D55!important;border-color:#1F9D55!important;color:#fff!important}
.lc-note{font-size:12px;margin:0}
.lc-logv{display:flex;flex-direction:column;gap:10px}.lc-log{display:flex;flex-direction:column;gap:6px}
.lc-lrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--line,#E5DCC6);border-radius:10px;background:var(--surface,#fff)}.lc-lrow time{font:12px ui-monospace,monospace;color:var(--muted,#7A8592)}.lc-lrow small{color:var(--muted,#7A8592)}
.lc-top{color:#1D3557}.lc-top svg{width:22px;height:22px}
.lc-casebtn .lc-ic svg{width:15px;height:15px;vertical-align:-3px;margin-inline-end:5px}
html.night .lc-col,html.night .lc-pick,html.night .lc-tpl,html.night .lc-star,html.night .lc-lrow{background:#132433;color:#E9E2D0;border-color:#2B4256}html.night .lc-row.on .lc-pick,html.night .lc-tpl.on{background:#2A2618}`;
doc.head.appendChild(css);
})();
