/* ── التنبيه الصوتي للمحامي ──
   عند وصول رسالة أو تسجيل صوتي أو صورة أو مستند من موكل: نغمة قصيرة ثم نطق عربي يذكر نوع ما وصل واسم الموكل
   ورقم القضية وقناة الإرسال، مع إشعار مكتوب بنفس التفاصيل. الإعداد لكل جهاز (يُحفظ في المتصفح) من شاشة الإعدادات. */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='mq_announce';
const DEF={voice:true,chime:true,rate:1,vol:1};
const cfg=()=>{try{return {...DEF,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(x){return {...DEF}}};
const saveCfg=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch(x){}};
const hasTTS=()=>'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
const arVoice=()=>{if(!hasTTS())return null;const vs=speechSynthesis.getVoices()||[];return vs.find(v=>/^ar(-|_|$)/i.test(v.lang)&&/natural|online|neural/i.test(v.name))||vs.find(v=>/^ar(-|_|$)/i.test(v.lang))||null};
if(hasTTS()){try{speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>{if(S.view==='settings'&&document.getElementById('annBox'))paint()}}catch(x){}}

/* ما الذي وصل: يُقال بصيغة طبيعية */
const KIND={text:'رسالة جديدة',voice:'رسالة صوتية',image:'صورة',file:'مستند',notice:'إشعار'};
const kindOf=m=>KIND[m.type]||'رسالة جديدة';
const chOf=ch=>{const c=String(ch||'').trim();if(!c||c==='البوابة')return 'عبر بوابة الموكل';if(/بريد|mail/i.test(c))return 'عبر البريد الإلكتروني';if(/واتس/i.test(c))return 'عبر واتساب';if(/رسائل|sms/i.test(c))return 'برسالة نصية قصيرة';return 'عبر '+c};
/* القضايا المفتوحة للموكل: رقم واحد يُذكر، وأكثر من قضية تُذكر أحدثها مع العدد */
function casesOf(cid){
 const all=(typeof cases!=='undefined'?cases:[]).filter(k=>k.client===cid),open=all.filter(k=>!/مغلق|منته|محفوظ/.test(String(k.status||'')));
 const list=(open.length?open:all).slice().sort((a,b)=>String(b.opened||'').localeCompare(String(a.opened||'')));
 return list;
}
function describe(m){
 const c=(typeof C==='function'&&C(m.client))||{},who=c.name||'موكل';let ks=casesOf(m.client);
 const tk=m.k&&(typeof cases!=='undefined'?cases:[]).find(k=>k.id===m.k&&k.client===m.client);if(tk)ks=[tk];
 const kind=kindOf(m),via=chOf(m.ch);
 const caseTxt=ks.length===1?'في القضية رقم '+ks[0].no:ks.length>1?(ks.length===2?'وله قضيتان':'وله '+ks.length+(ks.length<=10?' قضايا':' قضية'))+'، أحدثها رقم '+ks[0].no:'';
 const extra=m.type==='file'&&m.name?' باسم '+String(m.name).replace(/\.[a-z0-9]{2,5}$/i,''):m.type==='voice'&&m.dur?' مدتها '+spokenDur(m.dur):'';
 return {who,kind,via,caseNo:ks[0]?ks[0].no:'',
  speech:`${kind}${extra} من الموكل ${who}${caseTxt?'، '+caseTxt:''}، ${via}.`,
  title:`${kind} من ${who}`,
  body:[ks[0]?'القضية '+ks[0].no+(ks.length>1?' (+'+(ks.length-1)+')':''):'',via,MQ.label?MQ.label(m):''].filter(Boolean).join(' · ')};
}
function spokenDur(s){s=Math.max(1,Math.round(s||0));const mi=Math.floor(s/60),se=s%60;return (mi?mi+' دقيقة'+(se?' و':''):'')+(se?se+' ثانية':'')}

/* نغمة قصيرة بلا ملفات صوتية */
let ac=null;
function chime(vol){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const t=ac.currentTime;
 [[880,0],[1318.5,.16]].forEach(([f,d])=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18*vol,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+.45);o.connect(g).connect(ac.destination);o.start(t+d);o.stop(t+d+.5)})}catch(x){}}
