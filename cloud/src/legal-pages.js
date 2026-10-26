// نسخة السحابة — تُولَّد من office/lib/legal-pages.js
/* صفحات عامة يطلبها متجر Apple لتطبيق الموكل: سياسة الخصوصية، والدعم، وملف ربط الروابط العامة (Universal Links)
   تُخدَم من خادم كل مكتب (والسحابة) دون تسجيل دخول، ولا تحوي أي بيانات موكلين. */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shell = (title, body) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{margin:0;background:#F9F6EF;color:#111B27;font:16px/1.85 Cairo,Tahoma,sans-serif}main{max-width:820px;margin:0 auto;padding:32px 20px 60px}h1{font-size:28px;margin:0 0 4px}h2{font-size:19px;margin:28px 0 6px;color:#0B1B2B}p,li{color:#2b3445}.m{color:#6B7280;font-size:14px}.box{background:#fff;border:1px solid #EADCC6;border-radius:14px;padding:16px 18px;margin:16px 0}a{color:#8B6F3D}hr{border:0;border-top:1px solid #EADCC6;margin:36px 0}[dir=ltr]{text-align:left}@media(prefers-color-scheme:dark){body{background:#0B1220;color:#EEE8DA}p,li{color:#C9CFDB}h2{color:#E8CD8B}.box{background:#152036;border-color:#26344F}.m{color:#A9B2C5}hr{border-color:#26344F}a{color:#E8CD8B}}</style></head><body><main>${body}</main></body></html>`;
const contact = o => [o.phone && `الهاتف: <span dir="ltr">${esc(o.phone)}</span>`, o.email && `البريد: <a href="mailto:${esc(o.email)}">${esc(o.email)}</a>`, o.city && `المدينة: ${esc(o.city)}`, o.hours && `ساعات الدوام: ${esc(o.hours)}`].filter(Boolean).join('<br>');

function privacyPage(o = {}) {
  const name = esc(o.name || 'المكتب');
  return shell('سياسة الخصوصية — تطبيق المِسْبار للموكلين', `<h1>سياسة الخصوصية</h1><p class="m">تطبيق «المِسْبار — بوابة الموكل» · ${name} · آخر تحديث: ${esc(o.updated || '2026-10-21')}</p>
<div class="box">تطبيق «المِسْبار» بوابة خاصة يقدّمها ${name} لموكليه فقط، لمتابعة قضاياهم ومراسلة المكتب. لا يُستخدم للإعلانات، ولا يتتبّع المستخدم، ولا تُباع بياناته أو تُشارك لأغراض تسويقية.</div>
<h2>1. من المسؤول عن بياناتك؟</h2><p>${name} هو الجهة المسؤولة عن بياناتك (المتحكّم بالبيانات)، وهو من ينشئ حسابك ويمنحك رمز الدخول. تُحفظ البيانات على خادم المكتب أو خادمه السحابي الخاص.</p>
<h2>2. ما البيانات التي يعالجها التطبيق؟</h2><ul>
<li><b>بيانات الحساب:</b> اسمك، ورمز الدخول، وأرقام التواصل التي يسجّلها المكتب أو تحدّثها أنت من الإعدادات.</li>
<li><b>بيانات قضاياك:</b> أرقام القضايا والمحاكم والجلسات والمراحل والمستندات التي يختار المكتب مشاركتها معك.</li>
<li><b>المراسلات:</b> الرسائل النصية والرسائل الصوتية والصور والمستندات التي ترسلها إلى المكتب أو تصلك منه.</li>
<li><b>الإشعارات:</b> رمز إشعارات الجهاز (من Apple) ليصلك تنبيه برسائل المكتب ومواعيد الجلسات.</li>
<li><b>الأذونات:</b> الميكروفون (لتسجيل رسالة صوتية)، والكاميرا ومكتبة الصور والملفات (لإرسال مستند)، وبصمة الوجه أو الإصبع (لقفل التطبيق إن فعّلته). لا تُستخدم إلا عند طلبك، والبصمة لا تغادر جهازك.</li></ul>
<p>لا يجمع التطبيق موقعك الجغرافي، ولا جهات اتصالك، ولا يستخدم أدوات تحليل أو تتبّع من أطراف ثالثة.</p>
<h2>3. لماذا نعالجها؟</h2><p>لتقديم الخدمة القانونية لك فقط: عرض حالة قضاياك ومواعيدها، وتبادل الرسائل والمستندات مع محاميك، وتذكيرك بالجلسات.</p>
<h2>4. مع من تُشارك؟</h2><ul>
<li><b>مزوّد الاستضافة:</b> إن كان المكتب يستخدم الخادم السحابي فتُحفظ البيانات لدى Cloudflare بصفته مزوّد خدمة.</li>
<li><b>Apple:</b> لإيصال الإشعارات إلى جهازك (يُرسل نص التنبيه فقط).</li>
<li><b>أدوات المكتب الاختيارية:</b> قد يستخدم المحامي أدوات ذكاء اصطناعي أو تحويل نص إلى كلام لمساعدته في عمله، ويقرر المكتب ذلك على مسؤوليته وفق التزامه بسرية المهنة.</li>
<li><b>الجهات المختصة:</b> فقط إن أوجب القانون ذلك.</li></ul>
<h2>5. الحماية والسرية</h2><p>الاتصال مشفّر (HTTPS)، والوصول إلى بياناتك محصور برمز الدخول الخاص بك وبموظفي المكتب المخوّلين، وتخضع المراسلات لواجب السرية المهنية للمحامي. لا تشارك رمز الدخول مع أحد.</p>
<h2>6. مدة الحفظ وحقوقك</h2><p>تُحفظ البيانات طوال مدة التوكيل وما يلزم قانوناً بعدها. يحق لك طلب نسخة من بياناتك أو تصحيحها أو حذفها أو إيقاف حسابك، بمراسلة المكتب من داخل التطبيق أو عبر وسائل التواصل أدناه. حذف التطبيق من هاتفك يمحو بياناته المحلية.</p>
<h2>7. الأطفال</h2><p>التطبيق موجّه للموكلين البالغين، أو لأولياء الأمور نيابة عن القاصرين.</p>
<h2>8. التواصل</h2><div class="box">${name}<br>${contact(o) || 'راسل المكتب من داخل التطبيق.'}</div>
<hr><div dir="ltr"><h2>Privacy Policy (summary)</h2><p>“Mithaq — Client Portal” is a private app provided by ${name} to its own clients. The law office is the data controller. The app processes the client’s account details, case information shared by the office, messages, voice notes and documents exchanged with the office, and the device push token. Microphone, camera, photos and biometrics are used only when the user acts, and biometric data never leaves the device. No advertising, tracking, analytics SDKs, location or contacts. Data is shared only with service providers needed to run the service (hosting, Apple Push Notification service), with optional tools the office chooses to use under professional confidentiality, or when required by law. Users can request access, correction or deletion by contacting the office from inside the app.</p></div>`);
}
function supportPage(o = {}) {
  const name = esc(o.name || 'المكتب');
  return shell('الدعم — تطبيق المِسْبار للموكلين', `<h1>الدعم والمساعدة</h1><p class="m">تطبيق «المِسْبار — بوابة الموكل» · ${name}</p>
<h2>كيف أدخل؟</h2><ol><li>افتح رابط الدعوة الذي وصلك من المكتب عبر واتساب أو الرسائل، فيُفتح التطبيق ويُسجَّل دخولك تلقائياً.</li><li>أو افتح التطبيق، واكتب رمز المكتب (أو الصق رابط الدعوة)، ثم رمز الدخول الذي يبدأ بـ <span dir="ltr">MQ-</span>.</li></ol>
<h2>لم يصلني الرمز أو نسيته</h2><p>تواصل مع المكتب ليعيد إرساله إليك. لأسباب أمنية لا يمكن استعادة الرمز من التطبيق.</p>
<h2>لا تصلني الإشعارات</h2><p>افتح الإعدادات في التطبيق واضغط «تفعيل الإشعارات»، وتأكد من السماح لتطبيق المِسْبار بالإشعارات في إعدادات الآيفون.</p>
<h2>حذف حسابي أو بياناتي</h2><p>راسل المكتب من داخل التطبيق واطلب ذلك، أو تواصل عبر الوسائل أدناه. انظر <a href="/privacy">سياسة الخصوصية</a>.</p>
<h2>التواصل مع المكتب</h2><div class="box">${name}<br>${contact(o) || 'راسل المكتب من داخل التطبيق.'}</div>`);
}
/* ملف الربط مع تطبيق الآيفون: يفتح روابط الدعوة (/p/MQ-…) داخل التطبيق مباشرة إن كان مثبّتاً */
function aasa(appIds) {
  const ids = [...new Set((appIds || []).filter(x => /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/.test(x)))];
  return JSON.stringify({ applinks: { details: ids.length ? [{ appIDs: ids, components: [{ '/': '/p/*', comment: 'رابط دعوة الموكل' }] }] : [] }, webcredentials: { apps: ids } });
}
const appIdsFrom = (apnsCfg, extra) => [apnsCfg && apnsCfg.teamId && apnsCfg.topic ? apnsCfg.teamId + '.' + apnsCfg.topic : '', ...String(extra || '').split(',').map(s => s.trim())].filter(Boolean);

export { privacyPage, supportPage, aasa, appIdsFrom };
