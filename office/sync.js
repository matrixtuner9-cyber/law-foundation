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
 if(st.hearings)hearings=st.hearings; if(st.deadlines)deadlines=st.deadlines; if(st.docs)docs=st.docs; if(st.mzLog)mzLog=st.mzLog;
}
let saveT=null;
function saveState(){if(!MQ.ready||MQ.readOnly)return;clearTimeout(saveT);saveT=setTimeout(()=>{
 fetch('/api/admin/state',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clients,opponents,cases,hearings,deadlines,docs,mzLog})}).catch(()=>{})},400)}
MQ.saveState=saveState;
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
 es.addEventListener('seen',ev=>{const {client}=JSON.parse(ev.data);(messages[client]||[]).forEach(x=>{if(x.f==='me')x.seen=true});if(window.MQ_onMsg)MQ_onMsg({client,seen:true})});
}
(async function boot(){
 try{
  const r=await fetch('/api/admin/bootstrap');if(r.status===401){location.replace('/login.html');return}
  const b=await r.json();
  if(window.MQ_applyUser)MQ_applyUser(b.user,b.settings);
  assignState(b.state);
  Object.keys(messages).forEach(k=>delete messages[k]);
  b.messages.forEach(putMsg);
  MQ.push=b.push||{};MQ.pushReady=!!b.pushReady;
  MQ.ready=true;MQ_buildFeed();render();connect();document.body.classList.add('ready');
  if(!b.state&&!MQ.readOnly)saveState();
 }catch(e){document.body.classList.add('ready');console.warn('الخادم غير متاح، يعمل النظام دون حفظ',e)}
})();
})();