/* النطق بالترتيب: (1) صوت عربي في المتصفح (Edge، الهواتف)؛ (2) ElevenLabs عبر خادم المكتب إن ضبطه المدير
   (يعمل في كروم على الكمبيوتر)، أو دائماً إن اختار المدير ذلك؛ (3) إن تعذّر الاثنان: إشعار مكتوب مرة واحدة بالحل */
const TT={st:null};
async function ttsStatus(force){if(TT.st&&!force)return TT.st;try{const r=await fetch('/api/admin/tts',{credentials:'same-origin'});TT.st=r.ok?await r.json():{configured:false}}catch(x){TT.st={configured:false}}return TT.st}
setTimeout(()=>ttsStatus(),1500);
let player=null;
async function cloudSpeak(text,c){
 const st=await ttsStatus();if(!st.configured)return false;
 try{const r=await fetch('/api/admin/tts/speak',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({text})});
  if(!r.ok){const j=await r.json().catch(()=>({}));if(j.error)toast('النطق السحابي: '+j.error);return false}
  const url=URL.createObjectURL(await r.blob());if(player){try{player.pause()}catch(x){}}
  player=new Audio(url);player.volume=Math.min(1,c.vol);player.playbackRate=c.rate;player.onended=()=>URL.revokeObjectURL(url);
  await player.play();return true}catch(x){if(x&&x.name==='NotAllowedError')toast('اضغط في أي مكان في ميثاق مرة واحدة ليُسمح بتشغيل التنبيه الصوتي.');return false}}
function browserSpeak(text,c){if(!hasTTS())return false;const vs=speechSynthesis.getVoices()||[],v=arVoice();
 if(!v&&vs.length)return false; // أصوات بلا عربية: لا نقرأ العربية بصوت أجنبي
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);if(v){u.voice=v;u.lang=v.lang}else u.lang='ar-SA';u.rate=c.rate;u.volume=c.vol;speechSynthesis.speak(u);try{speechSynthesis.resume()}catch(x){}return true}catch(x){return false}}
let warned=false;
async function speak(text,c){
 const st=await ttsStatus();
 if(st.configured&&st.always&&await cloudSpeak(text,c))return true;
 if(browserSpeak(text,c))return true;
 if(st.configured&&!st.always&&await cloudSpeak(text,c))return true;
 if(!warned){warned=true;toast(st.configured?'تعذّر النطق؛ تحقّق من إعداد ElevenLabs في الإعدادات.':'لا يوجد صوت عربي في هذا المتصفح. افتح ميثاق في Edge، أو يضبط المدير النطق السحابي (ElevenLabs) من الإعدادات.')}
 return false}

/* لا يُعاد التنبيه في أكثر من نافذة مفتوحة لنفس الرسالة */
function firstTab(id){try{const k='mq_ann_'+id;if(localStorage.getItem(k))return false;localStorage.setItem(k,'1');setTimeout(()=>{try{localStorage.removeItem(k)}catch(x){}},60000);return true}catch(x){return true}}

window.MQ_announce=m=>{
 if(!m||m.from!=='client')return;
 const c=cfg(),d=describe(m);
 if(!firstTab(m.id))return;
 if(c.chime)chime(c.vol);
 if(c.voice)setTimeout(()=>speak(d.speech,c),c.chime?650:0);
 return d;
};
window.MQ_describeMsg=describe;

/* ── قراءة نص طويل (مرفقات الموكل): مقاطع متتابعة، بصوت المتصفح العربي أو ElevenLabs، مع إيقاف ── */
function chunks(text,max=900){const out=[];let cur='';
 for(const part of String(text||'').replace(/\r/g,'').split(/(?<=[.!؟?؛:\n])\s*/)){const p=part.trim();if(!p)continue;
  if((cur+' '+p).length>max){if(cur)out.push(cur);if(p.length>max){for(let i=0;i<p.length;i+=max)out.push(p.slice(i,i+max));cur=''}else cur=p}else cur=cur?cur+' '+p:p}
 if(cur)out.push(cur);return out}
