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

const DOC_TYPES = ['لائحة دعوى', 'لائحة جوابية', 'لائحة جوابية متقابلة', 'مذكرة دفاع', 'مذكرة ختامية', 'لائحة استئناف', 'لائحة جوابية على الاستئناف', 'لائحة نقض', 'طلب مستعجل', 'طلب وقف تنفيذ', 'إنذار عدلي', 'شكوى جزائية', 'لائحة اعتراض', 'طلب تنفيذ', 'وكالة عامة', 'وكالة خاصة', 'وكالة بالخصومة (وكالة محامٍ)', 'مرافعة ختامية', 'كتاب مطالبة', 'رد على إنذار عدلي', 'عقد بيع', 'عقد إيجار', 'عقد عمل', 'عقد مقاولة', 'عقد اتفاق أتعاب محاماة', 'اتفاقية صلح ومخالصة', 'مذكرة رأي قانوني'];
/* إرشادات بنية حسب نوع المستند */
const GUIDE = [
  [/وكالة/, 'هذه وكالة لا لائحة: بنيتها (الموكِّل وبياناته، الوكيل وبياناته، موضوع الوكالة، الصلاحيات مفصلة بنوداً مرقمة، المدة إن وُجدت، حق التوكيل للغير أو عدمه، التوقيع، مكان التصديق لدى الكاتب العدل). اذكر صراحة الصلاحيات التي تحتاج نصاً خاصاً متى لزمت (الإقرار، الصلح، التنازل، الإبراء، التحكيم، قبض المبالغ، البيع والإفراغ، توجيه اليمين وردها)، ولا تضف صلاحية لم يطلبها المحامي إلا بين قوسين معقوفين كاقتراح. لا أقسام وقائع ولا طلبات.'],
  [/إنذار|كتاب مطالبة/, 'هذا إنذار أو كتاب لا لائحة: بنيته (المنذِر بواسطة وكيله، المنذَر إليه، الموضوع، الوقائع بإيجاز، المطالبة المحددة بمبلغها أو فعلها، المهلة الممنوحة بالأيام، الإجراء القانوني عند عدم الاستجابة، حفظ الحقوق). إن كان رداً على إنذار فرد على ما ورد فيه بنداً بنداً ثم أعلن الموقف. لا أقسام طلبات أمام محكمة.'],
  [/عقد|اتفاقية/, 'هذا عقد لا لائحة: اجعل الأقسام: الفريقان وبياناتهما، التمهيد (ويُعتبر جزءاً لا يتجزأ من العقد)، ثم بنوداً مرقمة متسلسلة تغطي: الموضوع، البدل أو الثمن وطريقة الدفع ومواعيده، المدة والتجديد، التزامات كل فريق، التسليم أو التنفيذ، الإخلال والشرط الجزائي، الإنهاء والفسخ، الإشعارات وعناوين التبليغ، القانون الواجب التطبيق والمحكمة المختصة أو التحكيم، عدد النسخ، ثم التوقيعات والشهود. ما لم يذكره المحامي من أرقام أو تواريخ اكتبه بين { }، واقترح ما يحمي موكلنا بين قوسين معقوفين.'],
  [/رأي قانوني/, 'مذكرة رأي قانوني داخلية: (الوقائع كما وردت، المسألة القانونية، النصوص المنطبقة، التحليل، المخاطر، الرأي والتوصية). لا طلبات ولا مخاطبة محكمة.'],
  [/جوابية/, 'رتّب الرد: الدفوع الشكلية أولاً إن وُجدت، ثم الرد الموضوعي على ادعاءات الخصم بنداً بنداً بأرقامها، ثم الطلبات.'],
  [/مرافعة|مذكرة ختامية/, 'المرافعة الختامية تلخص الوقائع الثابتة، والبينات المقدمة وما أثبتته، ثم الرد على بينات الخصم، ثم الطلبات.'],
];

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

  async function gatherRefs(plan, rulings, useWeb, user, opt = {}) {
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
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, opt.rulings || 4)
      .forEach(({ r }) => refs.push({ id: 'R' + (refs.length + 1), kind: 'ruling', title: `${r.court || ''} ${r.no || ''}`.trim(), ref: r.date || '', origin: 'rulings', arts: [{ head: 'المبدأ', text: String(r.principle || r.summary || r.title || '').slice(0, 1500) }, ...(opt.rulings && r.summary && r.summary !== r.principle ? [{ head: 'الملخص', text: String(r.summary).slice(0, 1500) }] : [])] }));
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

  const fn = async function draft(input, user, ctxExtra = {}) {
    const who = { user_id: user && user.id, username: user && user.username };
    const key = await getKey(); if (!key) return { status: 400, body: { error: 'لم يُضبط مفتاح الذكاء الاصطناعي بعد. يضيفه مدير المكتب من إعدادات الصياغة.', needKey: true } };
    const wait = limited(String(user && (user.id || user.username))); if (wait) return { status: 429, body: { error: `طلبات صياغة كثيرة. حاول بعد ${wait} ثانية.` } };
    const docType = String(input.docType || '').slice(0, 120).trim(), dict = String(input.dictation || '').slice(0, MAX_DICT).trim();
    if (!docType) return { status: 400, body: { error: 'اختر نوع المستند.' } };
    const claims = (Array.isArray(input.claims) ? input.claims : []).slice(0, 60).map(x => ({ text: String(x.text || '').slice(0, 2000).trim(), response: String(x.response || '').slice(0, 3000).trim() })).filter(x => x.text);
    if (dict.length < 20 && !claims.some(x => x.response)) return { status: 400, body: { error: 'الإملاء قصير جداً. صف الوقائع وما تريد قوله في المستند.' } };
    const c = input.case || {}, an = anonymizer(c);
    const caseTxt = an.hide([c.no && `رقم الدعوى: ${c.no}`, c.court && `المحكمة: ${c.court}`, c.type && `نوع الدعوى: ${c.type}`, c.subject && `الموضوع: ${c.subject}`,
      c.role && `صفة موكلنا: ${c.role}`, c.stage && `المرحلة: ${c.stage}`, c.value && `قيمة الدعوى: ${c.value}`, '[الموكل] = موكلنا', ...(c.opponents || []).map((o, i) => `[الخصم ${i + 1}] = خصم`)].filter(Boolean).join('\n'));
    const said = an.hide(dict), tpl = String(input.template || '').slice(0, 8000);
    const claimsTxt = claims.length ? '\n\nادعاءات الخصم كما وردت في لائحته، ورد المحامي على كل منها:\n' + claims.map((x, i) => `${i + 1}. ادعاء الخصم: ${an.hide(x.text)}\n   رد المحامي: ${x.response ? an.hide(x.response) : '(لم يملِ رداً؛ أنكره إنكاراً عاماً وكلّف الخصم بإثباته)'}`).join('\n') : '';
    const guide = (GUIDE.find(([re]) => re.test(docType)) || [, ''])[1];
    const mdl = model || MODEL;
    try {
      /* الخطوة 1: ما الذي يلزم البحث عنه؟ */
      const plan = toolInput(await callClaude(key, { model: mdl, max_tokens: 800, system: SYSTEM, tools: [PLAN_TOOL], tool_choice: { type: 'tool', name: 'plan_research' },
        messages: [{ role: 'user', content: `نوع المستند: ${docType}\n\nملف القضية:\n${caseTxt}\n\nإملاء المحامي:\n${said}${claimsTxt}\n\nحدّد عبارات البحث عن التشريعات الفلسطينية ذات الصلة والكلمات المفتاحية.` }] }, fetchImpl), 'plan_research');
      /* الخطوة 2: المراجع من مصادر موثقة فقط */
      const refs = await gatherRefs(plan, ctxExtra.rulings, input.web !== false, user);
      let refTxt = refs.map(r => `[${r.id}] ${r.kind === 'ruling' ? 'حكم قضائي' : 'تشريع'}: ${r.title}${r.ref ? ' (' + r.ref + ')' : ''}\n${r.arts.map(a => (a.head ? a.head + ': ' : '') + a.text).join('\n')}`).join('\n\n');
      if (refTxt.length > MAX_CTX) refTxt = refTxt.slice(0, MAX_CTX);
      /* الخطوة 3: الصياغة */
      const out = toolInput(await callClaude(key, { model: mdl, max_tokens: 8000, system: SYSTEM, tools: [DRAFT_TOOL], tool_choice: { type: 'tool', name: 'submit_draft' },
        messages: [{ role: 'user', content: `المطلوب: صياغة «${docType}».\n\nملف القضية:\n${caseTxt}\n\nإملاء المحامي (الوقائع والطلبات كما ذكرها):\n${said}${claimsTxt}\n\n${guide ? 'إرشادات البنية: ' + guide + '\n\n' : ''}${tpl ? 'نموذج المكتب الذي يُبنى عليه (التزم ببنيته):\n' + an.hide(tpl) + '\n\n' : ''}المراجع المتاحة (لا يُستشهد بغيرها):\n${refTxt || '(لا توجد مراجع متاحة؛ علّم كل سند قانوني «يحتاج تحقق»)'}` }] }, fetchImpl), 'submit_draft');
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
  fn._gather = gatherRefs;
  return fn;
}

/* ── قراءة لائحة الخصم: استخراج الادعاءات بنداً بنداً ليرد عليها المحامي ── */
const EXTRACT_TOOL = { name: 'extract_pleading', description: 'استخراج محتوى لائحة الخصم', input_schema: { type: 'object', required: ['doc_type', 'claims'], properties: {
  doc_type: { type: 'string', description: 'نوع المستند كما يظهر (لائحة دعوى، لائحة استئناف…)' }, court: { type: 'string' }, case_no: { type: 'string' },
  summary: { type: 'string', description: 'خلاصة الدعوى في سطرين' },
  claims: { type: 'array', maxItems: 60, description: 'ادعاءات الخصم ووقائعه كما وردت، كل ادعاء مستقل في عنصر، بصياغته المختصرة الأمينة', items: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } } },
  requests: { type: 'array', items: { type: 'string' }, description: 'طلبات الخصم' },
} } };
const MEDIA = { 'application/pdf': 'document', 'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'image/gif': 'image' };
function createExtractor({ audit, getKey, fetchImpl = fetch, model } = {}) {
  const hits = new Map();
  return async function extract(input, user) {
    const who = { user_id: user && user.id, username: user && user.username };
    const key = await getKey(); if (!key) return { status: 400, body: { error: 'لم يُضبط مفتاح الذكاء الاصطناعي بعد.', needKey: true } };
    const now = Date.now(), k = String(user && (user.id || user.username)), a = (hits.get(k) || []).filter(t => now - t < 600e3);
    if (a.length >= 10) return { status: 429, body: { error: 'طلبات قراءة كثيرة. حاول بعد قليل.' } }; a.push(now); hits.set(k, a);
    const content = [];
    if (input.file && input.file.data) {
      const kind = MEDIA[input.file.type]; if (!kind) return { status: 400, body: { error: 'نوع الملف غير مدعوم. ارفع PDF أو صورة أو Word.' } };
      if (String(input.file.data).length > 14e6) return { status: 413, body: { error: 'الملف أكبر من 10 ميغابايت.' } };
      content.push({ type: kind, source: { type: 'base64', media_type: input.file.type, data: String(input.file.data) } });
    } else {
      const t = String(input.text || '').slice(0, 120000).trim(); if (t.length < 50) return { status: 400, body: { error: 'لم يُعثر على نص كافٍ في الملف.' } };
      const an = anonymizer(input.case || {}); content.push({ type: 'text', text: an.hide(t) }); input._an = an;
    }
    content.push({ type: 'text', text: 'هذه لائحة مقدمة من الخصم في دعوى أمام المحاكم الفلسطينية. استخرج ادعاءاته ووقائعه بنداً بنداً كما وردت (دون إضافة أو تقييم)، وطلباته.' });
    try {
      const out = toolInput(await callClaude(key, { model: model || MODEL, max_tokens: 6000, system: 'أنت مساعد قانوني دقيق يقرأ اللوائح القضائية الفلسطينية ويستخرج مضمونها بأمانة.', tools: [EXTRACT_TOOL], tool_choice: { type: 'tool', name: 'extract_pleading' }, messages: [{ role: 'user', content }] }, fetchImpl), 'extract_pleading');
      const show = input._an ? input._an.show : (x => x);
      audit && audit({ ...who, action: 'ai.extract', entity: 'docs', detail: { claims: (out.claims || []).length, kind: input.file ? input.file.type : 'text' } });
      return { status: 200, body: { ok: true, docType: show(out.doc_type || ''), court: show(out.court || ''), caseNo: show(out.case_no || ''), summary: show(out.summary || ''), claims: (out.claims || []).map(c => show(c.text)).filter(Boolean), requests: (out.requests || []).map(show) } };
    } catch (e) { return { status: e.status || 500, body: { error: e.status ? e.message : 'تعذّرت قراءة اللائحة.' } } }
  };
}

/* ── مساعد القضية: ملخص قبل الجلسة، الدفوع الشكلية والمهل، السؤال القانوني ── */
const ANSWER_TOOL = { name: 'submit_answer', description: 'تسليم الجواب', input_schema: { type: 'object', required: ['sections'], properties: {
  sections: { type: 'array', items: { type: 'object', required: ['heading', 'items'], properties: { heading: { type: 'string' }, items: { type: 'array', items: { type: 'string' } } } } },
  unverified: { type: 'array', items: { type: 'string' }, description: 'أسانيد لازمة لم تتوفر نصوصها في المراجع' },
} } };
const MODES = {
  brief: { refs: false, ask: 'اكتب ملخصاً عملياً للمحامي قبل الجلسة القادمة من ملف القضية وسجلها فقط، في أقسام: (1) أين وصلت الدعوى، (2) المطلوب في الجلسة القادمة، (3) البينات أو المستندات الناقصة، (4) المهل القريبة، (5) تنبيهات. لا تستشهد بأي نص قانوني ولا تخترع وقائع غير واردة في السجل.' },
  defences: { refs: true, ask: 'استعرض الدفوع الشكلية والإجرائية الممكنة لموكلنا في هذه الدعوى (عدم الاختصاص النوعي أو المكاني، التقادم ومرور الزمن، سبق الفصل، انتفاء الصفة أو المصلحة، بطلان التبليغ، فوات مهل الطعن…) ومدى انطباق كل منها على الوقائع، ثم المهل الإجرائية الواجب مراقبتها. اربط كل دفع أو مهلة بالمرجع [Rn] إن وُجد نصه في المراجع المتاحة، وإلا اذكره في unverified. لا تخترع أرقام مواد أو مدداً.' },
  contract: { refs: true, doc: 'عقد', ask: 'راجع العقد المرفق لمصلحة موكلنا، في أقسام: (1) ملخص العقد (الأطراف، الموضوع، البدل، المدة)، (2) بنود تضر بموكلنا أو غير متوازنة ولماذا، (3) بنود ناقصة يُنصح بإضافتها، (4) عبارات غامضة أو متناقضة، (5) صياغة مقترحة للتعديلات بنصها. اربط ما يستند إلى نص بالمرجع [Rn] من المراجع المتاحة فقط.' },
  opponent: { refs: true, doc: 'مستند مقدم من الخصم', ask: 'حلّل المستند المرفق المقدم من الخصم لمصلحة موكلنا، في أقسام: (1) ملخص المستند وما يريد الخصم إثباته به، (2) ما يثبته فعلاً وما لا يثبته، (3) مواطن الضعف والتناقض مع وقائع الدعوى أو مع نفسه، (4) أوجه الطعن الممكنة (إنكار التوقيع أو الخط، الادعاء بالتزوير، عدم الحجية، عدم الصلة بالنزاع…)، (5) ما يُقترح قوله أو طلبه في الجلسة رداً عليه. اربط ما يستند إلى نص بالمرجع [Rn] من المراجع المتاحة فقط.' },
  similar: { refs: true, rulings: 8, ask: 'من الأحكام القضائية بين المراجع المتاحة، اختر الأقرب إلى وقائع هذه القضية، ولكل حكم قسم مستقل عنوانه المحكمة ورقم الحكم: المبدأ الذي قرره [Rn]، أوجه الشبه والاختلاف مع قضيتنا، وكيف يُستفاد منه في الدفاع. إن لم يوجد بينها حكم مناسب فقل صراحة: «لا توجد في مكتبة الاجتهادات أحكام قريبة من هذه القضية» ولا تذكر أحكاماً من عندك.' },
  client_msg: { refs: false, ask: 'اكتب رسالة قصيرة من المحامي إلى الموكل [الموكل] بلغة عربية بسيطة واضحة غير متخصصة ومهذبة، تطمئنه دون أي وعد بنتيجة: آخر ما جرى في قضيته، والموعد القادم، وما يلزمه إحضاره أو فعله. إن كتب المحامي ملاحظة أعلاه فالتزم بها. قسم واحد عنوانه «الرسالة» وكل فقرة منها عنصر. لا أرقام مواد ولا مصطلحات معقدة، ولا تذكر معلومات لم ترد في السجل.' },
  minutes: { refs: false, need: 'أملِ ملاحظات الاجتماع أولاً.', ask: 'نظّم ملاحظات الاجتماع التي أملاها المحامي أعلاه في محضر اجتماع بأقسام: الحاضرون، موضوع الاجتماع، ما تم بحثه، ما اتُّفق عليه، المهام (المهمة — المسؤول — الموعد)، المستندات المطلوبة من الموكل. لا تضف شيئاً لم يرد في الملاحظات؛ ما لم يُذكر اكتبه بين { }.' },
  translate: { refs: false, doc: 'النص المراد ترجمته', min: 5, ask: 'ترجم النص المرفق ترجمة قانونية دقيقة كاملة إلى {LANG}، مع الحفاظ على البنية والترقيم واستعمال المصطلحات القانونية المقابلة. لا تلخص ولا تعلق ولا تحذف. أبقِ الرموز بين أقواس مربعة مثل [الموكل] و[الخصم 1] كما هي حرفياً. اجعل كل عنوان في النص قسماً، وفقراته عناصره؛ وإن لم يكن فيه عناوين فقسم واحد بعنوان فارغ.' },
  question: { refs: true, ask: 'أجب عن سؤال المحامي أعلاه بدقة وإيجاز، مستنداً فقط إلى المراجع المتاحة [Rn]. إن لم تجد فيها نصاً يجيب فقل صراحة: «لم أجد في المصادر المتاحة نصاً يجيب عن هذا» واذكر ما يلزم البحث عنه. لا تخترع أرقام مواد أو أحكام.' },
};
/* ── استخراج معطيات الحاسبة من سرد المحامي (الحساب نفسه حتمي في legal-calc.js) ── */
const CALC_TOOL = { name: 'extract_calc', description: 'استخراج معطيات الحساب من سرد الوقائع', input_schema: { type: 'object', required: ['kind', 'fields', 'missing'], properties: {
  kind: { type: 'string', enum: ['insurance', 'labour'] },
  fields: { type: 'object', description: 'المفاتيح المتاحة فقط. insurance: disability(%) functionalDisability(%) nights operations(0/1) monthlyWage sectorAvgWage tempDays accidentDate(YYYY-MM-DD) returnDate age workEndAge medical advancePaid died(0/1) dependantsShare(%) notified(0/1). labour: monthlyWage start(YYYY-MM-DD) end years termination(dismissal|arbitrary|resignation|end_of_term|agreed) contract(fixed|open) noticeGiven(0/1) justifiedLeave(0/1) hazardous(0/1) unusedLeaveYears unpaidWages overtime other otherLabel injury(0/1) injuryTempDays injuryDisability injuryDeath(0/1) age avg3Wage commission(0/1)', additionalProperties: true },
  missing: { type: 'array', items: { type: 'string' }, description: 'معطيات لازمة للحساب لم ترد في السرد' },
  assumptions: { type: 'array', items: { type: 'string' }, description: 'ما استُنتج ولم يُذكر صراحة' },
} } };
function createCalcExtractor({ audit, getKey, fetchImpl = fetch, model } = {}) {
  return async function extractCalc(input, user) {
    const key = await getKey(); if (!key) return { status: 400, body: { error: 'لم يُضبط مفتاح الذكاء الاصطناعي بعد.', needKey: true } };
    const kind = input.kind === 'labour' ? 'labour' : 'insurance', t = String(input.text || '').slice(0, 20000).trim();
    if (t.length < 20) return { status: 400, body: { error: 'اسرد الوقائع أولاً.' } };
    const an = anonymizer(input.case || {});
    try {
      const out = toolInput(await callClaude(key, { model: model || MODEL, max_tokens: 1500, system: 'أنت مساعد قانوني فلسطيني دقيق. تستخرج من سرد المحامي المعطيات الرقمية فقط ولا تحسب شيئاً ولا تخترع رقماً لم يُذكر. التواريخ بصيغة YYYY-MM-DD. النسب أرقام بلا علامة %.', tools: [CALC_TOOL], tool_choice: { type: 'tool', name: 'extract_calc' },
        messages: [{ role: 'user', content: `نوع الحساب: ${kind === 'labour' ? 'حقوق عمالية (قانون العمل 7/2000)' : 'تعويض حادث طرق (قانون التأمين 20/2005)'}\n\nسرد المحامي:\n${an.hide(t)}\n\nاستخرج المعطيات المتاحة في السرد فقط، واذكر الناقص منها.` }] }, fetchImpl), 'extract_calc');
      const fields = {}; for (const [k, v] of Object.entries(out.fields || {})) if (v !== '' && v != null) fields[k] = typeof v === 'string' ? an.show(v) : v;
      audit && audit({ user_id: user && user.id, username: user && user.username, action: 'ai.calc_extract', entity: 'cases', detail: { kind, fields: Object.keys(fields).length } });
      return { status: 200, body: { ok: true, kind, fields, missing: (out.missing || []).map(x => an.show(String(x))), assumptions: (out.assumptions || []).map(x => an.show(String(x))) } };
    } catch (e) { return { status: e.status || 500, body: { error: e.status ? e.message : 'تعذّر الاستخراج.' } } }
  };
}

function createAssistant({ audit, getKey, laws, lawSearch, fetchImpl = fetch, model } = {}) {
  const gather = createDrafter({ getKey, laws, lawSearch, fetchImpl, model })._gather;
  const hits = new Map();
  return async function assist(input, user, extra = {}) {
    const who = { user_id: user && user.id, username: user && user.username }, mode = MODES[input.mode] ? input.mode : '';
    if (!mode) return { status: 400, body: { error: 'طلب غير معروف.' } };
    const q = String(input.question || '').slice(0, 2000).trim();
    if (mode === 'question' && q.length < 8) return { status: 400, body: { error: 'اكتب السؤال بوضوح.' } };
    if (MODES[mode].need && q.length < 20) return { status: 400, body: { error: MODES[mode].need } };
    if (mode === 'similar' && !(extra.rulings || []).length) return { status: 400, body: { error: 'مكتبة الاجتهادات فارغة. أضف أحكاماً من «البحث في الأحكام» أو «الاجتهادات القضائية» أولاً.' } };
    const key = await getKey(); if (!key) return { status: 400, body: { error: 'لم يُضبط مفتاح الذكاء الاصطناعي بعد. يضيفه مدير المكتب من إعدادات الصياغة.', needKey: true } };
    const now = Date.now(), k = String(user && (user.id || user.username)), a = (hits.get(k) || []).filter(t => now - t < 600e3);
    if (a.length >= 15) { hits.set(k, a); return { status: 429, body: { error: 'طلبات كثيرة. حاول بعد قليل.' } } } a.push(now); hits.set(k, a);
    const c = input.case || {}, an = anonymizer(c);
    const hist = an.hide(String(input.history || '').slice(0, 30000));
    const caseTxt = c.no || c.subject ? an.hide([c.no && `رقم الدعوى: ${c.no}`, c.court && `المحكمة: ${c.court}`, c.type && `نوع الدعوى: ${c.type}`, c.subject && `الموضوع: ${c.subject}`, c.role && `صفة موكلنا: ${c.role}`, c.stage && `المرحلة: ${c.stage}`, c.opened && `تاريخ فتح الملف: ${c.opened}`].filter(Boolean).join('\n')) : '';
    const head = `${caseTxt ? 'ملف القضية:\n' + caseTxt + '\n\n' : ''}${hist ? 'سجل القضية (الجلسات والمهل والمستندات والملاحظات):\n' + hist + '\n\n' : ''}${q ? ({ minutes: 'ملاحظات الاجتماع كما أملاها المحامي', client_msg: 'ملاحظة المحامي' }[mode] || 'سؤال المحامي') + ': ' + an.hide(q) + '\n\n' : ''}`;
    const LANGS = { en: 'الإنجليزية', he: 'العبرية', ar: 'العربية' }, lang = LANGS[input.lang] ? input.lang : 'en';
    const mdl = model || MODEL, M = { ...MODES[mode], ask: MODES[mode].ask.replace('{LANG}', LANGS[lang]) };
    /* المستند المراد مراجعته (عقد أو مستند للخصم): نص يُخفى منه الأسماء، أو PDF/صورة يُرسل كما هو */
    const doc = [];
    if (M.doc) {
      if (input.file && input.file.data) {
        const kind = MEDIA[input.file.type]; if (!kind) return { status: 400, body: { error: 'نوع الملف غير مدعوم. ارفع PDF أو صورة أو Word.' } };
        if (String(input.file.data).length > 14e6) return { status: 413, body: { error: 'الملف أكبر من 10 ميغابايت.' } };
        doc.push({ type: kind, source: { type: 'base64', media_type: input.file.type, data: String(input.file.data) } });
      } else {
        const t = String(input.text || '').slice(0, 120000).trim(); if (t.length < (M.min || 50)) return { status: 400, body: { error: 'ارفع المستند أو الصق نصه أولاً.' } };
        doc.push({ type: 'text', text: `${M.doc}:\n` + an.hide(t) });
      }
    }
    const msg = text => doc.length ? [...doc, { type: 'text', text }] : text;
    try {
      let refs = [], refTxt = '';
      if (M.refs) {
        const plan = toolInput(await callClaude(key, { model: mdl, max_tokens: 800, system: SYSTEM, tools: [PLAN_TOOL], tool_choice: { type: 'tool', name: 'plan_research' },
          messages: [{ role: 'user', content: msg(`${head}${M.ask}\n\nحدّد عبارات البحث عن التشريعات الفلسطينية والأحكام ذات الصلة والكلمات المفتاحية.`) }] }, fetchImpl), 'plan_research');
        refs = await gather(plan, extra.rulings, input.web !== false && mode !== 'similar', user, { rulings: M.rulings });
        refTxt = refs.map(r => `[${r.id}] ${r.kind === 'ruling' ? 'حكم قضائي' : 'تشريع'}: ${r.title}${r.ref ? ' (' + r.ref + ')' : ''}\n${r.arts.map(x => (x.head ? x.head + ': ' : '') + x.text).join('\n')}`).join('\n\n').slice(0, MAX_CTX);
      }
      const out = toolInput(await callClaude(key, { model: mdl, max_tokens: 6000, system: SYSTEM, tools: [ANSWER_TOOL], tool_choice: { type: 'tool', name: 'submit_answer' },
        messages: [{ role: 'user', content: msg(`${head}${M.ask}${M.refs ? '\n\nالمراجع المتاحة (لا يُستشهد بغيرها):\n' + (refTxt || '(لا توجد)') : ''}`) }] }, fetchImpl), 'submit_answer');
      const valid = new Set(refs.map(r => r.id)), fix = s => an.show(String(s || '')).replace(/\[(R\d+)\]/g, (m, id) => valid.has(id) ? m : '[مرجع يحتاج تحقق]');
      const sections = (out.sections || []).map(s => ({ heading: fix(s.heading), items: (s.items || []).map(fix) }));
      const used = new Set(sections.flatMap(s => s.items.join(' ').match(/R\d+/g) || []));
      const references = refs.filter(r => used.has(r.id)).map(r => ({ id: r.id, kind: r.kind, title: r.title, ref: r.ref, origin: r.origin, arts: r.arts.map(x => x.head).filter(Boolean), text: r.arts.map(x => (x.head ? x.head + ': ' : '') + x.text).join('\n').slice(0, 4000) }));
      audit && audit({ ...who, action: 'ai.assist', entity: 'cases', detail: { mode, refs: references.length, file: input.file ? input.file.type : undefined, lang: mode === 'translate' ? lang : undefined } });
      return { status: 200, body: { ok: true, mode, lang: mode === 'translate' ? lang : undefined, sections, references, unverified: (out.unverified || []).map(fix).filter(Boolean) } };
    } catch (e) { return { status: e.status || 500, body: { error: e.status ? e.message : 'تعذّر إتمام الطلب. أعد المحاولة.' } } }
  };
}

export { createDrafter, createExtractor, createAssistant, createCalcExtractor, anonymizer, pickArticles, DOC_TYPES, MODEL };
