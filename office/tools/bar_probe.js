// استكشاف: يفتح صفحة محامي النقابة ويسجّل طلبات البيانات التي تحمّل القائمة
const fs = require('fs');
const { chromium } = require('D:\\Mithaq\\node_modules\\playwright-core');
const OUT = 'D:\\Mithaq\\tools\\bar_probe.txt', log = [];
(async () => {
  let b;
  try { b = await chromium.launch({ channel: 'chrome', headless: true }) } catch (e) { b = await chromium.launch({ channel: 'msedge', headless: true }) }
  const p = await b.newPage();
  p.on('response', async r => {
    const u = r.url(), t = (r.headers()['content-type'] || '');
    if (/\.(png|jpe?g|svg|gif|woff2?|ttf|css)(\?|$)/i.test(u)) return;
    let body = ''; try { if (/json|text\/plain|javascript/.test(t) && !/\.js(\?|$)/.test(u)) body = (await r.text()).slice(0, 1500) } catch (e) {}
    log.push(`${r.request().method()} ${r.status()} ${t.split(';')[0]} ${u}\n  POST:${(r.request().postData() || '').slice(0, 300)}\n  ${body.replace(/\s+/g, ' ')}`);
  });
  await p.goto('https://palestinebar.ps/ar/lawyers', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(3000);
  const sel = await p.$$eval('select', ss => ss.map(s => ({ name: s.name, id: s.id, opts: [...s.options].slice(0, 30).map(o => o.value + '=' + o.textContent.trim()) })));
  log.push('SELECTS ' + JSON.stringify(sel));
  const txt = (await p.innerText('body')).slice(0, 2500);
  log.push('BODY ' + txt.replace(/\s+/g, ' '));
  if (sel.length && sel[0].opts.length > 1) { await p.selectOption('select', { index: 1 }).catch(() => {}); await p.waitForTimeout(4000); log.push('AFTER SELECT ' + (await p.innerText('body')).slice(0, 1500).replace(/\s+/g, ' ')) }
  await b.close();
})().catch(e => log.push('ERR ' + e.message)).finally(() => fs.writeFileSync(OUT, log.join('\n'), 'utf8'));
