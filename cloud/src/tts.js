// نسخة السحابة — تُولَّد من office/lib/tts.js
/* نطق عربي عبر ElevenLabs لتنبيهات المحامي حين لا يجد المتصفح صوتاً عربياً (كروم على الكمبيوتر)
   - مفتاح ElevenLabs يُحفظ في مخزن المكتب ولا يُعاد للمتصفح (آخر 4 أحرف فقط)
   - النص قصير ومحدود، والنتيجة تُخزَّن مؤقتاً في الذاكرة حتى لا يُدفع ثمن الجملة نفسها مرتين
   - يعمل في خادم المكتب (Node) والسحابة (Workers) بنفس الملف */

const API = 'https://api.elevenlabs.io/v1';
const MODELS = { flash: 'eleven_flash_v2_5', quality: 'eleven_multilingual_v2' };
const MAX_TEXT = 320;
const okKey = k => /^(sk_)?[A-Za-z0-9]{24,80}$/.test(String(k || ''));
const okVoice = v => /^[A-Za-z0-9]{10,40}$/.test(String(v || ''));

function cleanCfg(b, prev) {
  const key = String(b.key || '').trim(), out = { ...(prev || {}) };
  if (b.clear) return { cfg: null };
  if (key) { if (!okKey(key)) return { error: 'مفتاح ElevenLabs غير صحيح. انسخه من ElevenLabs ← Developers ← API Keys.' }; out.key = key }
  if (!out.key) return { error: 'أدخل مفتاح ElevenLabs.' };
  if (b.voiceId !== undefined) { const v = String(b.voiceId || '').trim(); if (v && !okVoice(v)) return { error: 'معرّف الصوت غير صحيح.' }; out.voiceId = v }
  if (b.voiceName !== undefined) out.voiceName = String(b.voiceName || '').slice(0, 80);
  if (b.model !== undefined) out.model = b.model === 'quality' ? 'quality' : 'flash';
  if (b.always !== undefined) out.always = !!b.always;
  out.savedAt = new Date().toISOString();
  return { cfg: out };
}
const pubCfg = c => c && c.key ? { configured: true, last4: c.key.slice(-4), voiceId: c.voiceId || '', voiceName: c.voiceName || '', model: c.model || 'flash', always: !!c.always, savedAt: c.savedAt } : { configured: false };

/* سبب الرفض كما يعيده ElevenLabs، بعبارة يفهمها المدير */
function why(status, j) {
  const d = (j && j.detail) || {}, code = String(d.status || d.code || '').toLowerCase(), msg = String(d.message || (typeof j.detail === 'string' ? j.detail : '') || '');
  if (code === 'missing_permissions' || /permission/i.test(msg)) return 'مفتاح ElevenLabs لا يملك الصلاحيات اللازمة. في ElevenLabs ← API Keys فعّل للمفتاح «Text to Speech» و«Voices: Read» (أو أنشئ مفتاحاً بلا قيود).';
  if (code === 'detected_unusual_activity' || /unusual activity/i.test(msg)) return 'رفض ElevenLabs الطلب لأنه صادر من خادم سحابي. الحسابات المجانية في ElevenLabs لا تقبل ذلك؛ يلزم اشتراك مدفوع (Starter فما فوق).';
  if (code === 'quota_exceeded' || /quota|credit/i.test(code + msg)) return 'نفد رصيد ElevenLabs.';
  if (code === 'invalid_api_key' || status === 401) return 'مفتاح ElevenLabs غير مقبول (غير صحيح أو محذوف).' + (code && code !== 'invalid_api_key' ? ' [' + code + ']' : '');
  return 'ردّ ElevenLabs بخطأ ' + status + (code ? ' [' + code + ']' : '');
}

function createTts({ getCfg, fetchImpl, now = () => Date.now(), audit }) {
  const F = fetchImpl || ((u, o) => fetch(u, o));
  const cache = new Map(); // نص → { at, bytes }
  const hits = new Map();  // مستخدم → أوقات الطلبات (حد 30 في الدقيقة)
  const limited = id => { const t = now(), a = (hits.get(id) || []).filter(x => t - x < 60e3); if (a.length >= 30) return true; a.push(t); hits.set(id, a); return false };

  async function voices() {
    const c = await getCfg(); if (!c || !c.key) return { status: 400, body: { error: 'لم يُضبط مفتاح ElevenLabs.' } };
    let r; try { r = await F(API + '/voices', { headers: { 'xi-api-key': c.key } }) } catch (e) { return { status: 502, body: { error: 'تعذّر الاتصال بـ ElevenLabs.' } } }
    if (!r.ok) { const j = await r.json().catch(() => ({})); return { status: r.status === 401 ? 400 : 502, body: { error: why(r.status, j) } } }
    const j = await r.json().catch(() => ({}));
    return { status: 200, body: { voices: (j.voices || []).slice(0, 200).map(v => ({ id: v.voice_id, name: v.name, category: v.category || '', labels: v.labels || {} })) } };
  }

  async function speak(text, user) {
    const c = await getCfg(); if (!c || !c.key) return { status: 400, body: { error: 'لم يُضبط النطق السحابي.' } };
    const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
    if (t.length < 3) return { status: 400, body: { error: 'نص قصير.' } };
    if (limited(String(user && user.id || 'x'))) return { status: 429, body: { error: 'تنبيهات كثيرة متتالية.' } };
    let voice = c.voiceId;
    if (!voice) { const v = await voices(); if (v.status !== 200 || !v.body.voices.length) return { status: 502, body: { error: 'لا توجد أصوات في حساب ElevenLabs.' } }; voice = v.body.voices[0].id }
    const model = MODELS[c.model] || MODELS.flash, ck = model + '|' + voice + '|' + t;
    const hit = cache.get(ck); if (hit && now() - hit.at < 24 * 3600e3) return { status: 200, audio: hit.bytes, cached: true };
    let r;
    try {
      r = await F(API + '/text-to-speech/' + encodeURIComponent(voice) + '?output_format=mp3_44100_64', {
        method: 'POST', headers: { 'xi-api-key': c.key, 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text: t, model_id: model, language_code: 'ar' })
      });
    } catch (e) { return { status: 502, body: { error: 'تعذّر الاتصال بـ ElevenLabs.' } } }
    if (!r.ok) {
      const j = await r.json().catch(() => ({})), msg = why(r.status, j);
      audit && audit({ username: user && user.username, action: 'tts.failed', detail: { status: r.status } });
      return { status: 502, body: { error: msg } };
    }
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    cache.set(ck, { at: now(), bytes });
    audit && audit({ username: user && user.username, action: 'tts.speak', detail: { chars: t.length, model } });
    return { status: 200, audio: bytes };
  }
  return { voices, speak };
}

export { createTts, cleanCfg, pubCfg, MODELS, MAX_TEXT };
