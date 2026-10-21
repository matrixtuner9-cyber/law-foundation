/* ── موكل جديد وقضيته في مسار واحد، بلا تكرار ولا تضارب ──
   1) استقبال الموكل (النموذج الكامل بفحص التضارب) ثم فتح ملف قضيته مباشرة، مع نقل الطرف الآخر والموضوع
   2) نموذج القضية: لا «موكل سريع» بلا فحص؛ إضافة الموكل الجديد تمر بالاستقبال الكامل
   3) قبل الحفظ: رقم دعوى مكرر في المحكمة نفسها، أو مسجّل لموكل آخر، أو خصم هو موكل لدينا (تضارب) → تنبيه وتأكيد
   4) الجلسة الأولى تُسجَّل مع القضية في الخطوة نفسها، ثم يُفتح ملف القضية الموحّد */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nz=s=>String(s||'').normalize('NFKC').replace(/[ً-ْـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();
const normNo=s=>String(s||'').replace(/\s+/g,'').replace(/[\\]/g,'/');

/* فحص قبل حفظ القضية (دالة نقية قابلة للاختبار) */
function caseChecks({no,court,client,opponent},data){
 const out=[],n=normNo(no);
 if(n&&!/قيد/.test(n)){
  for(const k of data.cases||[]){if(normNo(k.no)!==n)continue;
   if(k.court===court&&k.client===client)out.push({level:'bad',text:'القضية رقم '+k.no+' في المحكمة نفسها مسجّلة لهذا الموكل مسبقاً. افتحها بدل إنشاء نسخة ثانية.',caseId:k.id});
   else if(k.court===court)out.push({level:'bad',text:'رقم الدعوى '+k.no+' في المحكمة نفسها مسجّل لموكل آخر: '+(((data.clients||[]).find(c=>c.id===k.client)||{}).name||''),caseId:k.id});
   else out.push({level:'warn',text:'رقم الدعوى '+k.no+' مستخدم في محكمة أخرى؛ تأكد من المحكمة.',caseId:k.id})}}
 const on=nz(opponent);
 if(on.length>=3)for(const c of data.clients||[]){if(c.id!==client&&nz(c.name)===on)out.push({level:'bad',text:'الخصم «'+opponent+'» موكل لدى المكتب: تضارب مصالح محتمل. راجِعه قبل فتح الملف.'})}
 return out;
}
if(typeof module!=='undefined'&&module.exports){module.exports={caseChecks};return}

const can=()=>!!(window.MQ?(MQ.user&&['admin','lawyer'].includes(MQ.user.role)&&!MQ.readOnly):true);
const W={chain:null,ack:false,pending:null};

/* (1) خانة «فتح ملف قضية بعد الحفظ» في استقبال الموكل */
const nc0=A.newClient;
A.newClient=(...a)=>{nc0&&nc0(...a);const f=document.getElementById('fClient');if(!f||f.dataset.id)return;
 const btn=f.querySelector('button.btn.pri');if(btn&&!document.getElementById('cThenCase'))btn.insertAdjacentHTML('beforebegin','<label class="ck wide" style="color:inherit"><input type="checkbox" id="cThenCase" checked> فتح ملف قضية لهذا الموكل مباشرة بعد الحفظ (أزل العلامة إن كانت استشارة بلا قضية)</label>')};
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fClient'||f.dataset.id)return;
 const go=document.getElementById('cThenCase');W.chain=go&&go.checked?{before:new Set(clients.map(c=>c.id)),other:(f.cO&&f.cO.value||'').trim(),matter:(f.cM&&f.cM.value||'').trim()}:null;
 if(W.chain)setTimeout(()=>{const ch=W.chain;W.chain=null;const c=clients.find(x=>!ch.before.has(x.id));if(!c)return;A.caseFor(c.id,{other:ch.other,matter:ch.matter,fromIntake:true})},0)},true);

