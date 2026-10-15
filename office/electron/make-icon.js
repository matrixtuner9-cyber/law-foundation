// يولّد أيقونة التطبيق (512×512) من رسم متجه: ختم الميزان النحاسي على خلفية خضراء
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E5A4C"/><stop offset=".55" stop-color="#11302A"/><stop offset="1" stop-color="#0A1F1A"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0CF8A"/><stop offset="1" stop-color="#C99A46"/></linearGradient></defs>
<rect x="16" y="16" width="480" height="480" rx="108" fill="url(#g)"/>
<circle cx="256" cy="256" r="168" fill="none" stroke="url(#b)" stroke-width="12"/>
<g transform="translate(256 262) scale(9.2) translate(-12 -12)" fill="none" stroke="url(#b)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 3v17M7 20h10M4 7h16M6 7l-3 6a3 3 0 0 0 6 0L6 7zm12 0l-3 6a3 3 0 0 0 6 0l-3-6z"/></g></svg>`;
(async () => {
  const b = await chromium.launch({ channel: process.platform === 'win32' ? 'chrome' : undefined, executablePath: process.env.MQ_CHROME });
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({ path: path.join(__dirname, 'icon.png'), omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
  await b.close(); console.log('icon.png ready');
})();
