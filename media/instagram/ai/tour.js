const { chromium } = require('playwright');
const OUT='/home/claude/ig/ai/tour/'; require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,locale:'ar'})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.request.post('http://localhost:8099/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
await p.goto('http://localhost:8099/');await p.waitForTimeout(2500);
await p.evaluate(()=>{const h=[...document.querySelectorAll('*')].find(x=>x.textContent.trim()==='ما يحتاج انتباهك');let n=h;while(n&&getComputedStyle(n).position!=='fixed')n=n.parentElement;const btn=n&&n.querySelector('button');if(btn)btn.click()});
await p.waitForTimeout(600);
for(const v of ['dash','clients','agenda','tasks','finance','portal','chats','opps','bar','mizan','users','audit','misbar','calc','lawlib','rulings','legalShelf','docs']){
 try{await p.click(`aside [data-act="nav"][data-v="${v}"], nav [data-act="nav"][data-v="${v}"], [data-act="nav"][data-v="${v}"]`,{timeout:3000});await p.waitForTimeout(1500);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:OUT+v+'.png'});console.log('ok',v)}catch(e){console.log('fail',v,e.message.split('\n')[0])}}
for(const t of ['hub','study','hearings','c360','refs']){await p.evaluate(()=>A.openCase('k1'));await p.waitForTimeout(1000);try{await p.click(`[data-act="caseTab"][data-v="${t}"]`);await p.waitForTimeout(1500);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:OUT+'case-'+t+'.png'});console.log('ok case',t)}catch(e){console.log('fail',t)}}
await b.close()})();
