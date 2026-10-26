/* ── تعبئة بطاقة الموكل من صورة الهوية ──
   الصورة تُقرأ على جهاز المكتب نفسه (قارئ النصوص المحلي في reader.js) ولا تخرج منه ولا تحتاج إنترنت.
   المحلّل يستخرج: رقم الهوية (مع فحص خانة التحقق)، الاسم الرباعي، تاريخ ومكان الميلاد، مكان الإقامة.
   كل ما يُستخرج يظهر مظللاً في النموذج للمراجعة، ولا يُحفظ شيء قبل أن يضغط المستخدم «حفظ». */
(function(){
'use strict';
const AR_DIG='٠١٢٣٤٥٦٧٨٩',FA_DIG='۰۱۲۳۴۵۶۷۸۹';
const toEn=s=>String(s||'').replace(/[٠-٩]/g,d=>AR_DIG.indexOf(d)).replace(/[۰-۹]/g,d=>FA_DIG.indexOf(d));
/* خانة التحقق في رقم الهوية الفلسطينية (9 خانات): الأوزان 1،2 بالتناوب ومجموع الأرقام يقبل القسمة على 10 */
function idValid(id){id=String(id||'');if(!/^\d{9}$/.test(id)||/^0+$/.test(id))return false;let s=0;for(let i=0;i<9;i++){let x=+id[i]*((i%2)+1);if(x>9)x-=9;s+=x}return s%10===0}
const clean=s=>String(s||'').replace(/[|_~^`"'«»:؛;\[\]{}()<>*•·]+/g,' ').replace(/[A-Za-z]+/g,' ').replace(/\s+/g,' ').trim();
const arOnly=s=>clean(s).replace(/[^؀-ۿ\s]/g,' ').replace(/\s+/g,' ').trim();
const LBL={
 full:/(?:الاسم\s*(?:الرباعي|الكامل)|الإسم\s*(?:الرباعي|الكامل))/,
 first:/(?:^|\s)(?:الاسم|الإسم|اسم\s*الشخص)(?!\s*(?:الرباعي|الكامل|الأب|الاب|الجد|العائلة|الأم|الام))/,
 father:/اسم\s*ال[أا]ب/, grand:/اسم\s*الجد/, family:/(?:اسم\s*العائلة|العائلة|اللقب)/, mother:/اسم\s*ال[أا]م/,
 dob:/تاريخ\s*(?:ال)?ميلاد|تاريخ\s*الولادة/, pob:/مكان\s*(?:ال)?ميلاد|مكان\s*الولادة/, res:/مكان\s*(?:ال)?[إا]قامة|العنوان|السكن/, sex:/الجنس/, rel:/الديانة/,
};
/* القيمة بعد التسمية على السطر نفسه، أو السطر التالي إن كان السطر فارغاً بعدها */
function after(lines,rx){
 for(let i=0;i<lines.length;i++){const m=rx.exec(lines[i]);if(!m)continue;
  let v=lines[i].slice(m.index+m[0].length).replace(/^[\s:：\-–—.،]+/,'');
  // لا نأخذ تسمية أخرى على السطر نفسه
  for(const k in LBL){const n=LBL[k].exec(v);if(n&&n.index>0)v=v.slice(0,n.index)}
  v=v.trim();if(!v&&lines[i+1]&&!Object.values(LBL).some(r=>r.test(lines[i+1])))v=lines[i+1].trim();
  if(v)return v}
 return ''}
function parseDate(s){s=toEn(s);let m=/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})/.exec(s);if(m)return mk(+m[3],+m[2],+m[1]);
 m=/(\d{4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})/.exec(s);if(m)return mk(+m[1],+m[2],+m[3]);return ''}
function mk(y,mo,d){if(y<1900||y>2100||mo<1||mo>12||d<1||d>31)return '';return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
function parse(raw){
 const text=toEn(String(raw||'')).replace(/\r/g,'');
 const lines=text.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
 const out={idNo:'',idOk:false,name:'',parts:{},dob:'',pob:'',residence:'',sex:'',warnings:[]};
 // رقم الهوية: أولوية لما بعد تسمية «رقم الهوية»، ثم أي رقم من 9 خانات صالح الخانة
 const cand=[];const lab=/رقم\s*(?:الهوية|الهويه|البطاقة|البطاقه|الهوية\s*الشخصية)/;
 lines.forEach((l,i)=>{const s=(lab.test(l)?l+' '+(lines[i+1]||''):'');const pool=s?[s]:[];pool.push(l);
  for(const p of pool){const z=p.replace(/(\d)\s+(?=\d)/g,'$1');for(const m of z.matchAll(/(?<!\d)\d{9}(?!\d)/g))cand.push({v:m[0],lab:!!s})}});
 const good=cand.find(c=>c.lab&&idValid(c.v))||cand.find(c=>idValid(c.v));
 if(good){out.idNo=good.v;out.idOk=true}else if(cand.length){out.idNo=(cand.find(c=>c.lab)||cand[0]).v;out.warnings.push('رقم الهوية المقروء لا يطابق خانة التحقق — راجعه مع البطاقة')}
 else out.warnings.push('لم يُقرأ رقم الهوية بوضوح');
 // الاسم
 const P=out.parts;
 P.full=arOnly(after(lines,LBL.full));P.first=arOnly(after(lines,LBL.first));P.father=arOnly(after(lines,LBL.father));P.grand=arOnly(after(lines,LBL.grand));P.family=arOnly(after(lines,LBL.family));
 const one=s=>s.split(' ').slice(0,3).join(' ');
 if(P.full&&P.full.split(' ').length>=3)out.name=P.full;
 else{const parts=[one(P.first),one(P.father),one(P.grand),one(P.family)].filter(Boolean);if(parts.length>=2)out.name=parts.join(' ')}
 if(!out.name)out.warnings.push('لم يُقرأ الاسم بوضوح — اكتبه كما في البطاقة');
 else if(out.name.split(' ').length<4)out.warnings.push('الاسم المقروء أقل من رباعي — أكمله من البطاقة');
 out.dob=parseDate(after(lines,LBL.dob));
 if(!out.dob){const ds=lines.map(parseDate).filter(Boolean);if(ds.length)out.dob=ds.sort()[0]} // أقدم تاريخ في البطاقة غالباً هو الميلاد
 out.pob=arOnly(after(lines,LBL.pob));out.residence=arOnly(after(lines,LBL.res));
 const sx=after(lines,LBL.sex);out.sex=/أنثى|انثى/.test(sx)?'أنثى':/ذكر/.test(sx)?'ذكر':'';
 return out}
if(typeof window!=='undefined'){window.MQ_idParse=parse;window.MQ_idValid=idValid}
if(typeof module!=='undefined')module.exports={parse,idValid};

/* ── واجهة: زر «من صورة الهوية» في نموذج الموكل ── */
if(typeof document==='undefined')return;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inject(){const f=document.getElementById('fClient');if(!f||f.querySelector('.idc-bar'))return;
 f.insertAdjacentHTML('afterbegin',`<div class="idc-bar wide"><div><b>من صورة الهوية</b><span>صوّر البطاقة أو اختر صورتها، فيقرأها المسبار على هذا الجهاز ويملأ الحقول لتراجعها. لا تُرسل الصورة لأي جهة.</span></div>
  <label class="btn sm idc-btn">📷 قراءة الهوية<input type="file" id="idcFile" accept="image/*,.pdf" capture="environment" hidden></label></div><div class="idc-msg wide" id="idcMsg" hidden></div>`);
 f.querySelector('#idcFile').addEventListener('change',ev=>{const fl=ev.target.files&&ev.target.files[0];ev.target.value='';if(fl)read(f,fl)})}
async function read(f,file){const msg=document.getElementById('idcMsg');const say=(h,cls)=>{msg.hidden=false;msg.className='idc-msg wide '+(cls||'');msg.innerHTML=h};
 if(!window.MQ_extract)return say('قارئ الصور غير محمّل في هذه الصفحة.','bad');
 const ext=(file.type==='application/pdf'||/\.pdf$/i.test(file.name))?'pdf':'jpg';const url=URL.createObjectURL(file);
 say('<span class="idc-spin"></span> جارٍ قراءة البطاقة على هذا الجهاز… (أول مرة قد تستغرق نصف دقيقة)');
 try{const r=await MQ_extract(url,ext);const p=parse(r&&r.text||'');fill(f,p,say)}
 catch(er){say('تعذّرت قراءة الصورة: '+e(er.message||er)+' — جرّب صورة أوضح وبإضاءة جيدة، دون انعكاس.','bad')}
 finally{URL.revokeObjectURL(url)}}
function fill(f,p,say){const set=(id,v)=>{const el=f[id];if(!el||!v)return 0;el.value=v;el.classList.add('idc-hit');el.dispatchEvent(new Event('input',{bubbles:true}));return 1};
 let n=0;n+=set('cN',p.name);n+=set('cId',p.idNo);
 if(p.residence){n+=set('cCity',p.residence.split(' ').slice(0,2).join(' '))}
 f.dataset.dob=p.dob||'';f.dataset.pob=p.pob||'';
 const rows=[['الاسم',p.name],['رقم الهوية',p.idNo&&(p.idNo+(p.idOk?' ✓':' ⚠'))],['تاريخ الميلاد',p.dob],['مكان الميلاد',p.pob],['مكان الإقامة',p.residence],['الجنس',p.sex]].filter(r=>r[1]);
 if(!n)return say('لم أستطع استخراج بيانات من الصورة. جرّب صورة أقرب للبطاقة، مستقيمة وواضحة.','bad');
 say(`<b>قُرئت البطاقة — راجع الحقول المظللة قبل الحفظ</b><dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${e(r[1])}</dd>`).join('')}</dl>${p.warnings.length?'<ul>'+p.warnings.map(w=>'<li>'+e(w)+'</li>').join('')+'</ul>':''}`,p.warnings.length?'warn':'ok')}
/* تاريخ ومكان الميلاد يُحفظان مع الموكل عند الحفظ */
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fClient'||!f.dataset.dob&&!f.dataset.pob)return;const dob=f.dataset.dob,pob=f.dataset.pob,id=f.dataset.id,n0=typeof clients!=='undefined'?clients.length:0;
 setTimeout(()=>{if(typeof clients==='undefined'||document.getElementById('fClient'))return; // النموذج ما زال مفتوحاً = لم يُحفظ
  const c=id?clients.find(x=>x.id===id):clients.length>n0?clients[clients.length-1]:null;if(!c)return;if(dob)c.dob=dob;if(pob)c.pob=pob;if(window.MQ&&MQ.saveState)MQ.saveState()},0)},true);
