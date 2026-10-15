// يفصل البيانات التجريبية إلى data.js ويضيف ملفات حقيبة الموكل والمزامنة إلى الصفحة
const fs = require('fs'), dir = process.argv[2];
const rd = f => fs.readFileSync(dir + '/' + f, 'utf8').replace(/\r\n/g, '\n');
let app = rd('app.js');
const a = app.indexOf('/* ── بيانات تجريبية ── */'), b = app.indexOf('const MZ_INCOMING=[');
if (a > 0 && b > a) {
  const block = app.slice(a, b);
  fs.writeFileSync(dir + '/data.js', '/* ── بيانات المكتب التجريبية ── يقرؤها المتصفح والخادم معاً */\n' + block.replace('/* ── بيانات تجريبية ── */\n', '') +
    "if(typeof module!=='undefined')module.exports={courts,clients,opponents,STEPS,cases,hearings,deadlines,docs,messages,mzLog};\n");
  app = app.slice(0, a) + '/* البيانات التجريبية في ملف data.js */\n' + app.slice(b);
  fs.writeFileSync(dir + '/app.js', app);
}
let dash = rd('dash.js');
dash = dash.replace(" {kind:'msg',c:'c5',ch:'رسالة SMS',t:'أستاذ، هل تأكد موعد تدقيق الاستئناف؟'},\n", '')
  .replace(" {kind:'msg',c:'c6',ch:'واتساب',t:'وصلني التذكير، سأكون في المحكمة قبل الموعد بنصف ساعة.'},\n", '')
  .replace("const KIND={mz:'ميزان',msg:'رسالة',portal:'البوابة',pay:'دفعة'};", "const KIND={mz:'ميزان',msg:'رسالة',portal:'البوابة',pay:'دفعة',voice:'صوتية',image:'صورة',file:'مرفق'};")
  .replace("S.feed=[...mzLog", "window.MQ_buildFeed=()=>{S.feed=[...mzLog")
  .replace(".sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8);\n", ".sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8)};MQ_buildFeed();\n")
  .replace("const act=f.c?`data-act=\"portalFor\" data-v=\"${f.c}\"`", "const act=f.c?`data-act=\"bag\" data-v=\"${f.c}\"`")
  .replace(" const f={at,kind:e.kind,c:e.c,k:e.k,t:e.t};S.feed.unshift(f);S.feed=S.feed.slice(0,12);\n drawNav();\n if(e.kind==='msg'&&S.view!=='dash')toast('رسالة جديدة من '+C(e.c).name);\n if(S.view!=='dash')return;\n const feed=document.getElementById('feed');\n if(feed){feed.insertAdjacentHTML('afterbegin',feedItem(f,true));while(feed.children.length>12)feed.lastElementChild.remove()}\n const u=document.getElementById('hsU');if(u)u.textContent=unreadN();\n",
    " pushFeed({at,kind:e.kind,c:e.c,k:e.k,t:e.t});\n");
dash = dash.replace("let li=0;\nfunction liveEvent(){",
  "function pushFeed(f){S.feed.unshift(f);S.feed=S.feed.slice(0,12);drawNav();\n if(S.view!=='dash')return;\n const feed=document.getElementById('feed');\n if(feed){feed.insertAdjacentHTML('afterbegin',feedItem(f,true));while(feed.children.length>12)feed.lastElementChild.remove()}\n const u=document.getElementById('hsU');if(u)u.textContent=unreadN();\n}\nwindow.MQ_pushFeed=pushFeed;\nlet li=0;\nfunction liveEvent(){");
fs.writeFileSync(dir + '/dash.js', dash);
let h = rd('index.html');
if (!h.includes('data.js')) h = h.replace('<script src="app.js"></script>', '<script src="data.js"></script>\n<script src="app.js"></script>');
if (!h.includes('briefcase.css')) h = h.replace('<link rel="stylesheet" href="dash.css">', '<link rel="stylesheet" href="dash.css">\n<link rel="stylesheet" href="briefcase.css">');
if (!h.includes('sync.js')) h = h.replace('<script src="dash.js"></script>', '<script src="dash.js"></script>\n<script src="briefcase.js"></script>\n<script src="sync.js"></script>');
fs.writeFileSync(dir + '/index.html', h);
console.log('patch2', app.includes('const clients=') ? 'FAIL-app' : 'app ok', dash.includes('MQ_pushFeed') && dash.includes('MQ_buildFeed') && !dash.includes("kind:'msg',c:'c5'") ? 'dash ok' : 'FAIL-dash');
