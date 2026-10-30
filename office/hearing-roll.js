/* ── رول الجلسات اليومي ──
   جلسات يوم واحد مجمّعة حسب المحكمة ومرتبة بالساعة، كما يأخذها المحامي أو المتدرب صباحاً: رقم الدعوى والأطراف والغاية والمرحلة،
   وما جرى في الجلسة السابقة، وما يلزم إحضاره، وحضور الموكل. يُطبع A4، ومن كل سطر: «سجّل ما جرى» (محضر الجلسة بنقرة، ومنه الجلسة القادمة)
   و«التحضير». الافتراضي: جلسات الغد بعد الظهر، وجلسات اليوم قبله. */
(function(){
'use strict';
if(typeof V==='undefined'||typeof A==='undefined')return;
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null};
const dm=s=>{const d=parse(s);return d?DAYS[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear():''};
const HS=()=>typeof hearings!=='undefined'?hearings:[];
const defDay=()=>{const n=new Date();if(n.getHours()>=13)n.setDate(n.getDate()+1);return isoOf(n)};
const shift=(s,n)=>{const d=parse(s)||new Date();d.setDate(d.getDate()+n);return isoOf(d)};
/* الجلسة السابقة في القضية نفسها (لمعرفة ما جرى فيها) */
const prevOf=hh=>HS().filter(x=>x.k===hh.k&&x.date<hh.date).sort((a,b)=>b.date.localeCompare(a.date))[0];
const lastText=p=>!p?'':p.report?((p.report.summary||'')||({adj:'تأجيل',wit:'سماع شهود',pl:'تبادل لوائح',arg:'مرافعة',rsv:'حجز للحكم',dec:'صدور قرار'}[p.report.kind]||'')):(p.result||'');
function rows(day){
 return HS().filter(x=>x.date===day).map(x=>{const k=typeof K==='function'?K(x.k):null;if(!k)return null;const ct=typeof CT==='function'?CT(k.court):null,c=typeof C==='function'?C(k.client):null,p=prevOf(x);
  const asks=p&&p.report&&p.report.asks?p.report.asks:'';
  return {x,k,court:(ct&&ct.name)||'محكمة غير محددة',client:(c&&c.name)||'',opp:typeof oppNames==='function'?oppNames(k):'',prev:p,last:lastText(p),asks,done:!!x.report}}).filter(Boolean)
  .sort((a,b)=>a.court.localeCompare(b.court,'ar')||String(a.x.time||'').localeCompare(String(b.x.time||'')))}
function group(R){const g=new Map();for(const r of R){if(!g.has(r.court))g.set(r.court,[]);g.get(r.court).push(r)}return [...g]}
function table(R,ui){return group(R).map(([court,list])=>`<section class="rl-ct"><h3><i>⚖</i>${h(court)} <small>${list.length} ${list.length===1?'جلسة':'جلسات'}</small></h3>
 <table class="rl-t"><thead><tr><th>الساعة</th><th>الدعوى</th><th>الموكل وصفته</th><th>الخصم</th><th>غاية الجلسة</th><th>في الجلسة السابقة</th><th>يلزم</th>${ui?'<th></th>':'<th>ما جرى / الجلسة القادمة</th>'}</tr></thead><tbody>
 ${list.map(r=>`<tr class="${r.done?'done':''}"><td class="mono">${h(r.x.time||'—')}</td><td><b class="mono">${h(r.k.no||'')}</b><small>${h(r.k.stage||'')}</small></td><td>${h(r.client)}<small>${h(r.k.role||'')}</small></td><td>${h(r.opp)}</td><td>${h(r.x.purpose||'')}${r.x.attend?'<em class="rl-at">حضور الموكل مطلوب</em>':''}</td><td>${r.prev?`<small class="mono">${h(r.prev.date)}</small> ${h(r.last||'لم يُسجَّل ما جرى')}`:'<small>أول جلسة</small>'}</td><td>${h(r.asks)}</td>
 ${ui?`<td class="rl-act">${r.done?'<span class="pill ok">سُجّل</span>':''}<button type="button" class="btn sm ${r.done?'':'pri'}" data-act="hrOpen" data-v="${h(r.x.id)}">${r.done?'تعديل المحضر':'سجّل ما جرى'}</button>${typeof A.hpOpen==='function'?`<button type="button" class="btn sm" data-act="rlPrep" data-v="${h(r.k.id)}|${h(r.x.id)}">التحضير</button>`:''}<button type="button" class="btn sm" data-act="rlCase" data-v="${h(r.k.id)}">الملف</button></td>`:'<td class="rl-blank"></td>'}</tr>`).join('')}
 </tbody></table></section>`).join('')}
V.roll=()=>{const day=S.rollDay||(S.rollDay=defDay()),R=rows(day),cal=window.MQ_CAL?MQ_CAL.check(day):null;
 const near=[...new Set(HS().filter(x=>x.date>day).map(x=>x.date))].sort().slice(0,1)[0];
 return `<div class="head"><div><h1>رول الجلسات</h1><p class="sub">جلسات يوم واحد حسب المحكمة والساعة — للطباعة صباحاً وتسجيل ما جرى من مكانها</p></div>
 <div class="rl-nav"><button class="btn sm" data-act="rlDay" data-v="-1">‹ اليوم السابق</button><input type="date" class="field" id="rlD" value="${h(day)}"><button class="btn sm" data-act="rlDay" data-v="1">اليوم التالي ›</button><button class="btn sm" data-act="rlToday">اليوم</button><button class="btn pri" data-act="rlPrint" ${R.length?'':'disabled'}>🖨 طباعة الرول</button></div></div>
 <div class="rl-sum"><b>${h(dm(day))}</b><span>${R.length} ${R.length===1?'جلسة':'جلسات'} في ${group(R).length} ${group(R).length===1?'محكمة':'محاكم'}</span>${R.filter(r=>r.x.attend).length?`<span class="rl-at">${R.filter(r=>r.x.attend).length} تتطلب حضور الموكل</span>`:''}${R.filter(r=>!r.done&&day<=isoOf(new Date())).length&&day<isoOf(new Date())?`<span class="rl-due">${R.filter(r=>!r.done).length} بلا محضر</span>`:''}${cal&&(cal.off||cal.recess)?`<span class="rl-due">⚠ ${h(cal.holiday||('راحة '+cal.weekly)||cal.recess)}</span>`:''}</div>
 ${R.length?table(R,true):`<section class="panel"><div class="bd"><p>لا جلسات مسجّلة في هذا اليوم.</p>${near?`<button class="btn sm" data-act="rlGo" data-v="${h(near)}">أقرب يوم فيه جلسات: ${h(dm(near))}</button>`:''}</div></section>`}`};
const go=d=>{S.rollDay=d;S.view='roll';render()};
A.rlDay=v=>go(shift(S.rollDay||defDay(),Number(v)));A.rlToday=()=>go(isoOf(new Date()));A.rlGo=v=>go(v);A.roll=()=>go(S.rollDay||defDay());
A.rlCase=v=>{S.caseId=v;S.view='case';render()};
A.rlPrep=v=>{const [kid]=String(v).split('|');S.caseId=kid;try{A.hpOpen()}catch(e){S.view='case';render()}};
document.addEventListener('change',e=>{if(e.target&&e.target.id==='rlD'&&e.target.value)go(e.target.value)});
A.rlPrint=()=>{const day=S.rollDay||defDay(),R=rows(day);if(!R.length)return;
 const html=`<div class="rl-print"><p><b>${h(typeof OFFICE!=='undefined'?OFFICE.name||'':'')}</b> — رول جلسات ${h(dm(day))} · ${R.length} جلسة</p>${table(R,false)}<p class="rl-foot">المحامي الحاضر: ………………… &nbsp;&nbsp; التوقيع: …………</p></div>`;
 if(window.MQP&&MQP.open)MQP.open({label:'رول الجلسات',build(){return {title:'رول الجلسات',sub:dm(day),file:'roll-'+day,blocks:[{html}]}}});
 else{const w=window.open('','_blank');if(w){w.document.write(`<html dir="rtl" lang="ar"><meta charset="utf-8"><title>رول الجلسات ${day}</title><style>${CSS}</style><body>${html}<script>print()<\/script></body></html>`);w.document.close()}}};
/* زر الرول في شاشة الجلسات والمهل وفي الرئيسية */
const va=V.agenda;if(va){V.agenda=function(){return `<div class="rl-bar"><button class="btn pri" data-act="roll">📋 رول الجلسات اليومي</button><span class="m">جلسات يوم واحد حسب المحكمة، للطباعة وتسجيل ما جرى</span></div>`+va.apply(this,arguments)};if(va._grp)V.agenda._grp=1}
const CSS=`.rl-nav{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.rl-nav .field{max-width:170px}
.rl-sum{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:4px 0 14px;padding:10px 14px;border-radius:12px;background:#0F2A44;color:#E8EEF4}.rl-sum b{color:#F3D58A;font-size:16px}.rl-sum span{font-size:13px}
.rl-at{display:inline-block;background:#FFF4E5;color:#7A4A07;border-radius:99px;padding:1px 8px;font-size:11.5px;font-style:normal;margin-inline-start:4px}.rl-due{background:#FCEDEA;color:#9E3B2E;border-radius:99px;padding:1px 10px}
.rl-ct{background:#fff;border:1px solid #E4D3A6;border-radius:14px;margin-bottom:14px;overflow:hidden}.rl-ct h3{margin:0;padding:10px 14px;background:#FBF6EA;border-bottom:1px solid #E4D3A6;font-size:15px;display:flex;gap:8px;align-items:center}.rl-ct h3 i{font-style:normal;color:#A07A28}.rl-ct h3 small{font-weight:400;color:#7A6A45}
.rl-t{width:100%;border-collapse:collapse;font-size:13px}.rl-t th{text-align:start;padding:7px 10px;color:#7A6A45;font-weight:600;font-size:12px;border-bottom:1px solid #EFE3C6}.rl-t td{padding:9px 10px;border-bottom:1px solid #F3EBD8;vertical-align:top;line-height:1.6}.rl-t td small{display:block;color:#7A8592;font-size:11.5px}.rl-t tr.done{background:#F2FAF5}
.rl-act{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}.rl-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:12px}
.rl-print .rl-ct{break-inside:avoid;border:1px solid #999}.rl-print .rl-t td,.rl-print .rl-t th{border:1px solid #bbb;font-size:11.5px;padding:5px}.rl-blank{min-width:150px}.rl-foot{margin-top:18px}
@media(max-width:900px){.rl-t thead{display:none}.rl-t tr{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;padding:8px 0;border-bottom:1px solid #EFE3C6}.rl-t td{border:0;padding:2px 10px}.rl-act{grid-column:1/-1;justify-content:flex-start}}`;
const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
})();
