// صياغة اللوائح والنماذج القانونية من إملاء المحامي (Claude من Anthropic).
// المبادئ:
//  1) الخصوصية: أسماء الأطراف وأرقام الهويات والهواتف والبريد تُستبدل برموز قبل الإرسال وتُعاد بعد الصياغة.
//  2) المراجع: لا يُستشهد إلا بنص موجود فعلاً (مكتبة التشريعات، مكتبة الاجتهادات، البحث في مصادر التشريعات)
//     ويُعطى النموذج هذه النصوص بمعرّفات [R1]…؛ ما يحتاجه ولا يجد له نصاً يُعلَّم «يحتاج تحقق» ولا يُخترع.
//  3) الناتج مسودة يراجعها المحامي ويعتمدها؛ لا يُحفظ شيء تلقائياً.
// بلا مكتبات خارجية (Node وCloudflare Workers). نسخة مطابقة في cloud/src/ai-draft.js
// نسخة السحابة من office/lib/ai-draft.js (المنطق نفسه حرفياً؛ عدّل الاثنين معاً)

const API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5-5';
const LIMITS = { draft: [6, 600e3] };
const MAX_DICT = 20000, MAX_CTX = 60000;

const DOC_TYPES = ['لائحة دعوى', 'لائحة جوابية', 'لائحة جوابية متقابلة', 'مذكرة دفاع', 'مذكرة ختامية', 'لائحة استئناف', 'لائحة جوابية على الاستئناف', 'لائحة نقض', 'طلب مستعجل', 'طلب وقف تنفيذ', 'إنذار عدلي', 'شكوى جزائية', 'لائحة اعتراض', 'طلب تنفيذ'];

/* ── إخفاء الهوية ── */
function anonymizer(ctx) {
  const map = [], add = (real, tag) => { real = String(real || '').trim(); if (real.length >= 2 && !map.some(m => m.real === real)) map.push({ real, tag }) };
  add(ctx.client, '[الموكل]'); (ctx.opponents || []).forEach((o, i) => add(o, `[الخصم ${i + 1}]`));
  (ctx.opponentLawyers || []).forEach((o, i) => add(o, `[وكيل الخصم ${i + 1}]`)); add(ctx.lawyer, '[المحامي]'); add(ctx.office, '[المكتب]');
  /* الأسماء الكاملة أولاً ثم الأجزاء (الاسم الأول + العائلة) حتى لا تبقى بقايا */
  for (const m of [...map]) { const parts = m.real.split(/\s+/).filter(w => w.length >= 3 && !/^(شركة|مؤسسة|بنك|جمعية|بلدية|ال)$/.test(w)); if (parts.length >= 2) { add(parts[0] + ' ' + parts[parts.length - 1], m.tag) } }
  map.sort((a, b) => b.real.length - a.real.length);
  let n = 0; const extra = new Map();
  const hide = s => {
    let t = String(s || '');
    for (const m of map) t = t.split(m.real).join(m.tag);
    t = t.replace(/(?<!\d)(?:\+?970|\+?972|0)?5\d(?:[\s-]?\d){7}(?!\d)/g, x => { if (!extra.has(x)) extra.set(x, `[هاتف ${++n}]`); return extra.get(x) });
    t = t.replace(/(?<!\d)\d{9}(?!\d)/g, x => { if (!extra.has(x)) extra.set(x, `[رقم هوية ${++n}]`); return extra.get(x) });
    t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, x => { if (!extra.has(x)) extra.set(x, `[بريد ${++n}]`); return extra.get(x) });
    return t;
  };
  const full = {}; for (const m of map) if (!full[m.tag] || m.real.length > full[m.tag].length) full[m.tag] = m.real;
  const show = s => { let t = String(s || ''); for (const [real, tag] of extra) t = t.split(tag).join(real); for (const tag in full) t = t.split(tag).join(full[tag]); return t };
  return { hide, show, tags: [...new Set(map.map(m => m.tag))] };
}

