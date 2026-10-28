const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,locale:'ar'})).newPage();
await p.request.post('http://localhost:8099/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
await p.goto('http://localhost:8099/');await p.waitForTimeout(2500);
await p.evaluate(()=>{const h=[...document.querySelectorAll('*')].find(x=>x.textContent.trim()==='ما يحتاج انتباهك');let n=h;while(n&&getComputedStyle(n).position!=='fixed')n=n.parentElement;const btn=n&&n.querySelector('button');if(btn)btn.click()});
await p.click('[data-act="nav"][data-v="chats"]');await p.waitForTimeout(1500);
const acts=await p.$$eval('[data-act]',e=>[...new Set(e.map(x=>x.dataset.act))]);console.log(acts.join(' '));
const it=await p.$('[data-act="waOpen"]');
if(it){await it.click();await p.waitForTimeout(1500)}
await p.screenshot({path:'/home/claude/ig/ai/tour/chats2.png'});await b.close()})();
