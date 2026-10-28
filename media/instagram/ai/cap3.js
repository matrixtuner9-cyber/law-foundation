const { chromium } = require('playwright');
const B='http://localhost:8099', OUT='/home/claude/ig/ai/k7/'; require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:2,locale:'ar'});
 const p=await ctx.newPage();
 await p.request.post(B+'/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
 await p.goto(B+'/'); await p.waitForTimeout(2500);
 await p.screenshot({path:OUT+'home-attn.png'});
 await p.evaluate(()=>{const h=[...document.querySelectorAll('*')].find(x=>x.textContent.trim()==='ما يحتاج انتباهك');let n=h;while(n&&getComputedStyle(n).position!=='fixed')n=n.parentElement;const btn=n&&n.querySelector('button');if(btn)btn.click()});
 await p.waitForTimeout(500);
 await p.evaluate(()=>A.openCase('k7')); await p.waitForTimeout(1500);
 await p.screenshot({path:OUT+'hub.png',fullPage:true});
 await p.click('[data-act="caseTab"][data-v="track"]'); await p.waitForTimeout(1500);
 await p.screenshot({path:OUT+'track.png',fullPage:true});
 await b.close();
})();
