/* ── استقبال موكل جديد + تحصين البوابة + لوحات النسخ الاحتياطي ووصول الدعم ──
   - نموذج «موكل جديد» مستقل: بيانات كاملة، فحص تضارب مصالح يُحفظ مع الموكل، ثم خطوات تالية (فتح قضية، رابط البوابة، طباعة نموذج الاستقبال)
   - تعديل بيانات الموكل
   - رمز دخول البوابة قوي (يولّده الخادم ويتحقق من تفرده)، مع «تجديد الرمز» عند الشك بتسريبه
   - في الإعدادات: حالة النسخ الاحتياطي، تجديد الرموز الضعيفة، وإذن الدعم الفني المؤقت (السحابة) */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STRONG=/^MQ-[A-HJ-NP-Z2-9]{10}$/;
const isWeak=c=>!STRONG.test(String(c&&c.code||''));
window.MQ_isWeak=isWeak;
/* رمز قوي من المتصفح (الخادم يعتمده إن كان فريداً، وإلا يولّد غيره) */
window.MQ_code=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=new Uint8Array(10);crypto.getRandomValues(b);return 'MQ-'+[...b].map(x=>A[x&31]).join('')};
/* صلاحيات وطلبات خاصة بهذا الملف (admin.js معزول في نطاقه). الخادم يتحقق من الصلاحية في كل الأحوال */
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const ro=()=>{if(window.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const call=(url,body)=>fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body||{})}).then(async r=>{if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر التنفيذ');return j});

const css=document.createElement('style');css.textContent=`
.save-bar{position:fixed;inset-inline:0;top:0;z-index:400;padding:9px 16px;text-align:center;font:600 13.5px Cairo,sans-serif;color:#111B27;background:#FEF3C7;border-bottom:1px solid #F59E0B}
.save-bar.bad{background:#FEE2E2;border-color:#EF4444}
.ck-box{border:1px solid var(--line,#E5D8C3);border-radius:10px;padding:10px 12px;font-size:13.5px;line-height:1.7}
.ck-box.ok{border-color:#22C55E;background:#F0FDF4}.ck-box.warn{border-color:#F59E0B;background:#FFFBEB}.ck-box.bad{border-color:#EF4444;background:#FEF2F2}
.ck-box ul{margin:4px 0 0;padding-inline-start:18px}
.weak-code{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#92400E;background:#FEF3C7;border:1px solid #F59E0B;border-radius:999px;padding:2px 10px}
.next-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:12px}
.next-steps .btn{justify-content:center;min-height:44px}
.form .rq{color:#EF4444;font-weight:700}
.st-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
`;document.head.appendChild(css);

/* ── فحص تضارب المصالح: يطابق الاسم والطرف الآخر مع الموكلين والخصوم ووكلائهم ── */
const nz=s=>String(s||'').normalize('NFKC').replace(/[ً-ْـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();
const toks=s=>nz(s).split(' ').filter(t=>t.length>1);
function match(q,name){const p=toks(q),n=nz(name);if(!p.length||!n)return 0;const hit=p.filter(t=>n.includes(t)).length;if(hit===p.length&&p.length>=2)return 2;return hit>=2?1:0}
function runCheck(f,selfId){
 const name=f.cN.value.trim(),other=f.cO.value.trim(),idNo=f.cId.value.trim(),ph=f.cPh.value.replace(/\D/g,'');
 const m=[];let strong=false;
 if(name.length>=3){
  opponents.forEach(o=>{const s=match(name,o.name);if(s){const ks=cases.filter(k=>(k.opps||[]).includes(o.id));m.push({t:(s===2?'الاسم مطابق لخصم':'تشابه مع خصم')+': '+o.name+(ks.length?' (في '+ks.map(k=>k.no).join('، ')+' ضد '+[...new Set(ks.map(k=>(C(k.client)||{}).name))].join('، ')+')':''),s});if(s===2)strong=true}});
  clients.forEach(c=>{if(c.id===selfId)return;const s=match(name,c.name);if(s)m.push({t:'موكل مسجّل باسم مشابه: '+c.name+' (قد يكون مكرراً)',s:1})});
 }
 if(other.length>=3)clients.forEach(c=>{if(c.id===selfId)return;const s=match(other,c.name);if(s){m.push({t:'الطرف الآخر «'+other+'» يطابق موكلاً لدينا: '+c.name,s});if(s===2)strong=true}});
 if(other.length>=3)opponents.forEach(o=>{if(match(other,o.lawyer||'')===2)m.push({t:'الطرف الآخر ممثَّل سابقاً بالمحامي '+o.lawyer,s:1})});
 if(idNo&&idNo!=='—')clients.forEach(c=>{if(c.id!==selfId&&String(c.idNo||'').replace(/\s/g,'')===idNo.replace(/\s/g,''))m.push({t:'رقم الهوية مسجّل لموكل آخر: '+c.name,s:1})});
 if(ph.length>=7)clients.forEach(c=>{if(c.id!==selfId&&String(c.phone||'').replace(/\D/g,'').endsWith(ph.slice(-9)))m.push({t:'رقم الهاتف مسجّل لموكل آخر: '+c.name,s:1})});
 return {result:m.length?'match':'clear',strong,matches:m.map(x=>x.t),other};
}
function drawCheck(f,selfId){
 const r=runCheck(f,selfId),box=document.getElementById('cfBox'),ack=document.getElementById('cfAck');
 if(!box)return r;
 if(f.cN.value.trim().length<3){box.className='ck-box';box.innerHTML='يبدأ فحص تضارب المصالح تلقائياً عند كتابة الاسم.';ack.hidden=true;return r}
 box.className='ck-box '+(r.result==='clear'?'ok':r.strong?'bad':'warn');
 box.innerHTML=r.result==='clear'?'<b>لا تضارب:</b> لا تطابق مع أي خصم أو موكل مسجّل.':`<b>${r.strong?'تضارب محتمل — راجِع قبل قبول التوكيل':'تطابق جزئي — راجِع الأسماء'}</b><ul>${r.matches.map(t=>'<li>'+e(t)+'</li>').join('')}</ul>`;
 ack.hidden=r.result==='clear';const cb=document.getElementById('cfAckC');if(cb)cb.required=r.strong;
 return r;
}

/* ── نموذج الموكل (جديد أو تعديل) ── */
function clientForm(c){
 const v=k=>e(c?c[k]??'':'');const sel=(id,opts,cur)=>`<select class="field" id="${id}">${opts.map(o=>`<option ${o===cur?'selected':''}>${o}</option>`).join('')}</select>`;
 return `<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="${c?'تعديل بيانات الموكل':'موكل جديد'}"><div class="head"><h1 style="font-size:24px">${c?'تعديل بيانات الموكل':'استقبال موكل جديد'}</h1><button class="btn sm" data-act="close" type="button">إغلاق</button></div>
 <form class="form" id="fClient" data-id="${c?e(c.id):''}" novalidate>
  <label class="wide">الاسم الكامل (أو اسم الشركة) <span class="rq">*</span><input class="field" id="cN" required minlength="3" value="${v('name')}" placeholder="الاسم الرباعي كما في الهوية" autocomplete="off"></label>
  <label>الصفة${sel('cT',['فرد','شركة','مؤسسة','جهة حكومية','جمعية'],c?c.type:'فرد')}</label>
  <label>رقم الهوية / التسجيل<input class="field mono" id="cId" dir="ltr" value="${c&&c.idNo!=='—'?v('idNo'):''}" inputmode="numeric"></label>
  <label>الهاتف <span class="rq">*</span><input class="field mono" id="cPh" dir="ltr" required value="${c&&c.phone!=='—'?v('phone'):''}" placeholder="0599-000-000" inputmode="tel"></label>
  <label>واتساب (إن اختلف)<input class="field mono" id="cWa" dir="ltr" value="${v('whatsapp')}" inputmode="tel"></label>
  <label>البريد الإلكتروني<input class="field" id="cEm" dir="ltr" type="email" value="${v('email')}"></label>
  <label>المدينة<input class="field" id="cCity" value="${c?v('city'):e(OFFICE.city)}"></label>
  <label class="wide">العنوان<input class="field" id="cAd" value="${v('address')}"></label>
  <label>قناة التواصل المفضلة${sel('cCh',['واتساب','البوابة','هاتف','البريد الإلكتروني'],c?c.ch:'واتساب')}</label>
  <label>مصدر الإحالة<input class="field" id="cSrc" value="${v('source')}" placeholder="موكل سابق، معرفة، إعلان…"></label>
  ${c?'':`<label>الأتعاب المتفق عليها ₪<input class="field" id="cFee" type="number" min="0" step="1" value=""></label><label>الدفعة المقدمة ₪<input class="field" id="cPaid" type="number" min="0" step="1" value=""></label>`}
  <label class="wide">موضوع الاستشارة أو النزاع<textarea class="field" id="cM" rows="2">${v('matter')}</textarea></label>
  <label class="wide">الطرف الآخر المتوقع (لفحص التضارب)<input class="field" id="cO" value="${c&&c.conflict?e(c.conflict.other||''):''}" placeholder="اسم الخصم المحتمل إن وُجد"></label>
  <div class="wide"><div id="cfBox" class="ck-box">يبدأ فحص تضارب المصالح تلقائياً عند كتابة الاسم.</div>
   <div id="cfAck" hidden style="margin-top:8px"><label class="ck" style="color:inherit"><input type="checkbox" id="cfAckC"> راجعتُ التطابق، وأقبل التوكيل لعدم وجود تضارب فعلي</label><input class="field" id="cfNote" placeholder="سبب القبول (يُحفظ في سجل الموكل)" style="margin-top:6px"></div></div>
  ${c?'':`<label class="ck wide" style="color:inherit"><input type="checkbox" id="cPortal" checked> تفعيل بوابة الموكل وإصدار رمز دخول خاص به</label>`}
  <p class="note wide" id="cErr" hidden style="color:#991B1B"></p>
  <button class="btn pri">${c?'حفظ التعديلات':'حفظ الموكل'}</button></form></div></div>`;
}
function openForm(c){
 document.getElementById('modal').innerHTML=clientForm(c);
 const f=document.getElementById('fClient');let t=null;
 const go=()=>{clearTimeout(t);t=setTimeout(()=>drawCheck(f,c&&c.id),250)};
 ['cN','cO','cId','cPh'].forEach(id=>f[id].addEventListener('input',go));
 if(c)drawCheck(f,c.id);
 f.cN.focus();
}
A.newClient=()=>{if(!ro())openForm(null)};
A.editClient=v=>{if(ro())return;const c=C(v||S.clientId);if(c)openForm(c)};

document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fClient')return;ev.preventDefault();ev.stopImmediatePropagation();if(ro())return;
 const err=m=>{const x=document.getElementById('cErr');x.textContent=m;x.hidden=false};
 const name=f.cN.value.trim().replace(/\s+/g,' '),phone=f.cPh.value.trim(),wa=f.cWa.value.trim(),email=f.cEm.value.trim();
 const okPh=v=>/^[+\d][\d\s-]{6,19}$/.test(v);
 if(name.length<3)return err('اكتب اسم الموكل كاملاً.');
 if(!okPh(phone))return err('رقم الهاتف غير صحيح: أرقام فقط، ويمكن أن يبدأ بـ +.');
 if(wa&&!okPh(wa))return err('رقم واتساب غير صحيح.');
 if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return err('البريد الإلكتروني غير صحيح.');
 const id=f.dataset.id,old=id?C(id):null;
 const chk=runCheck(f,id);
 if(chk.strong&&!document.getElementById('cfAckC').checked)return err('يوجد تضارب محتمل: راجِعه وأكّد القبول قبل الحفظ.');
 const conflict={result:chk.result,matches:chk.matches,other:chk.other,at:typeof nowStamp==='function'?nowStamp():new Date().toISOString().slice(0,16).replace('T',' '),by:(window.MQ&&MQ.user&&MQ.user.username)||'',note:(document.getElementById('cfNote')||{}).value||''};
 const data={name,type:f.cT.value,idNo:f.cId.value.trim()||'—',phone,whatsapp:wa,email,city:f.cCity.value.trim()||OFFICE.city,address:f.cAd.value.trim(),ch:f.cCh.value,source:f.cSrc.value.trim(),matter:f.cM.value.trim()};
 if(old){Object.assign(old,data);if(chk.other||chk.result!=='clear'||!old.conflict)old.conflict=conflict;A.close();render();toast('حُفظت بيانات '+name);return}
 const cid='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 const fee=Math.max(0,Math.round(+(f.cFee&&f.cFee.value)||0)),paid=Math.min(fee||Infinity,Math.max(0,Math.round(+(f.cPaid&&f.cPaid.value)||0)));
 const c={id:cid,...data,portal:!!(f.cPortal&&f.cPortal.checked),last:null,fee,paid:0,since:iso(TODAY),code:MQ_code(),by:conflict.by,conflict};
 clients.push(c);
 if(paid>0&&window.MQP&&MQP.addPayment){c.paid=paid;MQP.addPayment(c,paid,{note:'دفعة مقدمة عند الاستقبال'})}
 A.close();render();
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="تم استقبال الموكل"><div class="head"><h1 style="font-size:22px">تم استقبال ${e(name)}</h1><button class="btn sm" data-act="close" type="button">إغلاق</button></div>
  <p class="note" style="border:0;padding:0">${chk.result==='clear'?'فحص التضارب: لا تطابق.':'فحص التضارب: '+chk.matches.length+' تطابق، حُفظت المراجعة مع الموكل.'} ${c.portal?'البوابة مفعّلة برمز دخول خاص يصل الموكل عبر رابط واتساب.':''}</p>
  <div class="next-steps">
   <button class="btn pri" data-act="caseFor" data-v="${cid}">فتح قضية لهذا الموكل</button>
   ${c.portal?`<button class="btn wa-btn" data-act="waInvite" data-v="${cid}">إرسال رابط البوابة عبر واتساب</button>`:''}
   <button class="btn" data-act="printIntake" data-v="${cid}">طباعة نموذج الاستقبال</button>
   <button class="btn" data-act="openClient" data-v="${cid}">فتح ملف الموكل</button>
  </div></div></div>`;
});
A.caseFor=v=>{A.close();openModal();const s=document.getElementById('ncC');if(s){s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));const n=document.getElementById('ncN');if(n){n.closest('label').hidden=true}const ph=document.getElementById('ncPh');if(ph)ph.closest('label').hidden=true}};
A.printIntake=v=>{if(window.MQP&&MQP.D)MQP.open([MQP.D.intake(v),MQP.D.client(v)])};

/* ── تجديد رمز الدخول ── */
A.rotateCode=v=>{if(ro())return;const c=C(v||S.clientId);if(!c)return;
 if(!confirm('سيتوقف الرمز الحالي لـ '+c.name+' فوراً، ويحتاج الموكل رابط دخول جديداً. متابعة؟'))return;
 if(!(window.MQ&&MQ.online)){c.code=MQ_code();render();return toast('جُدّد الرمز')}
 call('/api/admin/client-code',{client:c.id}).then(j=>{const x=j.clients&&j.clients[0];if(x){c.code=x.code;c._v=x._v;if(MQ.saveState)MQ.saveState()}render();toast('جُدّد رمز الدخول. أرسل الرابط الجديد للموكل.')}).catch(x=>toast(x.message))};
A.rotateWeak=()=>{if(ro())return;const n=clients.filter(isWeak).length;if(!n)return toast('لا توجد رموز ضعيفة');
 if(!confirm('سيُجدَّد رمز '+n+' موكلاً دفعة واحدة، وتتوقف روابطهم القديمة فوراً. ستحتاج إرسال الروابط الجديدة لهم عبر واتساب. متابعة؟'))return;
 call('/api/admin/rotate-weak',{}).then(j=>{(j.clients||[]).forEach(x=>{const c=C(x.id);if(c){c.code=x.code;c._v=x._v}});render();toast('جُدّد '+j.n+' رمزاً')}).catch(x=>toast(x.message))};

/* ── لوحات الإعدادات ── */
const fmtT=ms=>{if(!ms)return '—';const d=new Date(ms),p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes())};
const mb=n=>n?(n/1048576).toFixed(n>10485760?0:1)+' م.ب':'—';
const ago=t=>{if(!t)return '';const h=Math.round((Date.now()-t)/3600e3);return h<1?'قبل أقل من ساعة':h<48?'قبل '+h+' ساعة':'قبل '+Math.round(h/24)+' أيام'};
const DESK=()=>window.mqDesktop||null;
function backupHtml(st){
 if(!st)return '<div class="note" style="border:0">جارٍ التحميل…</div>';
 const l=st.last||{},f=l.failed,x=st.lastExternal;
 const rows=(st.list||[]).slice(0,12).map(b=>`<tr><td>${e(b.at||b.id)}</td><td>${b.id.startsWith('pre-restore')?'<span class="pill warn">قبل استعادة</span>':/^manual|^export|^exit|^tray/.test(b.reason)?'يدوية':'تلقائية'}</td><td>${b.counts?b.counts.records+' سجلاً':''}</td><td>${mb(b.size)}</td><td>${b.integrity==='ok'?'<span class="pill ok">سليمة</span>':'<span class="pill bad">؟</span>'}</td><td><button class="btn sm" type="button" data-act="backupRestore" data-v="${e(b.id)}">استعادة</button></td></tr>`).join('');
 return `<dl class="kv"><dt>آخر نسخة</dt><dd>${l.ok?e(l.at)+' · '+mb(l.size)+' · '+(l.counts?l.counts.records+' سجلاً و'+l.counts.messages+' رسالة':''):'<span class="pill warn">لم تُؤخذ نسخة بعد</span>'}</dd>
  ${f?`<dt>آخر فشل</dt><dd style="color:#991B1B">${e(f.at)} · ${e(f.error)}</dd>`:''}
  <dt>آخر نسخة خارج الجهاز</dt><dd>${x?e(x.at)+' · '+ago(x.t)+' · <span class="mono" dir="ltr">'+e(x.dir)+'</span>':'<span class="pill warn">لم تُحفظ نسخة خارج الجهاز بعد</span>'}</dd>
  <dt>مجلد النسخ</dt><dd class="mono" dir="ltr" style="text-align:right">${e(st.dir)}</dd>
  <dt>النسخة الثانية التلقائية</dt><dd>${st.mirrorFromEnv?'<span class="mono" dir="ltr">'+e(st.mirror)+'</span>':`<span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><input class="field mono" id="bkMirror" dir="ltr" style="max-width:340px" placeholder="F:\\Misbar أو مجلد مزامنة سحابية" value="${e(st.mirror||'')}">${DESK()?'<button class="btn sm" type="button" data-act="backupPickMirror">اختيار…</button>':''}<button class="btn sm" type="button" data-act="backupSaveMirror">حفظ</button></span>`}${l.mirror&&!l.mirror.ok?' <span class="pill bad">فشلت آخر مرة</span>':''}</dd>
  <dt>الجدولة</dt><dd>نسخة تلقائية كل ${st.everyHours} ساعة، ويُحتفظ بآخر ${st.keep} نسخة</dd>
  <dt>التذكير</dt><dd><select class="field" id="bkRemind" style="width:auto">${[24,48,72,168].map(h=>`<option value="${h}"${h===st.remindHours?' selected':''}>كل ${h===168?'أسبوع':h+' ساعة'}</option>`).join('')}</select> <button class="btn sm" type="button" data-act="backupSaveRemind">حفظ</button> <span class="m">يذكّرك المسبار بحفظ نسخة خارج الجهاز إذا مرّت الفترة دون نسخة</span></dd></dl>
  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" data-act="backupExport">حفظ نسخة على قرص خارجي…</button><button class="btn" type="button" data-act="backupNow">نسخ احتياطي الآن</button>${DESK()?'<button class="btn" type="button" data-act="backupOpenDir">فتح مجلد النسخ</button>':''}</div>
  ${rows?`<h3 style="margin:16px 0 6px;font-size:15px">النسخ المحفوظة على هذا الجهاز</h3><div style="overflow:auto"><table class="tbl"><thead><tr><th>الوقت</th><th>النوع</th><th>السجلات</th><th>الحجم</th><th>الفحص</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="m" style="margin-top:6px">الاستعادة تعيد بيانات المكتب إلى وقت النسخة، وتحفظ قبلها نسخة «قبل استعادة» من الوضع الحالي فيمكن التراجع عنها.</p>`:''}`;
}
let bkCache=null;
const bkBusy=(btn,t)=>{if(btn){btn.disabled=true;btn.textContent=t}};
A.backupNow=(v,btn)=>{bkBusy(btn,'جارٍ النسخ…');
 call('/api/backup/run',{}).then(r=>{toast('تمت النسخة الاحتياطية: '+mb(r.size));bkClose();loadBackup()}).catch(x=>{toast(x.message);loadBackup()})};
async function pickDir(title){const d=DESK();if(d&&d.pickFolder)return d.pickFolder(title);const v=prompt(title+'\nاكتب المسار الكامل على جهاز المكتب، مثل F:\\',(bkCache&&bkCache.mirror)||'');return v&&v.trim()||null}
A.backupExport=async(v,btn)=>{const dir=await pickDir('اختر القرص الخارجي أو المجلد الذي تُحفظ فيه النسخة');if(!dir)return;bkBusy(btn,'جارٍ الحفظ والتحقق…');
 call('/api/backup/export',{dir}).then(r=>{toast('حُفظت النسخة وتُحقق منها في '+r.dir);bkClose();loadBackup()}).catch(x=>{toast(x.message);bkClose();loadBackup()})};
A.backupPickMirror=async()=>{const dir=await pickDir('اختر مجلد النسخة الثانية التلقائية');if(dir){const i=document.getElementById('bkMirror');if(i)i.value=dir}};
A.backupSaveMirror=()=>{const i=document.getElementById('bkMirror');call('/api/backup/config',{mirror:i?i.value:''}).then(st=>{bkCache=st;toast(st.mirror?'ضُبطت النسخة الثانية التلقائية':'أُلغيت النسخة الثانية');loadBackup()}).catch(x=>toast(x.message))};
A.backupSaveRemind=()=>{const i=document.getElementById('bkRemind');call('/api/backup/config',{remindHours:+i.value}).then(()=>{toast('سيُذكّرك المسبار كل '+(+i.value===168?'أسبوع':i.value+' ساعة'));loadBackup()}).catch(x=>toast(x.message))};
A.backupOpenDir=()=>{const d=DESK();if(d&&bkCache)d.openPath(bkCache.dir)};
A.backupRestore=v=>{const b=((bkCache||{}).list||[]).find(x=>x.id===v);if(!b)return;
 const w=prompt('ستعود كل بيانات المكتب (الموكلون والقضايا والجلسات والرسائل والمالية) إلى حالتها في '+(b.at||v)+'.\nكل ما أُدخل بعد هذا الوقت لن يظهر، لكن تُحفظ نسخة من الوضع الحالي أولاً ويمكن التراجع.\nسيُعاد تشغيل المسبار تلقائياً.\n\nللتأكيد اكتب: استعادة');
 if(w===null)return;if(w.trim()!=='استعادة')return toast('لم تُنفَّذ الاستعادة: كلمة التأكيد غير مطابقة');
 call('/api/backup/restore',{id:v,confirm:'استعادة'}).then(()=>{document.getElementById('modal').innerHTML='<div class="modal-bg"><div class="modal" style="max-width:460px;text-align:center"><h1 style="font-size:22px">جارٍ الاستعادة…</h1><p>يُعاد تشغيل المسبار الآن، وتفتح الصفحة تلقائياً خلال ثوانٍ.</p></div></div>';
  let n=0;const t=setInterval(()=>{if(++n>90){clearInterval(t);return}fetch('/api/health',{cache:'no-store'}).then(r=>{if(r.ok&&n>3){clearInterval(t);location.reload()}}).catch(()=>{})},1000)}).catch(x=>toast(x.message))};
function loadBackup(){fetch('/api/backup/status').then(r=>r.ok?r.json():null).then(st=>{bkCache=st;const el=document.getElementById('bkPanel');if(el)el.innerHTML=backupHtml(st)}).catch(()=>{})}

/* ── تذكير النسخ الاحتياطي (كل 48 ساعة افتراضياً) ── */
let bkShown=0;
function bkClose(){const m=document.getElementById('modal');if(m&&m.querySelector('.bk-remind'))m.innerHTML=''}
function bkRemindShow(r){const m=document.getElementById('modal');if(!m||m.innerHTML.trim())return; // لا نقاطع نافذة مفتوحة
 bkShown=Date.now();const x=r.lastExternal,u=r.lastUser,l=r.last;
 m.innerHTML=`<div class="modal-bg"><div class="modal bk-remind" role="dialog" aria-label="تذكير النسخ الاحتياطي" style="max-width:560px">
  <div class="head"><h1 style="font-size:22px">حان وقت النسخة الاحتياطية</h1><button class="x" data-act="backupSnooze" aria-label="إغلاق">✕</button></div>
  <p style="line-height:1.9;margin:6px 0 10px">مرّت ${r.hours} ساعة دون حفظ نسخة من بيانات المكتب خارج هذا الجهاز. النسخ التلقائية اليومية محفوظة على القرص نفسه، فإن تعطّل الجهاز أو سُرق تضيع معه. احفظ نسخة على قرص خارجي أو فلاشة الآن — تستغرق ثوانيَ ويُتحقق منها تلقائياً.</p>
  <dl class="kv" style="margin-bottom:12px"><dt>آخر نسخة خارج الجهاز</dt><dd>${x?e(x.at)+' · '+ago(x.t):'<span class="pill warn">لا يوجد</span>'}</dd><dt>آخر نسخة يدوية</dt><dd>${u?e(u.at)+' · '+ago(u.t):'—'}</dd><dt>آخر نسخة تلقائية</dt><dd>${l&&l.ok?e(l.at):'—'}</dd></dl>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" data-act="backupExport">حفظ نسخة على قرص خارجي…</button><button class="btn" type="button" data-act="backupNow">نسخ على هذا الجهاز الآن</button><button class="btn" type="button" data-act="backupSnooze">ذكّرني بعد ${r.hours} ساعة</button></div></div></div>`}
A.backupSnooze=()=>{call('/api/backup/snooze',{}).catch(()=>{});bkClose()};
function bkCheck(){if(!window.MQ||!MQ.user||!can2('manage')||(MQ.settings||{}).cloud)return;if(Date.now()-bkShown<3600e3)return;
 fetch('/api/backup/remind',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(r=>{if(r&&r.due)bkRemindShow(r)}).catch(()=>{})}
setTimeout(bkCheck,8000);setInterval(bkCheck,30*60e3);
A.supportGrant=()=>{const h=+(document.getElementById('supH')||{}).value||24;if(!confirm('سيتمكن مزود الخدمة من تصدير بيانات المكتب (دون كلمات المرور) لمدة '+h+' ساعة، ويُسجَّل ذلك. متابعة؟'))return;
 call('/api/support/grant',{hours:h}).then(j=>{MQ.settings.supportUntil=j.until;render();toast('مُنح الإذن حتى '+fmtT(j.until))}).catch(x=>toast(x.message))};
A.supportRevoke=()=>call('/api/support/revoke',{}).then(()=>{MQ.settings.supportUntil=null;render();toast('أُلغي إذن الدعم')}).catch(x=>toast(x.message));

/* ── ترخيص المكتب وعقل المسبار ── */
let licCache=null;
function licHtml(l){if(!l)return '<div class="note" style="border:0">جارٍ التحميل…</div>';
 const ai=l.localKeys?'<span class="pill ok">مفاتيح محلية على هذا الجهاز</span>':l.gateway?`<span class="pill ok">عبر خادم المورّد</span> رصيد شهري ${Number(l.ai).toLocaleString('en')} وحدة`:'<span class="pill warn">غير مشمول</span> — يتطلب ترخيصاً يشمل عقل المسبار الواعي';
 return `<dl class="kv"><dt>بصمة هذا الجهاز</dt><dd class="mono" dir="ltr" style="text-align:right">${e(l.fp)} <button class="btn sm" type="button" data-act="licCopyFp">نسخ</button></dd>
  <dt>الترخيص</dt><dd>${l.active?`<span class="pill ok">مفعّل</span> ${e(l.office)} · المعرّف <b class="mono">${e(l.slug||'—')}</b>${l.exp?' · حتى '+e(l.exp):''}`:l.error?'<span class="pill bad">'+e(l.error)+'</span>':'<span class="pill warn">غير مفعّل</span>'}</dd>
  <dt>عقل المسبار الواعي</dt><dd>${ai}</dd></dl>
  ${l.pubReady?`<div style="display:flex;gap:8px;margin-top:10px"><input class="field mono" id="licCode" dir="ltr" placeholder="MQ1.…" style="flex:1"><button class="btn pri" type="button" data-act="licActivate">تفعيل</button></div><p class="m" style="margin-top:6px">أرسل بصمة الجهاز للمورّد، فيصلك كود تفعيل خاص بهذا الجهاز ومكتبك.</p>`:'<p class="m">هذه النسخة لم تُجهَّز بمفتاح التحقق بعد.</p>'}`}
function loadLic(){fetch('/api/admin/license').then(r=>r.ok?r.json():null).then(l=>{licCache=l;const el=document.getElementById('licPanel');if(el)el.innerHTML=licHtml(l)}).catch(()=>{})}
A.licCopyFp=()=>{if(licCache&&navigator.clipboard)navigator.clipboard.writeText(licCache.fp).then(()=>toast('نُسخت بصمة الجهاز'))};
A.licActivate=()=>{const i=document.getElementById('licCode');call('/api/admin/license',{code:i?i.value.trim():''}).then(()=>{toast('فُعّل الترخيص');loadLic()}).catch(x=>toast(x.message))};
const vs=V.settings;V.settings=()=>{const st=MQ.settings||{},man=can2('manage');let h=vs();if(!man)return h;
 const weak=clients.filter(isWeak).length;
 h+=`<section class="panel" style="margin-top:16px"><header><h2>رموز دخول بوابة الموكل</h2><span class="m">الرمز القوي 10 خانات عشوائية يولّدها الخادم، ولا يتكرر بين موكلين</span></header><div class="bd st-row">
  <div>${weak?`<span class="weak-code">${weak} من ${clients.length} موكلاً برموز قديمة ضعيفة</span> <span class="m">تُقبل حالياً، لكن يُنصح بتجديدها قبل استخدام البوابة مع موكلين حقيقيين.</span>`:'<span class="pill ok">كل الرموز قوية</span>'}</div>
  ${weak?'<button class="btn" type="button" data-act="rotateWeak">تجديد الرموز الضعيفة</button>':''}</div></section>`;
 if(st.cloud){
  const b=st.backupLast;
  h+=`<section class="panel" style="margin-top:16px"><header><h2>النسخ الاحتياطي</h2><span class="m">نسخة مشفّرة يومية لكل بيانات المكتب في التخزين السحابي، يُحتفظ بآخر 30 يوماً</span></header><div class="bd"><dl class="kv"><dt>آخر نسخة</dt><dd>${b&&b.ok?e(b.at)+' · '+b.records+' سجلاً و'+b.messages+' رسالة':'<span class="pill warn">لم تُؤخذ نسخة بعد</span>'}</dd></dl></div></section>`;
  const until=st.supportUntil&&st.supportUntil>Date.now()?st.supportUntil:null;
  h+=`<section class="panel" style="margin-top:16px"><header><h2>وصول الدعم الفني</h2><span class="m">لا يستطيع مزود الخدمة الاطلاع على بيانات المكتب أو تصديرها إلا بإذن مؤقت منك، وكل وصول يُسجَّل في سجل التدقيق</span></header><div class="bd st-row">
   <div>${until?'<span class="pill warn">الإذن ممنوح حتى '+fmtT(until)+'</span>':'<span class="pill ok">لا يوجد إذن — بيانات المكتب مغلقة أمام مزود الخدمة</span>'}</div>
   <div style="display:flex;gap:8px;align-items:center">${until?'<button class="btn" type="button" data-act="supportRevoke">إلغاء الإذن الآن</button>':`<select class="field" id="supH" style="width:auto"><option value="4">4 ساعات</option><option value="24" selected>24 ساعة</option><option value="72">72 ساعة</option></select><button class="btn" type="button" data-act="supportGrant">منح إذن مؤقت</button>`}</div></div></section>`;
 }else{
  h+=`<section class="panel" style="margin-top:16px"><header><h2>النسخ الاحتياطي</h2><span class="m">نسخة يومية تلقائية متحقق من سلامتها: القاعدة والمفاتيح والمرفقات</span></header><div class="bd" id="bkPanel">${backupHtml(bkCache)}</div></section>`;
  h+=`<section class="panel" style="margin-top:16px"><header><h2>ترخيص المكتب</h2><span class="m">معرّف المكتب وتفعيل هذه النسخة، وعقل المسبار الواعي عبر خادم المورّد</span></header><div class="bd" id="licPanel">${licHtml(licCache)}</div></section>`;
 }
 return h};

/* ── أزرار في الشاشات ── */
function inject(){
 const pg=document.getElementById('page');if(!pg)return;
 if(S.view==='clients'&&can2('write')){const hd=pg.querySelector('.head');if(hd&&!hd.querySelector('[data-act="newClient"]'))hd.insertAdjacentHTML('beforeend','<div class="toolbar"><button class="btn pri" data-act="newClient">+ موكل جديد</button></div>')}
 if(S.view==='client'&&can2('write')){const c=C(S.clientId);const host=document.getElementById('waBar')||pg.querySelector('.bag-head .bag-id>div:last-child');
  if(c&&host&&!pg.querySelector('[data-act="editClient"]')){host.insertAdjacentHTML('beforeend',`<button class="btn sm" data-act="editClient" data-v="${e(c.id)}">تعديل البيانات</button><button class="btn sm" data-act="rotateCode" data-v="${e(c.id)}" title="عند الشك بتسريب الرمز">تجديد رمز الدخول</button>${isWeak(c)?'<span class="weak-code" title="رمز قديم من 4 أرقام يمكن تخمينه">رمز ضعيف</span>':''}`)}}
 if(S.view==='settings'&&!bkCache&&!(MQ.settings||{}).cloud&&can2('manage'))loadBackup();
 if(S.view==='settings'&&!licCache&&!(MQ.settings||{}).cloud&&can2('manage'))loadLic();
}
const r0=render;render=function(){r0();try{inject()}catch(x){console.warn(x)}};
})();