/* ── تجميع المراجع الموثقة ── */
const norm = s => String(s ?? '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
/* يقسم نص التشريع إلى مواد ويختار أكثرها صلة بالكلمات */
function pickArticles(content, words, max = 5) {
  const lines = String(content || '').split('\n'), arts = []; let cur = null;
  for (const l of lines) { if (/^\s*(المادة|مادة)\s*\(?\s*\d+/.test(l)) { if (cur) arts.push(cur); cur = { head: (l.match(/^\s*((?:المادة|مادة)\s*\(?\s*\d+\s*\)?)/) || [])[1] || '', text: l } } else if (cur) cur.text += '\n' + l }
  if (cur) arts.push(cur);
  if (!arts.length) return [{ head: '', text: String(content || '').slice(0, 1500) }];
  const ws = [...new Set(words.flatMap(w => norm(w).split(' ')).map(w => w.replace(/^(و?(?:ب|ل|ك)?ال)/, '')).filter(w => w.length >= 3))];
  return arts.map(a => ({ ...a, score: ws.reduce((s, w) => s + (norm(a.text).includes(w) ? 1 : 0), 0) })).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, max).map(a => ({ head: a.head, text: a.text.slice(0, 1800) }));
}

async function callClaude(key, body, fetchImpl) {
  let r; try { r = await fetchImpl(API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) }) }
  catch (e) { throw Object.assign(new Error('تعذّر الاتصال بخدمة الصياغة. تحقق من الإنترنت.'), { status: 502 }) }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('مفتاح الذكاء الاصطناعي غير صالح أو موقوف. حدّثه من إعدادات الصياغة.'), { status: 400 });
  if (r.status === 429) throw Object.assign(new Error('تجاوزت حد الاستخدام لدى مزوّد الذكاء الاصطناعي. حاول بعد قليل.'), { status: 429 });
  if (!r.ok) throw Object.assign(new Error('خدمة الصياغة لا تستجيب الآن (' + r.status + ').'), { status: 502 });
  return j;
}
const toolInput = (j, name) => { const b = (j.content || []).find(x => x.type === 'tool_use' && x.name === name); if (!b) throw Object.assign(new Error('لم تُرجع خدمة الصياغة نتيجة صالحة. أعد المحاولة.'), { status: 502 }); return b.input };

const SYSTEM = `أنت محامٍ فلسطيني خبير في صياغة اللوائح والمذكرات والنماذج القانونية أمام المحاكم الفلسطينية (الضفة الغربية وقطاع غزة)، بلغة عربية قانونية رسمية سليمة.
قواعد ملزمة:
1. لا تستشهد بأي مادة قانونية أو حكم قضائي أو تشريع إلا من «المراجع المتاحة» المرفقة، وبمعرّفها كما هو مثل [R2]. لا تخترع أرقام مواد أو قوانين أو أحكام أبداً.
2. إذا احتاجت الحجة سنداً قانونياً غير موجود في المراجع المتاحة فاكتب في موضعه: [مرجع يحتاج تحقق: وصف موجز لما يلزم] وأضفه إلى قائمة unverified.
3. الرموز بين معقوفين مثل [الموكل] و[الخصم 1] و[هاتف 1] أسماء وبيانات مخفية؛ أبقها كما هي حرفياً.
4. لا تضف وقائع لم يذكرها المحامي أو ملف القضية. ما ينقص من بيانات (تاريخ، مبلغ، رقم) اكتبه بين قوسين معقوفين مثل {تاريخ العقد}.
5. اتبع البنية المعتادة للمستند المطلوب أمام المحاكم الفلسطينية (الديباجة، الوقائع، الأسباب/الدفوع، الطلبات، التوقيع) دون إطالة.`;

const DRAFT_TOOL = { name: 'submit_draft', description: 'تسليم المستند المصاغ', input_schema: { type: 'object', required: ['title', 'sections', 'references', 'unverified'], properties: {
  title: { type: 'string', description: 'عنوان المستند' },
  court: { type: 'string', description: 'المحكمة المخاطبة إن عُرفت' },
  sections: { type: 'array', items: { type: 'object', required: ['heading', 'paragraphs'], properties: { heading: { type: 'string' }, paragraphs: { type: 'array', items: { type: 'string' } } } } },
  references: { type: 'array', description: 'المراجع المتاحة التي استُشهد بها فعلاً', items: { type: 'object', required: ['id', 'used_for'], properties: { id: { type: 'string', description: 'مثل R2' }, used_for: { type: 'string' } } } },
  unverified: { type: 'array', description: 'أسانيد لازمة لم تتوفر نصوصها', items: { type: 'object', required: ['need'], properties: { need: { type: 'string' } } } },
} } };
const PLAN_TOOL = { name: 'plan_research', description: 'تحديد ما يلزم البحث عنه من تشريعات وأحكام', input_schema: { type: 'object', required: ['queries', 'keywords'], properties: {
  queries: { type: 'array', maxItems: 4, description: 'عبارات بحث قصيرة عن تشريعات فلسطينية ذات صلة (مثل: قانون العمل، أصول المحاكمات المدنية)', items: { type: 'string' } },
  keywords: { type: 'array', maxItems: 12, description: 'كلمات مفتاحية لاختيار المواد ذات الصلة داخل نصوص التشريعات', items: { type: 'string' } },
} } };