const RD={run:0};
async function cloudAudio(text){const r=await fetch('/api/admin/tts/speak',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({text,kind:'read'})});if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||'تعذّر النطق')}return URL.createObjectURL(await r.blob())}
/* يعيد طريقة القراءة المتاحة: browser | cloud | null */
/* preferFree: للنصوص الطويلة نفضّل صوت المتصفح المجاني حتى لو اختار المدير ElevenLabs «دائماً» للتنبيهات */
window.MQ_readMode=async(o={})=>{const st=await ttsStatus();const vs=hasTTS()?speechSynthesis.getVoices()||[]:[];const br=hasTTS()&&(arVoice()||!vs.length);
 if(o.preferFree&&br)return 'browser';
 if(o.preferFree&&st.alertsOnly)return br?'browser':null; // ElevenLabs للتنبيهات فقط
 return st.configured&&(st.always||!br)?'cloud':br?'browser':null};
window.MQ_readStop=()=>{RD.run++;try{speechSynthesis.cancel()}catch(x){}if(player){try{player.pause()}catch(x){}}};
window.MQ_readAloud=async(text,{onProgress,onEnd,preferFree}={})=>{
 MQ_readStop();const id=++RD.run,c=cfg(),parts=chunks(text),mode=await MQ_readMode({preferFree});
 if(!mode){toast('لا يوجد صوت عربي في هذا المتصفح، ولم يُضبط النطق السحابي.');onEnd&&onEnd();return}
 try{
  if(mode==='browser'){for(let i=0;i<parts.length;i++){if(id!==RD.run)return;onProgress&&onProgress(i,parts.length);
    await new Promise(res=>{const u=new SpeechSynthesisUtterance(parts[i]),v=arVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='ar-SA';u.rate=c.rate;u.volume=c.vol;u.onend=u.onerror=res;speechSynthesis.speak(u)})}}
  else{let next=cloudAudio(parts[0]);
   for(let i=0;i<parts.length;i++){if(id!==RD.run)return;onProgress&&onProgress(i,parts.length);
    const url=await next;next=i+1<parts.length?cloudAudio(parts[i+1]):null;if(id!==RD.run){URL.revokeObjectURL(url);return}
    await new Promise(res=>{player=new Audio(url);player.volume=Math.min(1,c.vol);player.playbackRate=c.rate;player.onended=player.onerror=()=>{URL.revokeObjectURL(url);res()};player.play().catch(res)})}}
 }catch(er){toast(er.message)}
 finally{if(id===RD.run)onEnd&&onEnd()}};
window.MQ_readChunks=chunks;

/* ── قسم الإعدادات (لكل مستخدم على هذا الجهاز) ── */
function box(){const c=cfg(),v=arVoice(),tts=hasTTS();
 return `<div class="bd ann-box"><div class="ann-row"><label class="rl-ck"><input type="checkbox" id="annVoice" ${c.voice?'checked':''}> نطق صوتي عند وصول رسالة أو تسجيل أو مستند من موكل (اسم الموكل ورقم القضية ونوع ما وصل وقناته)</label></div>
 <div class="ann-row"><label class="rl-ck"><input type="checkbox" id="annChime" ${c.chime?'checked':''}> نغمة تنبيه قبل النطق</label></div>
 <div class="ann-row ann-grid"><label>سرعة النطق<select class="field" id="annRate">${[[0.85,'هادئة'],[1,'عادية'],[1.15,'أسرع']].map(([x,l])=>`<option value="${x}" ${c.rate==x?'selected':''}>${l}</option>`).join('')}</select></label>
 <label>مستوى الصوت<select class="field" id="annVol">${[[0.5,'منخفض'],[0.8,'متوسط'],[1,'مرتفع']].map(([x,l])=>`<option value="${x}" ${c.vol==x?'selected':''}>${l}</option>`).join('')}</select></label>
 <button type="button" class="btn" data-act="annTest">تجربة التنبيه</button></div>
 <div class="m">${!tts?'هذا المتصفح لا يدعم النطق؛ تعمل النغمة والإشعار المكتوب فقط.':v?'الصوت المستخدم: '+e(v.name):tts&&!speechSynthesis.getVoices().length?'سيُطلب الصوت العربي من نظام الجهاز مباشرة.':(TT.st&&TT.st.configured?'لا يوجد صوت عربي في هذا المتصفح؛ يُستخدم النطق السحابي (ElevenLabs) المضبوط أدناه.':'لا يوجد صوت عربي في هذا المتصفح (كروم على الكمبيوتر غالباً). استخدم Edge، أو يضبط المدير النطق السحابي أدناه.')} الإعداد خاص بهذا الجهاز.</div>${elBox()}</div>`}
