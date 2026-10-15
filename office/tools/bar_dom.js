// يفحص بنية بطاقات المحامين المعروضة وأدوات التنقل في الصفحة العامة
const fs = require('fs'), out = [];
const { chromium } = require('D:\\Mithaq\\node_modules\\playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto('https://palestinebar.ps/ar/lawyers', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => {
    const tel = [...document.querySelectorAll('a[href^="tel:"]')];
    const card = tel.length ? tel[0].closest('div,li,article,tr') : null;
    let c = card; for (let i = 0; i < 4 && c && c.parentElement && c.parentElement.children.length < 3; i++) c = c.parentElement;
    const btns = [...document.querySelectorAll('button,a')].map(x => x.textContent.trim()).filter(t => /المزيد|التالي|السابق|صفحة|more|next|^\d+$/i.test(t)).slice(0, 20);
    const txt = document.body.innerText; const memb = (txt.match(/L\d{5}/g) || []).length;
    return { telLinks: tel.length, memberships: memb, cardHTML: c ? c.outerHTML.slice(0, 1500) : null, cardClass: c && c.className, parentClass: c && c.parentElement && c.parentElement.className, siblings: c && c.parentElement ? c.parentElement.children.length : 0, btns };
  });
  out.push(JSON.stringify(info, null, 1));
  const before = info.memberships;
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(3500);
  const after = await p.evaluate(() => (document.body.innerText.match(/L\d{5}/g) || []).length);
  out.push('after scroll memberships: ' + before + ' -> ' + after);
  const more = await p.$$eval('button,a', xs => xs.filter(x => /المزيد|التالي|more|next/i.test(x.textContent)).map(x => x.outerHTML.slice(0, 200)));
  out.push('more/next controls: ' + JSON.stringify(more));
  await b.close();
})().catch(e => out.push('ERR ' + e.message)).finally(() => fs.writeFileSync('D:\\Mithaq\\tools\\bar_dom.txt', out.join('\n'), 'utf8'));
