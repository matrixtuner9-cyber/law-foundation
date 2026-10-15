const fs = require('fs'), out = [];
const { chromium } = require('D:\\Mithaq\\node_modules\\playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto('https://palestinebar.ps/ar/lawyers', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.person_card')];
    const withPhone = cards.find(c => c.querySelector('a[href^="tel:"]'));
    const noPhone = cards.find(c => !c.querySelector('a[href^="tel:"]'));
    const pages = [...document.querySelectorAll('.pagination__btn')].map(b => b.dataset.page + ':' + b.textContent.trim());
    const pag = document.querySelector('.pagination__btn') && document.querySelector('.pagination__btn').parentElement.outerHTML.slice(0, 1200);
    return { n: cards.length, withPhone: withPhone && withPhone.outerHTML.replace(/\s+/g, ' ').slice(0, 2500), noPhone: noPhone && noPhone.outerHTML.replace(/\s+/g, ' ').slice(0, 1200), pages, pag };
  });
  out.push(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => out.push('ERR ' + e.message)).finally(() => fs.writeFileSync('D:\\Mithaq\\tools\\bar_dom2.txt', out.join('\n'), 'utf8'));