function elBox(){const st=TT.st;if(!st)return '<div class="m">جارٍ القراءة…</div>';
 const head='<b>النطق السحابي (ElevenLabs)</b> <span class="m">· يعمل في كل المتصفحات ومنها كروم. يُرسَل نص التنبيه (ومعه اسم الموكل ورقم القضية) إلى ElevenLabs لتوليد الصوت، ويُحسب من رصيد حسابك هناك.</span>';
 if(!st.canManage)return `<div class="ann-el">${head}<div class="m">${st.configured?'<span class="pill ok">مفعّل</span> يضبطه مدير المكتب.':'غير مفعّل. يضبطه مدير المكتب.'}</div></div>`;
 if(TT.open||!st.configured)return `<form class="form ann-el" id="annElForm" autocomplete="off"><div class="wide">${head}</div>
  <label class="wide">مفتاح ElevenLabs API ${st.configured?'<small class="m">(اتركه فارغاً لإبقاء المفتاح المحفوظ ‎…'+e(st.last4)+')</small>':''}<input class="field mono" id="annElKey" type="password" autocomplete="new-password" dir="ltr" placeholder="sk_…"></label>
  <label>الصوت<select class="field" id="annElVoice"><option value="">${TT.voices?'— أول صوت في الحساب —':'احفظ المفتاح ثم اختر الصوت'}</option>${(TT.voices||[]).map(v=>`<option value="${e(v.id)}" data-n="${e(v.name)}" ${st.voiceId===v.id?'selected':''}>${e(v.name)}${v.category?' · '+e(v.category):''}</option>`).join('')}</select></label>
  <label>أو معرّف الصوت (Voice ID)<input class="field mono" id="annElVoiceId" dir="ltr" placeholder="من ElevenLabs ← Voices ← ID" value="${e(st.voiceId&&!(TT.voices||[]).some(v=>v.id===st.voiceId)?st.voiceId:'')}"></label>
  <label>النموذج<select class="field" id="annElModel"><option value="flash" ${st.model!=='quality'?'selected':''}>سريع وأرخص (Flash v2.5)</option><option value="quality" ${st.model==='quality'?'selected':''}>أعلى جودة (Multilingual v2)</option><option value="v3" ${st.model==='v3'?'selected':''}>الأكثر تعبيراً (Eleven v3)</option></select></label>
  <label class="wide rl-ck"><input type="checkbox" id="annElAlerts" ${st.alertsOnly!==false?'checked':''}> للتنبيهات فقط (لا يُستخدم لقراءة نصوص المرفقات الطويلة، فتُقرأ بصوت المتصفح المجاني)</label>
  <label class="wide rl-ck"><input type="checkbox" id="annElAlways" ${st.always?'checked':''}> استخدمه دائماً حتى لو وُجد صوت عربي في المتصفح (صوت موحّد على كل الأجهزة)</label>
  <div class="wide toolbar"><button class="btn pri">حفظ</button>${st.configured?'<button type="button" class="btn" data-act="annElX">إلغاء</button>':''}</div></form>`;
 return `<div class="ann-el">${head}<div class="st-row"><div><span class="pill ok">مفعّل</span> المفتاح ينتهي بـ <span class="mono">${e(st.last4)}</span> · الصوت: ${e(st.voiceName||'أول صوت في الحساب')} · ${st.model==='quality'?'أعلى جودة':st.model==='v3'?'Eleven v3':'سريع'}${st.always?' · دائماً':' · عند غياب الصوت العربي'}${st.alertsOnly!==false?' · للتنبيهات فقط':''}</div><div class="toolbar"><button type="button" class="btn sm" data-act="annElEdit">تغيير</button><button type="button" class="btn sm" data-act="annElRm">إزالة</button></div></div></div>`}
