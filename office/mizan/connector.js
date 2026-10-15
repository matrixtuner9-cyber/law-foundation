// موصل ميزان 2: يفتح متصفحاً آلياً، يسجّل الدخول بحساب المحامي، ويقرأ صفحات القضايا
// يعمل كعملية منفصلة يطلقها الخادم، ويُبلغ عن تقدّمه بأسطر JSON
// الاستخدام: node connector.js test|capture [--show]
const fs = require('fs'), path = require('path');
const vault = require('./vault');
const mode = process.argv[2] || 'test', show = process.argv.includes('--show');
const LOGIN = process.env.MIZAN_URL || 'https://courts.gov.ps/EServices2020/account/login';
const PROFILE = path.join(vault.DIR, 'browser-profile');
const out = o => process.stdout.write(JSON.stringify(o) + '\n');
const step = (stage, msg) => out({ stage, msg });
const isLogin = u => /account\/login/i.test(String(u));

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright-core')) } catch (e) { throw new Error('مكتبة المتصفح الآلي غير مثبتة. شغّل npm install داخل مجلد Mithaq.') }
  const creds = vault.load(); if (!creds) throw new Error('لم تُحفظ بيانات الدخول إلى ميزان بعد.');

  step('browser', 'تشغيل المتصفح الآلي…');
  const exe = process.env.MQ_CHROME;
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: !show, locale: 'ar', viewport: { width: 1320, height: 900 },
    ...(exe ? { executablePath: exe } : process.platform === 'win32' ? { channel: 'chrome' } : {}),
  });
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    page.setDefaultTimeout(30000);
    step('open', 'فتح صفحة الدخول إلى ميزان 2…');
    await page.goto(LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if (!isLogin(page.url())) step('session', 'الجلسة السابقة ما زالت فعّالة، لا حاجة لإعادة الدخول.');
    else {
      const pass = page.locator('input[type=password]').first();
      await pass.waitFor({ state: 'visible' });
      const user = page.locator('input[type=text]:visible, input[type=number]:visible, input[type=tel]:visible, input:not([type]):visible').first();
      step('fill', 'إدخال رقم العضوية وكلمة المرور…');
      await user.fill(creds.username);
      await pass.fill(creds.password);
      // الدخول كـ «حارس العدالة» (المحامي)
      const sel = page.locator('select').first();
      if (await sel.count()) {
        const opts = await sel.locator('option').allTextContents();
        const i = opts.findIndex(o => o.includes('حارس'));
        if (i >= 0) await sel.selectOption({ index: i }, { force: true });
      }
      const cb = page.locator('input[type=checkbox]').first();
      if (await cb.count()) await cb.check({ force: true }).catch(() => {});
      step('submit', 'إرسال بيانات الدخول…');
      const btn = page.locator('button:has-text("تسجيل الدخول"), input[type=submit][value*="تسجيل الدخول"], a:has-text("تسجيل الدخول")').first();
      await btn.click();
      if (show) step('wait', 'إن طلب الموقع رمز تحقق أو توقيعاً، أكمله في نافذة المتصفح…');
      const ok = await page.waitForURL(u => !isLogin(u), { timeout: show ? 180000 : 25000 }).then(() => true).catch(() => false);
      if (!ok) {
        const err = (await page.locator('.validation-summary-errors, .field-validation-error, .text-danger, .alert-danger, .alert, .error, [style*="color:Red"], [style*="color: red"]').allTextContents().catch(() => []))
          .map(s => s.trim()).filter(Boolean).join(' · ');
        throw new Error(err || 'لم يتم الدخول. تحقق من رقم العضوية وكلمة المرور.');
      }
    }
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const title = (await page.title().catch(() => '')) || '';
    step('in', 'تم الدخول إلى ميزان 2' + (title ? ' · ' + title : ''));

    if (mode === 'capture') await capture(page);
    out({ done: true, ok: true, mode, at: new Date().toISOString() });
  } finally { await ctx.close().catch(() => {}) }
}

// يحفظ نسخة محلية من صفحات القضايا لبناء قارئ الحقول (تبقى على هذا الجهاز فقط)
async function capture(page) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(vault.DIR, 'capture', stamp); fs.mkdirSync(dir, { recursive: true });
  const pages = [];
  async function snap(name) {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    fs.writeFileSync(path.join(dir, name + '.html'), await page.content());
    await page.screenshot({ path: path.join(dir, name + '.png'), fullPage: true }).catch(() => {});
    const links = await page.$$eval('a[href]', as => as.map(a => ({ t: (a.innerText || a.title || '').trim().replace(/\s+/g, ' '), h: a.href })).filter(x => x.t && !x.h.startsWith('javascript:void')));
    pages.push({ name, url: page.url(), title: await page.title().catch(() => ''), links: links.length });
    return links;
  }
  step('capture', 'حفظ الصفحة الرئيسية بعد الدخول…');
  const links = await snap('00-home');
  const want = /قضاي|قضية|دعاو|دعوى|ملف|جلس|موكل|وكال|أحكام|قرار|تبليغ|Case|Session/i;
  const seen = new Set(), targets = links.filter(l => want.test(l.t) && !/خروج|logout/i.test(l.t) && !seen.has(l.h) && seen.add(l.h)).slice(0, 10);
  for (const [i, l] of targets.entries()) {
    step('capture', `قراءة صفحة «${l.t.slice(0, 40)}»…`);
    try { await page.goto(l.h, { waitUntil: 'domcontentloaded', timeout: 45000 }); await snap(String(i + 1).padStart(2, '0') + '-' + l.t.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)) }
    catch (e) { step('capture', 'تعذّر فتح «' + l.t.slice(0, 40) + '»') }
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ at: new Date().toISOString(), pages, menu: links }, null, 1));
  out({ stage: 'captured', msg: `حُفظت ${pages.length} صفحات من ميزان على هذا الجهاز`, dir, count: pages.length });
}

main().catch(e => { out({ done: true, ok: false, error: String(e && e.message || e).split('\n')[0] }); process.exitCode = 1 });