function createDrafter({ audit, getKey, laws, lawSearch, fetchImpl = fetch, model } = {}) {
  const hits = new Map();
  const limited = key => { const [max, win] = LIMITS.draft, now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < win); if (a.length >= max) { hits.set(key, a); return Math.ceil((win - (now - a[0])) / 1000) } a.push(now); hits.set(key, a); return 0 };

  async function gatherRefs(plan, rulings, useWeb, user) {
    const refs = [], words = [...(plan.keywords || []), ...(plan.queries || [])].slice(0, 16), seen = new Set();
    const addLaw = (x, origin) => {
      const k = norm(x.title); if (seen.has(k)) return; seen.add(k);
      const arts = pickArticles(x.content, words); if (!arts.length) return;
      refs.push({ id: 'R' + (refs.length + 1), kind: 'law', title: x.title, ref: x.ref || '', origin, arts });
    };
    /* 1) مكتبة تشريعات المكتب */
    if (laws) for (const q of (plan.queries || []).slice(0, 4)) {
      const r = laws.search({ q, pageSize: 3 }); for (const it of r.items) { const full = laws.get(it.id); if (full) addLaw(full, 'library') }
    }
    /* 2) مكتبة الاجتهادات (أحكام محفوظة لدى المكتب) */
    const ws = [...new Set(words.flatMap(w => norm(w).split(' ')).map(w => w.replace(/^(و?(?:ب|ل|ك)?ال)/, '')).filter(w => w.length >= 3))];
    (rulings || []).map(r => ({ r, s: ws.reduce((n, w) => n + (norm([r.principle, r.title, r.summary, (r.keywords || []).join(' ')].join(' ')).includes(w) ? 1 : 0), 0) }))
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 4)
      .forEach(({ r }) => refs.push({ id: 'R' + (refs.length + 1), kind: 'ruling', title: `${r.court || ''} ${r.no || ''}`.trim(), ref: r.date || '', origin: 'rulings', arts: [{ head: 'المبدأ', text: String(r.principle || r.summary || r.title || '').slice(0, 1500) }] }));
    /* 3) البحث في مصادر التشريعات على الإنترنت (أسرع مصدر، أول نتيجتين لكل عبارة) */
    if (useWeb && lawSearch) for (const q of (plan.queries || []).slice(0, 2)) {
      const s = await lawSearch('search', { q, src: 's1' }, user); if (s.status !== 200) continue;
      for (const it of s.body.items.filter(x => x.articles > 0).slice(0, 2)) {
        if (seen.has(norm(it.title))) continue;
        const d = await lawSearch('item', { id: it.id }, user); if (d.status === 200) addLaw(d.body.item, 'web');
      }
    }
    return refs;
  }

  return async function draft(input, user, ctxExtra = {}) {
    const who = { user_id: user && user.id, username: user && user.username };
    const key = await getKey(); if (!key) return { status: 400, body: { error: 'لم يُضبط مفتاح الذكاء الاصطناعي بعد. يضيفه مدير المكتب من إعدادات الصياغة.', needKey: true } };
    const wait = limited(String(user && (user.id || user.username))); if (wait) return { status: 429, body: { error: `طلبات صياغة كثيرة. حاول بعد ${wait} ثانية.` } };
    const docType = String(input.docType || '').slice(0, 120).trim(), dict = String(input.dictation || '').slice(0, MAX_DICT).trim();
    if (!docType) return { status: 400, body: { error: 'اختر نوع المستند.' } };
    if (dict.length < 20) return { status: 400, body: { error: 'الإملاء قصير جداً. صف الوقائع وما تريد قوله في المستند.' } };
    const c = input.case || {}, an = anonymizer(c);
    const caseTxt = an.hide([c.no && `رقم الدعوى: ${c.no}`, c.court && `المحكمة: ${c.court}`, c.type && `نوع الدعوى: ${c.type}`, c.subject && `الموضوع: ${c.subject}`,
      c.role && `صفة موكلنا: ${c.role}`, c.stage && `المرحلة: ${c.stage}`, c.value && `قيمة الدعوى: ${c.value}`, '[الموكل] = موكلنا', ...(c.opponents || []).map((o, i) => `[الخصم ${i + 1}] = خصم`)].filter(Boolean).join('\n'));
    const said = an.hide(dict), tpl = String(input.template || '').slice(0, 8000);
    const mdl = model || MODEL;
    try {
      /* الخطوة 1: ما الذي يلزم البحث عنه؟ */
      const plan = toolInput(await callClaude(key, { model: mdl, max_tokens: 800, system: SYSTEM, tools: [PLAN_TOOL], tool_choice: { type: 'tool', name: 'plan_research' },
        messages: [{ role: 'user', content: `نوع المستند: ${docType}\n\nملف القضية:\n${caseTxt}\n\nإملاء المحامي:\n${said}\n\nحدّد عبارات البحث عن التشريعات الفلسطينية ذات الصلة والكلمات المفتاحية.` }] }, fetchImpl), 'plan_research');
      /* الخطوة 2: المراجع من مصادر موثقة فقط */
      const refs = await gatherRefs(plan, ctxExtra.rulings, input.web !== false, user);
      let refTxt = refs.map(r => `[${r.id}] ${r.kind === 'ruling' ? 'حكم قضائي' : 'تشريع'}: ${r.title}${r.ref ? ' (' + r.ref + ')' : ''}\n${r.arts.map(a => (a.head ? a.head + ': ' : '') + a.text).join('\n')}`).join('\n\n');
      if (refTxt.length > MAX_CTX) refTxt = refTxt.slice(0, MAX_CTX);
      /* الخطوة 3: الصياغة */
      const out = toolInput(await callClaude(key, { model: mdl, max_tokens: 8000, system: SYSTEM, tools: [DRAFT_TOOL], tool_choice: { type: 'tool', name: 'submit_draft' },
        messages: [{ role: 'user', content: `المطلوب: صياغة «${docType}».\n\nملف القضية:\n${caseTxt}\n\nإملاء المحامي (الوقائع والطلبات كما ذكرها):\n${said}\n\n${tpl ? 'نموذج المكتب الذي يُبنى عليه (التزم ببنيته):\n' + an.hide(tpl) + '\n\n' : ''}المراجع المتاحة (لا يُستشهد بغيرها):\n${refTxt || '(لا توجد مراجع متاحة؛ علّم كل سند قانوني «يحتاج تحقق»)'}` }] }, fetchImpl), 'submit_draft');
      /* إعادة الأسماء، والتحقق من أن كل مرجع مذكور موجود فعلاً */
      const valid = new Set(refs.map(r => r.id));
      const fix = s => an.show(String(s || '')).replace(/\[(R\d+)\]/g, (m, id) => valid.has(id) ? m : '[مرجع يحتاج تحقق]');
      const sections = (out.sections || []).map(s => ({ heading: fix(s.heading), paragraphs: (s.paragraphs || []).map(fix) }));
      const usedIds = new Set(sections.flatMap(s => s.paragraphs.join(' ').match(/R\d+/g) || []));
      const references = refs.filter(r => usedIds.has(r.id)).map(r => ({ id: r.id, kind: r.kind, title: r.title, ref: r.ref, origin: r.origin, arts: r.arts.map(a => a.head).filter(Boolean),
        used_for: fix(((out.references || []).find(x => x.id === r.id) || {}).used_for || '') }));
      const unverified = (out.unverified || []).map(u => fix(u.need)).filter(Boolean);
      audit && audit({ ...who, action: 'ai.draft', entity: 'docs', detail: { docType, refs: references.length, unverified: unverified.length, model: mdl, chars: dict.length } });
      return { status: 200, body: { ok: true, title: fix(out.title || docType), court: fix(out.court || ''), sections, references, unverified, considered: refs.length } };
    } catch (e) {
      audit && audit({ ...who, action: 'ai.draft_failed', entity: 'docs', detail: { docType, error: String(e.message).slice(0, 160) } });
      return { status: e.status || 500, body: { error: e.status ? e.message : 'تعذّرت الصياغة. أعد المحاولة.' } };
    }
  };
}

export { createDrafter, anonymizer, pickArticles, DOC_TYPES, MODEL };
