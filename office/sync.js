/* ── المزامنة مع الخادم ──
   يحفظ بيانات المكتب في الخادم، ويحمّل الرسائل، ويستقبل رسائل الموكلين (نص، صوت، صور، مستندات) لحظة وصولها */
(function(){
const online=location.protocol.startsWith('http');
window.MQ={online,ready:false};
if(!online)return;

const toMsg=m=>({id:m.id,f:m.from==='client'?'them':'me',ch:m.ch,t:m.text||'',at:m.at,unread:m.from==='client'&&!m.read,type:m.type||'text',file:m.file,dur:m.dur,name:m.name,size:m.size,ext:m.ext,seen:m.seen});
function putMsg(m){const list=(messages[m.client]=messages[m.client]||[]);const i=list.findIndex(x=>x.id===m.id);const v=toMsg(m);if(i>=0){list[i]=v;return false}list.push(v);list.sort((a,b)=>a.at.localeCompare(b.at));return true}
MQ.putMsg=putMsg;
const label=m=>m.type==='notice'?'إشعار: '+(m.text||m.t||''):m.type==='voice'?'رسالة صوتية ('+MQ.dur(m.dur)+')':m.type==='image'?'أرسل صورة'+(m.name?': '+m.name:''):m.type==='file'?'أرسل مستنداً: '+(m.name||''):(m.text||m.t||'');
MQ.label=label;
MQ.dur=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};

function assignState(st){
 if(!st)return;
 const rep=(arr,val)=>{if(Array.isArray(val))arr.splice(0,arr.length,...val)};
 rep(clients,st.clients);rep(opponents,st.opponents);rep(cases,st.cases);
 if(st.hearings)hearings=st.hearings; if(st.deadlines)deadlines=st.deadlines; if(st.docs)docs=st.docs; if(st.mzLog)mzLog=st.mzLog; if(st.rulings)rulings=st.rulings;
}

/* ── الحفظ الآمن ──
   يُرسل للخادم ما تغيّر فقط، ومع كل سجل رقم إصداره (_v). إن عدّل زميلٌ السجلَ نفسه قبلك يرفض الخادم تعديلك
   ويعيد أحدث نسخة فتظهر لك رسالة. لا يُحذف شيء لأنه غاب عن طلبك. وأي فشل في الحفظ يظهر أعلى الشاشة ويُعاد تلقائياً. */
const KINDS=['clients','opponents','cases','hearings','deadlines','docs','rulings'];
const ARR=k=>({clients,opponents,cases,hearings,deadlines,docs,rulings})[k];
const saved=new Map();let savedMz='[]';
const dels={}; /* حذف صريح بانتظار الإرسال: {kind:Set(ids)} */
const TAB=Math.random().toString(36).slice(2,12); /* معرّف هذه النافذة: يتجاهل صدى تعديلاتها هي فقط، لا تعديلات نفس المستخدم في نافذة أخرى */
const key=(k,id)=>k+':'+id;
const newId=k=>k[0]+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function markSaved(){saved.clear();KINDS.forEach(k=>ARR(k).forEach(r=>{if(r&&r.id!=null)saved.set(key(k,r.id),JSON.stringify(r))}));savedMz=JSON.stringify(mzLog||[])}
function collect(){
 const changes={};let n=0;
 KINDS.forEach(k=>ARR(k).forEach(r=>{if(!r||typeof r!=='object')return;if(r.id==null||r.id==='')r.id=newId(k);const js=JSON.stringify(r);if(saved.get(key(k,r.id))!==js){(changes[k]=changes[k]||[]).push(r);n++}}));
 const mz=JSON.stringify(mzLog||[]);
 const deleted={};Object.entries(dels).forEach(([k,s])=>{if(s.size){deleted[k]=[...s];n+=s.size}});
 return {n,changes,mz:mz!==savedMz?mz:null,deleted:Object.keys(deleted).length?deleted:null};
}
function saveBar(msg,kind){let b=document.getElementById('saveBar');
 if(!msg){if(b)b.remove();return}
 if(!b){b=document.createElement('div');b.id='saveBar';b.setAttribute('role','status');document.body.appendChild(b)}
 b.className='save-bar '+(kind||'warn');b.textContent=msg}
let saveT=null,inflight=false,again=false,fails=0,retryT=null;
function saveState(){if(!MQ.ready||MQ.readOnly)return;clearTimeout(saveT);saveT=setTimeout(flush,400)}
async function flush(){
 if(inflight){again=true;return}
 const c=collect();if(!c.n&&!c.mz){if(fails){fails=0;saveBar(null)}return}
 inflight=true;const sent=new Map();Object.entries(c.changes).forEach(([k,list])=>list.forEach(r=>sent.set(key(k,r.id),JSON.stringify(r))));
 try{
  const r=await fetch('/api/admin/state',{method:'POST',headers:{'content-type':'application/json','x-mq-tab':TAB},body:JSON.stringify({v:2,changes:c.changes,...(c.deleted?{deleted:c.deleted}:{}),...(c.mz?{mzLog:mzLog}:{})})});
  if(r.status===401){location.replace('/login.html');return}
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||('HTTP '+r.status));
  let redraw=false;
  (j.codes||[]).forEach(([id,code])=>{const x=clients.find(o=>o.id===id);if(x&&x.code!==code){x.code=code;redraw=true}});
  (j.versions||[]).forEach(([k,id,v])=>{const x=ARR(k).find(o=>String(o.id)===String(id));if(!x)return;const was=sent.get(key(k,id));x._v=v;
   /* لم يتغير السجل أثناء الإرسال؟ نعتبره محفوظاً بنسخته الجديدة */
   const cur=JSON.parse(JSON.stringify(x));delete cur._v;const w=was?JSON.parse(was):null;if(w)delete w._v;
   if(w&&JSON.stringify(cur)===JSON.stringify(w))saved.set(key(k,id),JSON.stringify(x))});
  if((j.conflicts||[]).length){j.conflicts.forEach(({kind,id,rec})=>{const a=ARR(kind),i=a.findIndex(o=>String(o.id)===String(id));if(i>=0)a[i]=rec;else a.push(rec);saved.set(key(kind,id),JSON.stringify(rec))});
   toast('عدّل زميل '+(j.conflicts.length===1?'هذا السجل':j.conflicts.length+' سجلات')+' قبلك، فحُمّلت أحدث نسخة. راجعها ثم أعد تعديلك إن لزم.');redraw=true}
  if(c.mz)savedMz=c.mz;
  if(c.deleted)Object.entries(c.deleted).forEach(([k,ids])=>ids.forEach(id=>{dels[k]&&dels[k].delete(id);saved.delete(key(k,id))}));
  fails=0;clearTimeout(retryT);saveBar(null);
  if(redraw)r0();
 }catch(e){
  fails++;const wait=Math.min(60,5*fails);
  saveBar('لم تُحفظ آخر التعديلات بعد ('+(e.message||'تعذّر الاتصال')+'). ستُعاد المحاولة تلقائياً خلال '+wait+' ثانية.','bad');
  clearTimeout(retryT);retryT=setTimeout(flush,wait*1000);
 }finally{inflight=false;if(again){again=false;saveState()}}
}
MQ.deleted=(k,id)=>{(dels[k]=dels[k]||new Set()).add(String(id));saved.delete(key(k,id));saveState()};
MQ.saveState=saveState;MQ.flush=flush;MQ.pending=()=>collect().n>0||fails>0;
addEventListener('beforeunload',e=>{if(MQ.ready&&!MQ.readOnly&&(inflight||MQ.pending())){e.preventDefault();e.returnValue=''}});
/* تعديلات الزملاء تصل فوراً: تُطبق إلا إن كان لديك تعديل غير محفوظ على السجل نفسه (فيحسمه الخادم عند الحفظ) */
function applyRemote(d){
 if(!d||(d.by&&d.by===TAB))return;let touched=false;
 (d.recs||[]).forEach(({kind,rec})=>{const a=ARR(kind);if(!a||!rec)return;const i=a.findIndex(o=>String(o.id)===String(rec.id));
  if(i>=0){const dirty=saved.get(key(kind,rec.id))!==JSON.stringify(a[i]);if(dirty)return;a[i]=rec}else a.push(rec);
  saved.set(key(kind,rec.id),JSON.stringify(rec));touched=true});
 (d.del||[]).forEach(({kind,id})=>{const a=ARR(kind),i=a?a.findIndex(o=>String(o.id)===String(id)):-1;if(i>=0){a.splice(i,1);saved.delete(key(kind,id));touched=true}});
 if(touched&&!document.querySelector('#modal .modal'))r0();
}
const r0=render;render=function(){r0();saveState()};

