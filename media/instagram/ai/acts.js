const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.request.post('http://localhost:8099/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
await p.goto('http://localhost:8099/');await p.waitForTimeout(2500);
await p.evaluate(()=>A.openCase('k1'));await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.$$eval('[data-act]',e=>[...new Set(e.map(x=>x.dataset.act+(x.dataset.v?'='+x.dataset.v:'')))].slice(0,120))));
console.log(Object.keys(A).filter(k=>/intake|wizard|new|step|study|conflict|Case/i.test(k)).join(' '));
await b.close()})();
