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
 const c=(typeof C==='function'&&C(m.client))||{},who=c.name||'موكل',ks=casesOf(m.client);
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
/* النطق: بصوت عربي إن وُجد. إن كانت قائمة الأصوات فارغة (أندرويد وآيفون أحياناً) نطلب العربية من النظام مباشرة.
   إن وُجدت أصوات بلا عربية (كروم على ويندوز بلا حزمة عربية) لا ننطق نصاً عربياً بصوت أجنبي، ونخبر المحامي مرة واحدة */
let warned=false;
function speak(text,c){if(!hasTTS())return false;const vs=speechSynthesis.getVoices()||[],v=arVoice();
 if(!v&&vs.length){if(!warned){warned=true;setTimeout(()=>toast('التنبيه الصوتي يحتاج صوتاً عربياً: افتح ميثاق في متصفح Edge، أو ثبّت الصوت العربي في ويندوز (الإعدادات ← الوقت واللغة ← الكلام).'),2500)}return false}
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);if(v){u.voice=v;u.lang=v.lang}else u.lang='ar-SA';u.rate=c.rate;u.volume=c.vol;speechSynthesis.speak(u);try{speechSynthesis.resume()}catch(x){}return true}catch(x){return false}}

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

/* ── قسم الإعدادات (لكل مستخدم على هذا الجهاز) ── */
function box(){const c=cfg(),v=arVoice(),tts=hasTTS();
 return `<div class="bd ann-box"><div class="ann-row"><label class="rl-ck"><input type="checkbox" id="annVoice" ${c.voice?'checked':''}> نطق صوتي عند وصول رسالة أو تسجيل أو مستند من موكل (اسم الموكل ورقم القضية ونوع ما وصل وقناته)</label></div>
 <div class="ann-row"><label class="rl-ck"><input type="checkbox" id="annChime" ${c.chime?'checked':''}> نغمة تنبيه قبل النطق</label></div>
 <div class="ann-row ann-grid"><label>سرعة النطق<select class="field" id="annRate">${[[0.85,'هادئة'],[1,'عادية'],[1.15,'أسرع']].map(([x,l])=>`<option value="${x}" ${c.rate==x?'selected':''}>${l}</option>`).join('')}</select></label>
 <label>مستوى الصوت<select class="field" id="annVol">${[[0.5,'منخفض'],[0.8,'متوسط'],[1,'مرتفع']].map(([x,l])=>`<option value="${x}" ${c.vol==x?'selected':''}>${l}</option>`).join('')}</select></label>
 <button type="button" class="btn" data-act="annTest">تجربة التنبيه</button></div>
 <div class="m">${!tts?'هذا المتصفح لا يدعم النطق؛ تعمل النغمة والإشعار المكتوب فقط.':v?'الصوت المستخدم: '+e(v.name):tts&&!speechSynthesis.getVoices().length?'سيُطلب الصوت العربي من نظام الجهاز مباشرة.':'لا يوجد صوت عربي مثبت على هذا الجهاز، فتعمل النغمة والإشعار المكتوب فقط. في ويندوز: الإعدادات ← الوقت واللغة ← الكلام ← إضافة أصوات ← العربية، ثم أعد فتح ميثاق.'} الإعداد خاص بهذا الجهاز.</div></div>`}
function paint(){const el=document.getElementById('annBox');if(el)el.innerHTML=box()}
if(typeof V.settings==='function'){const vs=V.settings;V.settings=()=>vs()+`<section class="panel" style="margin-top:16px"><header><h2>التنبيه الصوتي للرسائل</h2><span class="m">يعلن وصول رسائل الموكلين ومرفقاتهم بالصوت</span></header><div id="annBox">${box()}</div></section>`}
document.addEventListener('change',ev=>{const id=ev.target.id;if(!['annVoice','annChime','annRate','annVol'].includes(id))return;const c=cfg();
 if(id==='annVoice')c.voice=ev.target.checked;if(id==='annChime')c.chime=ev.target.checked;if(id==='annRate')c.rate=Number(ev.target.value)||1;if(id==='annVol')c.vol=Number(ev.target.value)||1;saveCfg(c)});
A.annTest=()=>{const c=cfg(),k=(typeof cases!=='undefined'?cases:[])[0],cl=k&&typeof C==='function'?C(k.client):null;
 const d=describe({from:'client',client:cl?cl.id:'',type:'voice',dur:42,ch:'البوابة'});
 if(c.chime)chime(c.vol);setTimeout(()=>{if(!speak(d.speech,c))toast(d.speech)},c.chime?650:0)};
const css=document.createElement('style');css.textContent='.ann-box{display:grid;gap:10px}.ann-grid{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}.ann-grid label{display:grid;gap:5px;font-size:13px}.ann-grid .field{min-width:130px}';document.head.appendChild(css);
})();
