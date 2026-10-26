// يولّد أيقونة «المِسْبار» (512×512) من رسم متجه: ميزان ذهبي داخل حلقة مضيئة على كحلي داكن — تظهر على سطح المكتب وقائمة ابدأ وشريط المهام
// التشغيل: node electron/make-icon.js   (يحتاج متصفح Chromium عبر playwright-core)
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs>
 <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B3654"/><stop offset=".55" stop-color="#0B1B2B"/><stop offset="1" stop-color="#050E18"/></linearGradient>
 <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="0" y1="90" x2="0" y2="420"><stop offset="0" stop-color="#F6DFA3"/><stop offset=".5" stop-color="#E2BC6A"/><stop offset="1" stop-color="#B8893A"/></linearGradient>
 <radialGradient id="glow" cx=".5" cy=".42" r=".5"><stop offset="0" stop-color="#F3D58A" stop-opacity=".28"/><stop offset="1" stop-color="#F3D58A" stop-opacity="0"/></radialGradient>
 <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>
</defs>
<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#g)"/>
<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#glow)"/>
<rect x="30" y="30" width="452" height="452" rx="100" fill="none" stroke="url(#b)" stroke-opacity=".35" stroke-width="3"/>
<circle cx="256" cy="256" r="172" fill="none" stroke="url(#b)" stroke-width="10" filter="url(#sh)"/>
<circle cx="256" cy="256" r="150" fill="none" stroke="#F3D58A" stroke-opacity=".18" stroke-width="2"/>
<g filter="url(#sh)" stroke="url(#b)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none">
 <path d="M256 150v212"/><path d="M186 382h140"/><path d="M212 362h88"/>
 <path d="M136 176h240"/>
 <path d="M148 180l-40 86h80z" stroke-width="10"/><path d="M364 180l-40 86h80z" stroke-width="10"/>
 <path d="M100 274a48 48 0 0 0 96 0"/><path d="M316 274a48 48 0 0 0 96 0"/>
</g>
<g fill="url(#b)"><circle cx="256" cy="150" r="17"/><circle cx="148" cy="178" r="8"/><circle cx="364" cy="178" r="8"/></g>
<path d="M232 118l24-26 24 26" fill="none" stroke="#F6DFA3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
</svg>`;
(async () => {
  const b = await chromium.launch({ channel: process.platform === 'win32' ? 'chrome' : undefined, executablePath: process.env.MQ_CHROME });
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({ path: path.join(__dirname, 'icon.png'), omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
  await b.close(); console.log('icon.png ready');
})();
