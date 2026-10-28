const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto('file:///home/claude/ig/posts.html'); await p.waitForTimeout(1500); await p.evaluate(() => document.fonts.ready);
  const ids = await p.$$eval('section.post', s => s.map(x => x.id));
  require('fs').mkdirSync('/home/claude/ig/out', { recursive: true });
  for (const id of ids) { const el = await p.$('#' + id); await el.screenshot({ path: `/home/claude/ig/out/${id}.png` }) }
  console.log(ids.join(' ')); await b.close();
})();