const post=(url,obj)=>fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(obj)}).then(async r=>{if(r.status===401)location.replace('/login.html');const j=await r.json();if(!r.ok)throw new Error(j.error||'تعذّر الإرسال');return j});
MQ.send=(client,text,ch,type)=>post('/api/admin/messages',{client,text,ch,type}).then(m=>{putMsg(m);return m});
MQ.read=client=>{(messages[client]||[]).forEach(m=>m.unread=false);drawNav();return post('/api/admin/read',{client}).catch(()=>{})};
MQ.upload=(kind,client,blob,params)=>fetch(`/api/admin/${kind}?client=${encodeURIComponent(client)}&${new URLSearchParams(params||{})}`,{method:'POST',headers:{'content-type':(blob.type||'application/octet-stream').split(';')[0]},body:blob})
 .then(async r=>{if(r.status===401)location.replace('/login.html');const j=await r.json();if(!r.ok)throw new Error(j.error||'تعذّر الرفع');putMsg(j);return j});

/* الرسائل التلقائية من النظام (تفعيل البوابة، تحديد جلسة، اعتماد تحديث ميزان) تذهب للخادم أيضاً */
sendMsg=function(cid,t,ch){MQ.send(cid,t,ch,'notice').then(()=>{if(window.MQ_onMsg)MQ_onMsg({client:cid})}).catch(e=>toast(e.message))};