function paint(){const el=document.getElementById('annBox');if(el)el.innerHTML=box()}
async function loadVoices(){try{const r=await fetch('/api/admin/tts/voices',{credentials:'same-origin'});const j=await r.json();if(r.ok)TT.voices=j.voices;else toast(j.error||'تعذّر جلب الأصوات')}catch(x){}paint()}
A.annElEdit=()=>{TT.open=true;paint();loadVoices()};A.annElX=()=>{TT.open=false;paint()};
A.annElRm=async()=>{if(!confirm('إزالة مفتاح ElevenLabs؟ سيعود التنبيه لصوت المتصفح فقط.'))return;try{const r=await fetch('/api/admin/tts',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({clear:true})});if(r.ok){toast('أُزيل المفتاح');await ttsStatus(true);paint()}}catch(x){}};
document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='annElForm')return;ev.preventDefault();ev.stopImmediatePropagation();
 const sel=f.annElVoice,opt=sel.options[sel.selectedIndex],manual=f.annElVoiceId.value.trim(),body={key:f.annElKey.value.trim(),voiceId:manual||sel.value,voiceName:manual?'':(opt&&opt.dataset.n||''),model:f.annElModel.value,always:f.annElAlways.checked,alertsOnly:f.annElAlerts.checked};
 const btn=f.querySelector('.btn.pri');btn.disabled=true;
 try{const r=await fetch('/api/admin/tts',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));
  if(!r.ok){toast(j.error||'تعذّر الحفظ');btn.disabled=false;return}
  toast('حُفظ إعداد النطق السحابي');await ttsStatus(true);if(!TT.voices){TT.open=true;await loadVoices();return}TT.open=false;paint()}catch(x){btn.disabled=false;toast('تعذّر الاتصال')}},true);
if(typeof V.settings==='function'){const vs=V.settings;V.settings=()=>{setTimeout(()=>ttsStatus(true).then(paint),0);return vs()+`<section class="panel" style="margin-top:16px"><header><h2>التنبيه الصوتي للرسائل</h2><span class="m">يعلن وصول رسائل الموكلين ومرفقاتهم بالصوت</span></header><div id="annBox">${box()}</div></section>`}}
document.addEventListener('change',ev=>{const id=ev.target.id;if(!['annVoice','annChime','annRate','annVol'].includes(id))return;const c=cfg();
 if(id==='annVoice')c.voice=ev.target.checked;if(id==='annChime')c.chime=ev.target.checked;if(id==='annRate')c.rate=Number(ev.target.value)||1;if(id==='annVol')c.vol=Number(ev.target.value)||1;saveCfg(c)});
A.annTest=()=>{const c=cfg(),k=(typeof cases!=='undefined'?cases:[])[0],cl=k&&typeof C==='function'?C(k.client):null;
 const d=describe({from:'client',client:cl?cl.id:'',type:'voice',dur:42,ch:'البوابة'});
 if(c.chime)chime(c.vol);setTimeout(async()=>{if(!await speak(d.speech,c))toast(d.speech)},c.chime?650:0)};
const css=document.createElement('style');css.textContent='.ann-box{display:grid;gap:10px}.ann-grid{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}.ann-grid label{display:grid;gap:5px;font-size:13px}.ann-grid .field{min-width:130px}.ann-el{border-top:1px solid var(--line);padding-top:12px;display:grid;gap:8px}';document.head.appendChild(css);
})();
