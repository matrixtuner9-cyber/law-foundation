const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.request.post('http://localhost:8099/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
await p.goto('http://localhost:8099/');await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.$$eval('[data-act="nav"]',e=>e.map(x=>x.dataset.v+':'+x.textContent.trim()))));
await p.evaluate(()=>A.openCase('k1'));await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.$$eval('[data-act="caseTab"]',e=>e.map(x=>x.dataset.v+':'+x.textContent.trim()))));
await b.close()})();
