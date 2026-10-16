// نسختا ميثاق من الكود نفسه:
//   «ميثاق خاص»  (private)   — بيانات المكتب لا تغادر الجهاز: لا إنترنت ولا بوابة موكلين ولا إشعارات ولا ميزان ولا بحث خارجي.
//   «ميثاق متصل» (connected) — النسخة الكاملة: بوابة الموكلين وتطبيقهم والإشعارات وميزان والبحث في الأحكام والسحابة.
// تُحدَّد النسخة عند البناء بملف edition.json بجانب server.js (يكتبه أمر بناء النسخة الخاصة)، ويمكن فرضها بـ MQ_EDITION أو MQ_OFFLINE=1.
'use strict';
const fs = require('fs'), path = require('path');
const EDITIONS = {
  private: { id: 'private', name: 'ميثاق خاص', tagline: 'بياناتك لا تغادر مكتبك', offline: true },
  connected: { id: 'connected', name: 'ميثاق متصل', tagline: 'مكتبك وموكّلوك على اتصال دائم', offline: false },
};
/* الميزات التي تحتاج الإنترنت، وتُخفى وتُغلق في النسخة الخاصة */
const ONLINE_FEATURES = ['portal', 'push', 'mizan', 'judgmentSearch', 'rulingImport', 'barRefresh', 'externalLinks'];

function detect(env = process.env, root = path.join(__dirname, '..')) {
  const forced = String(env.MQ_EDITION || '').toLowerCase();
  if (EDITIONS[forced]) return forced;
  if (env.MQ_OFFLINE === '1') return 'private';
  try { const j = JSON.parse(fs.readFileSync(path.join(root, 'edition.json'), 'utf8')); if (EDITIONS[j.edition]) return j.edition } catch (e) {}
  return 'connected';
}
function load(env, root) {
  const e = EDITIONS[detect(env, root)];
  const features = Object.fromEntries(ONLINE_FEATURES.map(f => [f, !e.offline]));
  return { ...e, features, pub: () => ({ id: e.id, name: e.name, tagline: e.tagline, offline: e.offline, features }) };
}
module.exports = { load, detect, EDITIONS, ONLINE_FEATURES };
