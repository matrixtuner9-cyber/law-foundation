// جامع دليل المحامين من الصفحة العامة لنقابة المحامين الفلسطينيين (palestinebar.ps/ar/lawyers)
// يتصفح الصفحة كما يراها الزائر، صفحةً صفحة بتمهّل، ويأخذ الحقول المعروضة فقط:
// الاسم، رقم العضوية، حالة العضوية، المدينة، المكتب وعنوانه، الهاتف، البريد.
// الاستخدام: node bar/crawler.js <مجلد البيانات> [--pages N]
const fs = require('fs'), path = require('path');
const DATA = process.argv[2] || path.join(__dirname, '..', 'data');
const LIMIT = (() => { const i = process.argv.indexOf('--pages'); return i > 0 ? +process.argv[i + 1] : 0 })();
const OUT_DIR = path.join(DATA, 'bar'); fs.mkdirSync(OUT_DIR, { recursive: true });
const URL = 'https://palestinebar.ps/ar/lawyers', PAUSE = 1500;
const say = o => process.stdout.write(JSON.stringify(o) + '\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const { chromium } = require('playwright-core');
  let b; try { b = await chromium.launch({ channel: 'chrome', headless: true }) } catch (e) { b = await chromium.launch({ channel: 'msedge', headless: true }) }
  const p = await b.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36 Mithaq-LawOffice-Directory' });
  await p.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForSelector('.person_card', { timeout: 60000 });
  const total = await p.$$eval('#pagination .pagination__btn', bs => Math.max(...bs.map(b => +b.dataset.page || 0)));
  const pages = LIMIT ? Math.min(LIMIT, total) : total;
  say({ stage: 'start', total, pages });
  const extract = () => [...document.querySelectorAll('.person_card')].map(c => {
    const t = s => ((c.querySelector(s) || {}).textContent || '').trim();
    const info = {}; c.querySelectorAll('.person_card__list li').forEach(li => { const l = ((li.querySelector('.label') || {}).textContent || '').trim(), v = ((li.querySelector('.value') || {}).textContent || '').trim(); if (l) info[l] = v });
    return { name: t('h3'), status: t('.person_card__badge'), mno: (t('.person_card__id').match(/[A-Za-z]*\d+/) || [''])[0], info,
      phones: [...c.querySelectorAll('a[href^="tel:"]')].map(a => a.textContent.trim()).filter(Boolean),
      email: ((c.querySelector('a[href^="mailto:"]') || {}).textContent || '').trim() };
  });
  const all = new Map(); let page = 1, fails = 0;
  while (page <= pages) {
    const rows = await p.evaluate(extract);
    rows.forEach(r => { if (r.mno) all.set(r.mno, { ...r, page }) });
    say({ stage: 'page', page, pages, got: rows.length, total: all.size });
    if (page === pages) break;
    const first = rows[0] && rows[0].mno;
    try {
      await p.click('#pagination .pagination__btn:last-of-type');
      await p.waitForFunction(f => { const x = document.querySelector('.person_card__id'); return x && !x.textContent.includes(f) }, first, { timeout: 30000 });
      await p.waitForTimeout(400); page++; fails = 0;
    } catch (e) {
      if (++fails > 3) { say({ stage: 'warn', msg: 'تعذّر الانتقال بعد الصفحة ' + page }); break }
      await sleep(4000);
    }
    await sleep(PAUSE);
  }
  await b.close();
  const list = [...all.values()], fetchedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT_DIR, 'lawyers.json'), JSON.stringify({ fetchedAt, source: URL, pages: page, total: list.length, lawyers: list }), 'utf8');
  say({ done: true, ok: true, total: list.length, pages: page });
})().catch(e => { say({ done: true, ok: false, error: e.message }); process.exit(1) });
