'use strict';
/* صورة المستخدم الشخصية وصورة محامي المكتب للموكلين: صورة صغيرة (يصغّرها المتصفح قبل الرفع) تُحفظ كرابط بيانات */
const RX = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/;
const MAX = 400000; // نحو 300 ك.ب بعد فك الترميز
function cleanAvatar(data) {
  if (data === null || data === '') return { data: null };
  const s = String(data || '');
  if (s.length > MAX) return { error: 'الصورة كبيرة جداً. اختر صورة أصغر.' };
  if (!RX.test(s)) return { error: 'صيغة الصورة غير مدعومة (JPEG أو PNG أو WebP).' };
  return { data: s };
}
/* لخدمة الصورة كملف: النوع والبايتات */
function parts(data) { const m = RX.exec(String(data || '')); return m ? { type: 'image/' + m[1], b64: m[2] } : null }
const ver = data => { let h = 0; const s = String(data || ''); for (let i = 0; i < s.length; i += 97) h = (h * 31 + s.charCodeAt(i)) >>> 0; return s ? (h.toString(36) + s.length.toString(36)) : '' };
module.exports = { cleanAvatar, parts, ver };
