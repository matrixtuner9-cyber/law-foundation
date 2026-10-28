// لقطات حقيقية من «المِسْبار» ببيانات نموذجية لاستعمالها في منشورات انستغرام
const { chromium } = require('playwright');
const B = 'http://localhost:8099', OUT = '/home/claude/ig/raw/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'ar' });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.request.post(B + '/api/auth/login', { data: { username: 'demo', password: 'Demo-Pass-2026!' } });
  await p.goto(B + '/'); await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT + 'attention.png' });
  /* إغلاق درج الانتباه */
  await p.evaluate(() => { const h = [...document.querySelectorAll('*')].find(x => x.textContent.trim() === 'ما يحتاج انتباهك'); let n = h; while (n && getComputedStyle(n).position !== 'fixed') n = n.parentElement; const btn = n && n.querySelector('button'); if (btn) btn.click() });
  await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + 'dash.png' });
  const shot = async (sel, name, wait = 1500) => { try { await p.click(sel, { timeout: 4000 }); await p.waitForTimeout(wait); await p.screenshot({ path: OUT + name + '.png' }); console.log('ok', name) } catch (e) { console.log('fail', name, e.message.split('\n')[0]) } };
  await shot('[data-act="openCase"][data-v="k1"]', 'case');
  await p.goto(B + '/'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const h = [...document.querySelectorAll('*')].find(x => x.textContent.trim() === 'ما يحتاج انتباهك'); let n = h; while (n && getComputedStyle(n).position !== 'fixed') n = n.parentElement; const btn = n && n.querySelector('button'); if (btn) btn.click() });
  await p.waitForTimeout(500);
  for (const [v, name] of [['lawlib', 'lawlib'], ['calc', 'calc'], ['agenda', 'agenda'], ['rulings', 'rulings'], ['misbar', 'misbar'], ['chats', 'chats'], ['bar', 'bar']]) await shot(`[data-act="nav"][data-v="${v}"]`, name);
  await b.close();
})();
