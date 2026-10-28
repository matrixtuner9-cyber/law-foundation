const { chromium } = require('playwright');
const OUT='/home/claude/ig/ai/steps/'; require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,locale:'ar'})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.request.post('http://localhost:8099/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
await p.goto('http://localhost:8099/');await p.waitForTimeout(2500);
await p.evaluate(()=>{const h=[...document.querySelectorAll('*')].find(x=>x.textContent.trim()==='ما يحتاج انتباهك');let n=h;while(n&&getComputedStyle(n).position!=='fixed')n=n.parentElement;const btn=n&&n.querySelector('button');if(btn)btn.click()});
const open=async()=>{await p.evaluate(()=>A.openCase('k1'));await p.waitForTimeout(1200);await p.evaluate(()=>{const b=document.querySelector('[data-act="csGo"]');let n=b;while(n){if(n.tagName==='DETAILS'){n.open=true}n=n.parentElement}const t=[...document.querySelectorAll('summary,button,div,header')].find(x=>/^سير القضية/.test(x.textContent.trim())&&x.children.length<6);if(b&&b.offsetParent===null&&t)t.click()});await p.waitForTimeout(500)};
await open();
const panel=await p.evaluateHandle(()=>{const b=document.querySelector('[data-act="csGo"]');let n=b;while(n&&!(n.tagName==='SECTION'||n.classList.contains('panel')||n.classList.contains('card')))n=n.parentElement;return n||b.parentElement});
try{await panel.asElement().scrollIntoViewIfNeeded();await panel.asElement().screenshot({path:OUT+'panel.png'});console.log('ok panel')}catch(e){console.log('panel fail',e.message)}
for(const s of ['intake','conflict','study','fees','file','evidence','analysis','drafting','filing']){
 await open(); try{await p.click(`[data-act="csGo"][data-v="k1|${s}"]`,{timeout:3000});await p.waitForTimeout(1500);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:OUT+s+'.png'});
 const m=await p.$('.modal,[role="dialog"],.sheet,.drawer'); if(m){await m.screenshot({path:OUT+s+'-m.png'})}
 console.log('ok',s,!!m)}catch(e){console.log('fail',s,e.message.split('\n')[0])}
 await p.keyboard.press('Escape'); }
await open(); try{await p.click('[data-act="hubPrep"]');await p.waitForTimeout(1800);await p.screenshot({path:OUT+'prep.png'});console.log('ok prep')}catch(e){}
await p.goto('http://localhost:8099/');await p.waitForTimeout(2000);
try{await p.click('[data-act="attOpen"]');await p.waitForTimeout(800);await p.click('[data-act="attGo"][data-v="hrOpen¦h3"]');await p.waitForTimeout(1500);await p.screenshot({path:OUT+'hreport.png'});const m=await p.$('.modal,[role="dialog"]');if(m)await m.screenshot({path:OUT+'hreport-m.png'});console.log('ok hreport')}catch(e){console.log('hr fail',e.message.split('\n')[0])}
await b.close()})();
