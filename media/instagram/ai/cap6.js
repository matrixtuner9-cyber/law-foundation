const { chromium } = require('playwright');
const B='http://localhost:8099', OUT='/home/claude/ig/ai/k7h/'; require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:4,locale:'ar'});
 const p=await ctx.newPage();
 await p.request.post(B+'/api/auth/login',{data:{username:'demo',password:'Demo-Pass-2026!'}});
 await p.goto(B+'/'); await p.waitForTimeout(2500);
 const drawer=await p.evaluate(()=>{const h=[...document.querySelectorAll('*')].find(x=>x.textContent.trim()==='ما يحتاج انتباهك');let n=h;while(n&&getComputedStyle(n).position!=='fixed')n=n.parentElement;if(n)n.id='attnDrawer';return !!n});
 if(drawer){const d=await p.$('#attnDrawer'); await d.screenshot({path:OUT+'drawer.png'})}
 await p.evaluate(()=>{const n=document.getElementById('attnDrawer');const btn=n&&n.querySelector('button');if(btn)btn.click()});
 await p.waitForTimeout(500);
 const unst=()=>p.evaluate(()=>{for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if(cs.position==='sticky'||(cs.position==='fixed'&&el.getBoundingClientRect().top<200))el.style.visibility='hidden'}});
 const el=async(sel,n,i=0)=>{const es=await p.$$(sel); if(!es[i]){console.log('miss',n);return} await es[i].scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await es[i].screenshot({path:OUT+n+'.png'}); console.log('ok',n)};
 await p.evaluate(()=>A.openCase('k7')); await p.waitForTimeout(1500); await unst();
 await el('.panel','hubfirst');
 await p.click('[data-act="caseTab"][data-v="track"]'); await p.waitForTimeout(1500); await unst();
 await p.fill('#dD','2026-09-30'); await p.dispatchEvent('#dD','input'); await p.dispatchEvent('#dD','change'); await p.waitForTimeout(600);
 await el('#fDec','decform'); await el('#decPrev','decprev');
 await el('.decs > *','deccard');
 await b.close();
})();