/* (2) نموذج القضية */
const om=window.openModal;
window.openModal=(...a)=>{om(...a);const f=document.getElementById('fCase');if(!f)return;
 const sel=f.ncC;if(sel){const o=sel.querySelector('option[value="new"]');if(o)o.textContent='+ موكل جديد (استقبال كامل بفحص التضارب)…'}
 for(const id of ['ncN','ncPh']){const x=document.getElementById(id);if(x)x.closest('label').hidden=true}
 const btn=f.querySelector('button.btn.pri');
 btn.insertAdjacentHTML('beforebegin',`<fieldset class="wide cw-h"><legend>الجلسة الأولى (اختياري)</legend><label>التاريخ<input class="field" type="date" id="ncHd"></label><label>الساعة<input class="field" type="time" id="ncHt" value="09:00"></label><label class="wide">الغرض<input class="field" id="ncHp" placeholder="مثال: الجلسة الأولى / تبادل اللوائح"></label></fieldset><div class="wide" id="cwChk"></div>`);
 W.ack=false;
 const draw=()=>{const box=document.getElementById('cwChk');if(!box)return;const r=caseChecks({no:f.ncNo.value,court:f.ncCt.value,client:f.ncC.value,opponent:f.ncO.value},{cases,clients});
  box.innerHTML=r.length?`<div class="ck-box ${r.some(x=>x.level==='bad')?'bad':'warn'}"><b>قبل الحفظ</b><ul>${r.map(x=>`<li>${e(x.text)}${x.caseId?` <button type="button" class="link" data-act="openCase" data-v="${e(x.caseId)}">فتح القضية</button>`:''}</li>`).join('')}</ul>${r.some(x=>x.level==='bad')?'<label class="ck" style="color:inherit;margin-top:6px"><input type="checkbox" id="cwAck"> راجعتُ ذلك وأريد فتح الملف رغم التنبيه</label>':''}</div>`:''};
 ['ncNo','ncCt','ncC','ncO'].forEach(id=>{const x=document.getElementById(id);if(x){x.addEventListener('input',draw);x.addEventListener('change',draw)}});
 sel&&sel.addEventListener('change',()=>{if(sel.value==='new'){A.close();A.newClient()}});
 draw()};

/* فتح قضية لموكل محدد، مع نقل بيانات الاستقبال */
const cf0=A.caseFor;
A.caseFor=(v,o={})=>{cf0(v);const f=document.getElementById('fCase');if(!f)return;const c=C(v);
 if(o.other&&f.ncO&&!f.ncO.value)f.ncO.value=o.other;
 if(o.matter&&f.ncS&&!f.ncS.value)f.ncS.value=o.matter.slice(0,140);
 f.ncC.dispatchEvent(new Event('change'));
 const h=f.closest('.modal').querySelector('.head h1');if(h)h.textContent=(o.fromIntake?'الخطوة 2: ':'')+'ملف قضية للموكل '+(c?c.name:'');
 if(o.fromIntake){f.insertAdjacentHTML('afterbegin',`<div class="wide cw-steps"><span>✓ حُفظ الموكل${c&&c.portal?' وفُعّلت بوابته':''}</span>${c&&c.portal?`<button type="button" class="btn sm" data-act="waInvite" data-v="${e(c.id)}">رابط البوابة عبر واتساب</button>`:''}<button type="button" class="btn sm" data-act="printIntake" data-v="${e(v)}">طباعة نموذج الاستقبال</button><button type="button" class="btn sm" data-act="cwSkip" data-v="${e(v)}">تخطي: استشارة بلا قضية</button></div>`)}
};
A.cwSkip=v=>{A.close();A.openClient?A.openClient(v):A.bag(v)};

/* (3) التحقق قبل الحفظ، و(4) الجلسة الأولى بعده */
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fCase')return;
 if(f.ncC.value==='new'){ev.preventDefault();ev.stopImmediatePropagation();A.close();A.newClient();return}
 const r=caseChecks({no:f.ncNo.value,court:f.ncCt.value,client:f.ncC.value,opponent:f.ncO.value},{cases,clients});
 if(r.some(x=>x.level==='bad')&&!document.getElementById('cwAck')?.checked){ev.preventDefault();ev.stopImmediatePropagation();toast('راجِع التنبيه قبل فتح الملف');document.getElementById('cwChk')?.scrollIntoView({block:'center'});return}
 W.pending={n:cases.length,hd:(document.getElementById('ncHd')||{}).value||'',ht:(document.getElementById('ncHt')||{}).value||'',hp:((document.getElementById('ncHp')||{}).value||'').trim()};
},true);
document.addEventListener('submit',ev=>{if(ev.target.id!=='fCase'||!W.pending)return;const p=W.pending;W.pending=null;
 if(cases.length<=p.n)return;const k=cases[cases.length-1];
 if(p.hd){hearings.push({id:'h'+Date.now(),k:k.id,date:p.hd,time:p.ht||'09:00',purpose:p.hp||'الجلسة الأولى',attend:false,mz:false});if(window.MQ&&MQ.saveState)MQ.saveState();render()}});

const css=document.createElement('style');css.textContent='.cw-h{border:1px solid var(--line);border-radius:10px;padding:8px 12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.cw-h legend{font-size:13px;color:var(--muted);padding:0 6px}.cw-h .wide{grid-column:1/-1}.cw-steps{display:flex;flex-wrap:wrap;gap:8px;align-items:center;border:1px solid #22C55E;background:#F0FDF4;border-radius:10px;padding:8px 12px}.cw-steps span{font-weight:600;color:#166534;margin-inline-end:auto}';document.head.appendChild(css);
})();
