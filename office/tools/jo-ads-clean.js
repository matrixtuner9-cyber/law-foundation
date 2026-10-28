// تنظيف أحكام التمييز الأردنية المأخوذة من مدوّنات مكاتب المحاماة (أكثرها من موقع مكتب محاماة أردني) من الإعلانات:
// بيانات التواصل والهواتف والعناوين والروابط المختصرة، وقائمة «مقالات أخرى» في آخر الصفحة (Section Title / By … / تاريخ / Read More)،
// وعبارات الدعاية في العنوان («أفضل محامي …»). نص القرار والمبادئ والشرح القانوني لا يُمس.
'use strict';

const MONTHS = 'يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر';
/* سطر إعلاني كامل يُحذف أينما وقع */
const AD_LINE = new RegExp([
  'العبادي', 'مكتبنا', 'مكاتبنا', 'موقعنا', 'تواصل\\s*معنا', 'راسلنا', 'اتصل\\s*بنا', 'إتصل\\s*بنا', '(?:تواصل|راسلنا|معنا)[^\\n]{0,30}(?:الواتس|واتس|whats\\s*app)', '^\\s*[–-]?\\s*(?:و\\s*)?(?:بواسطة\\s+)?الواتس\\s*آب\\s*[،,]?\\s*$',
  'bit\\.ly', 'khaberni', 'alabbadi', '^\\s*section title\\s*$', '^\\s*read more\\s*$', '^\\s*by\\s+[a-z][a-z .]+$',
  '(?:\\+?00962|\\b0?7[789]\\d{7}\\b|\\b06\\d{7}\\b)', 'عقاركو', 'بوليفارد\\s+العبدلي', 'الطابق\\s+رقم\\s+\\d+\\s*،?\\s*مكتب\\s+رقم',
  '^\\s*(?:محامي|محامٍ)\\s+(?:في\\s+)?الأردن\\s*$', '^\\s*مكتب\\s+محاماة\\s+في\\s+الأردن\\s*$', '^\\s*(?:رقم\\s+)?محامي\\s+(?:مختص|في\\s+الأردن)',
  '^\\s*معلومات\\s+قانونية\\s+(?:مهمة|يومية)\\s*$', '^\\s*قرارات\\s+تمييز\\s+هيئة\\s+عامة\\s*(?:,\\s*معلومات\\s+قانونية\\s+يومية)?\\s*$',
  `^\\s*(?:${MONTHS})\\s+\\d{1,2}\\s*,\\s*\\d{4}\\s*$`,
].join('|'), 'i');
/* بداية قائمة «مقالات أخرى» في آخر الصفحة: كل ما بعدها ليس من القرار */
const TAIL_START = /^\s*(?:section title|مقالات\s+ذات\s+صلة|اقرأ\s+أيضا|اقرأ\s+أيضاً)\s*$/i;
/* عنصر من قائمة المقالات: عنوان، ثم By …، ثم تاريخ، ثم تصنيف، ثم مقتطف ينتهي بـ «...»، ثم Read More */
const BY = /^\s*by\s+[a-z]/i, DATE = new RegExp(`^\\s*(?:${MONTHS})\\s+\\d{1,2}\\s*,\\s*\\d{4}\\s*$`), TEASER = /(?:\.\.\.|…)\s*$/;

function cleanBody(body) {
  let lines = String(body ?? '').split('\n');
  const t = lines.findIndex(l => TAIL_START.test(l)); if (t >= 0) lines = lines.slice(0, t);
  /* عناصر قائمة المقالات بلا عنوان «Section Title»: السطر الذي يليه By … هو عنوان مقال آخر */
  const drop = new Set();
  lines.forEach((l, i) => {
    if (!BY.test(l)) return; drop.add(i);
    for (let k = i - 1; k >= Math.max(0, i - 3); k--) { if (lines[k].trim()) { drop.add(k); break } }
    for (let k = i + 1; k < Math.min(lines.length, i + 10); k++) { const s = lines[k].trim(); if (!s) continue; if (DATE.test(s) || TEASER.test(s) || /^read more$/i.test(s) || AD_LINE.test(s) || s.length < 40) { drop.add(k); if (/^read more$/i.test(s)) break } else break }
  });
  const out = lines.filter((l, i) => !drop.has(i) && !AD_LINE.test(l));
  return out.join('\n').replace(/^[ \t ]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

/* العنوان: «دمج عقوبات | أفضل محامي دمج عقوبات | أحدث قرار بدمج العقوبات» ← «دمج عقوبات | أحدث قرار بدمج العقوبات» */
function cleanTitle(title) {
  /* مقاطع «| …» فيها محامٍ أو مكتب محاماة، ومقاطع «/ محامي …» القصيرة (دعاية لا موضوع) */
  const seo = p => /^(?:أفضل\s+|إسأل\s+|اسأل\s+)?(?:محامي|محامين|محامية|محام)(?:\s+\S+){0,3}$/.test(p.trim());
  const segs = String(title ?? '').split(/\s*\|\s*/).map(p => p.split(/\s+\/\s+/).filter(x => x && !seo(x)).join(' / ')).filter(Boolean);
  const keep = segs.length > 1 ? segs.filter(p => !/محام|مكتب\s+محاماة|العبادي/.test(p)) : segs;
  return (keep.length ? keep : segs.slice(0, 1)).join(' | ').trim();
}
const HAS_AD = /العبادي|bit\.ly|By mohammad|Read More|Section Title|00962|واتس|عقاركو|alabbadi|محامي/i;

module.exports = { cleanBody, cleanTitle, HAS_AD, AD_LINE };