window.MQ_buildFeed=()=>{S.feed=[...mzLog.map(l=>({at:l.at,kind:'mz',k:l.k,t:l.t})),
 ...Object.entries(messages).flatMap(([c,ms])=>ms.filter(m=>m.f==='them').map(m=>({at:m.at,kind:m.type==='text'?'msg':m.type,c,t:label(m)})))]
 .sort((a,b)=>b.at.localeCompare(a.at)).slice(0,10)};

function notify(m){
 const who=(C(m.client)||{}).name||'موكل';
 toast((m.type==='voice'?'رسالة صوتية':m.type==='image'?'صورة':m.type==='file'?'مستند':'رسالة')+' جديدة من '+who);
 if(window.MQ_pushFeed)MQ_pushFeed({at:m.at,kind:m.type==='text'?'msg':m.type,c:m.client,t:label(m)});
 /* إشعار النظام حين تكون النافذة في الخلفية (تطبيق سطح المكتب أو متصفح سُمح له) */
 if((document.hidden||!document.hasFocus())&&'Notification' in window&&Notification.permission==='granted'){try{const n=new Notification('ميثاق · '+who,{body:label(m),tag:'mq-'+m.id,lang:'ar',dir:'rtl'});n.onclick=()=>{window.focus();A.bag(m.client)}}catch(e){}}
}
function connect(){
 const es=new EventSource('/api/stream');
 es.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!putMsg(m))return;if(m.from==='client')notify(m);drawNav();if(window.MQ_onMsg)MQ_onMsg(m)});
 es.addEventListener('read',ev=>{const {client}=JSON.parse(ev.data);(messages[client]||[]).forEach(x=>{if(x.f==='them')x.unread=false});drawNav()});
 es.addEventListener('push',ev=>{MQ.push=JSON.parse(ev.data);const el=document.getElementById('bagPush');if(el&&window.MQ_pushLabel)el.innerHTML=MQ_pushLabel(S.clientId)});
 es.addEventListener('profile',ev=>{const d=JSON.parse(ev.data),c=C(d.client);if(!c)return;Object.assign(c,{phone:d.phone,phone2:d.phone2,whatsapp:d.whatsapp});toast('حدّث '+c.name+' أرقام التواصل من البوابة');if(S.view==='client'&&S.clientId===d.client&&S.bagTab==='acct')render()});
 es.addEventListener('records',ev=>{try{applyRemote(JSON.parse(ev.data))}catch(e){}});
 es.addEventListener('seen',ev=>{const {client}=JSON.parse(ev.data);(messages[client]||[]).forEach(x=>{if(x.f==='me')x.seen=true});if(window.MQ_onMsg)MQ_onMsg({client,seen:true})});
}
(async function boot(){
 try{
  const r=await fetch('/api/admin/bootstrap');if(r.status===401){location.replace('/login.html');return}
  const b=await r.json();
  if(window.MQ_applyUser)MQ_applyUser(b.user,b.settings);
  assignState(b.state);if(b.state)markSaved();
  Object.keys(messages).forEach(k=>delete messages[k]);
  b.messages.forEach(putMsg);
  MQ.push=b.push||{};MQ.pushReady=!!b.pushReady;
  MQ.ready=true;MQ_buildFeed();render();connect();document.body.classList.add('ready');
  if(!b.state&&!MQ.readOnly)saveState();
 }catch(e){document.body.classList.add('ready');console.warn('الخادم غير متاح، يعمل النظام دون حفظ',e)}
})();
})();