new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
const css=document.createElement('style');css.textContent=`
.idc-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:1px dashed #C9A24A;border-radius:12px;background:linear-gradient(135deg,#FBF6EA,#F3E7C9)}
.idc-bar b{display:block;color:#0B1B2B}.idc-bar span{font-size:12.5px;color:#6B5E44}
.idc-btn{cursor:pointer;white-space:nowrap;background:#0B1B2B;color:#F3D58A;border-color:#0B1B2B}
.idc-msg{padding:10px 14px;border-radius:12px;background:#F4F1EA;font-size:13.5px;line-height:1.8}
.idc-msg.ok{background:#EAF5EE;border:1px solid #9BC9AA}.idc-msg.warn{background:#FFF6E0;border:1px solid #E8C979}.idc-msg.bad{background:#FDECEC;border:1px solid #E7A3A3}
.idc-msg dl{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:6px 0}.idc-msg dt{color:#6B5E44}.idc-msg dd{margin:0;font-weight:700}
.idc-msg ul{margin:4px 0 0;padding-inline-start:18px;color:#8A5A00}
.field.idc-hit{background:#FFF6D6!important;border-color:#C9A24A!important}
.idc-spin{display:inline-block;width:14px;height:14px;border:2px solid #C9A24A;border-top-color:transparent;border-radius:50%;animation:idcs .8s linear infinite;vertical-align:-2px}
@keyframes idcs{to{transform:rotate(360deg)}}
html.night .idc-bar{background:#1E2A3C;border-color:#5C4E2E}html.night .idc-bar b{color:#F2E6C4}html.night .idc-msg{background:#1E2A3C}`;
document.head.appendChild(css);
})();
