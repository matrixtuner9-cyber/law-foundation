// مكتب واحد = Durable Object واحد بقاعدة SQLite خاصة به. لا يرى أي مكتب بيانات غيره.
// هذا نقل مباشر لخادم جهاز المكتب (server.js) مع: ملفات في R2 بروابط موقّعة، حماية من التخمين على كل البوابة،
// إعداد أول مدير برابط لمرة واحدة بدل "من جهاز المكتب فقط".
import { DurableObject } from 'cloudflare:workers';
import crypto from 'node:crypto';
import { openStore, COLL, diffFields } from './store.js';
import { createAuth } from './auth.js';
import { courts, STEPS } from './seed.js';
import { plan, rotate, lawformsGuard } from './merge.js';
import { fetchJudgment } from './maqam.js';
import { createService as maqamService } from './maqam-search.js';
import { createLaws } from './laws.js';
import { createLawSearch } from './law-sources.js';
import { createDrafter, createExtractor, createAssistant, DOC_TYPES, MODEL as AI_MODEL } from './ai-draft.js';

/* توقيع داخلي يثبت أن طلب /_ops وصل من الـ Worker بعد التحقق من رمز المشغّل (لا يمكن للزائر إرساله) */
export const opsSig = env => env.OPS_TOKEN ? crypto.createHash('sha256').update('mq-ops|' + env.OPS_TOKEN).digest('hex') : null;
const BACKUP_KEEP = 30;

const rid = () => crypto.randomBytes(6).toString('hex');
const pad = n => String(n).padStart(2, '0');
/* التوقيت المحلي لفلسطين في الطوابع (كما على جهاز المكتب) */
const local = (d = new Date()) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value])); return p };
const stamp = (d = new Date()) => { const p = local(d); return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` };
const stampS = (d = new Date()) => stamp(d) + ':' + local(d).second;
const EMPTY = () => ({ clients: [], opponents: [], cases: [], hearings: [], deadlines: [], docs: [], rulings: [], lawforms: [], mzLog: [] });

const DEFAULT_RULES = [
  { id: 'civ-appeal', name: 'استئناف حكم حقوقي', nature: 'civil', to: 'استئناف', from: ['صلح', 'بداية'], urgent: false, days: 30, start: 'judgment', ref: 'م205/1 وم193 من قانون أصول المحاكمات المدنية والتجارية رقم 2 لسنة 2001', verified: true },
  { id: 'civ-appeal-urgent', name: 'استئناف في المواد المستعجلة', nature: 'civil', to: 'استئناف', from: ['صلح', 'بداية'], urgent: true, days: 15, start: 'judgment', ref: 'م205/2 من قانون أصول المحاكمات المدنية والتجارية', verified: true },
  { id: 'civ-cassation', name: 'نقض حكم حقوقي', nature: 'civil', to: 'نقض', from: ['استئناف'], urgent: false, days: 40, start: 'judgment', ref: 'م227 وم193/1 من قانون أصول المحاكمات المدنية والتجارية', verified: true },
  { id: 'crim-appeal', name: 'استئناف حكم جزائي', nature: 'criminal', to: 'استئناف', from: ['صلح', 'بداية'], urgent: false, days: 15, start: 'judgment', ref: 'م328 من قانون الإجراءات الجزائية رقم 3 لسنة 2001 المعدلة بالقرار بقانون 17 لسنة 2014', verified: true },
  { id: 'crim-cassation', name: 'نقض حكم جزائي', nature: 'criminal', to: 'نقض', from: ['استئناف'], urgent: false, days: 40, start: 'judgment', ref: 'قانون الإجراءات الجزائية رقم 3 لسنة 2001 (يحتاج تأكيد المادة والمدة)', verified: false },
];

const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', svg: 'image/svg+xml', pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', txt: 'text/plain; charset=utf-8', rtf: 'application/rtf', odt: 'application/vnd.oasis.opendocument.text', webm: 'audio/webm', ogg: 'audio/ogg', m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', mp3: 'audio/mpeg' };
const FILE_EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heic', 'image/gif': 'gif', 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx', 'text/plain': 'txt' };
const EXT_OK = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf', 'odt']);
const AUDIO_EXT = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-client', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };
const json = (code, obj, extra = {}) => new Response(JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...SEC, ...extra } });
const MEDIA_TTL = 7 * 24 * 3600; // صلاحية رابط الملف الموقّع (ثوانٍ)

const ADMIN_FILES = new Set(['index.html', 'app.js', 'print.js', 'intake.js', 'rulings.js', 'maqamsearch.js', 'lawlib-data.js', 'lawlib.js', 'legislation.js', 'aidraft.js', 'dash.js', 'briefcase.js', 'sync.js', 'mizan-ui.js', 'data.js', 'admin.js', 'phase2.js', 'phase2.css', 'bar.js', 'bar.css', 'responsive.js', 'responsive.css', 'style.css', 'dash.css', 'briefcase.css', 'mizan.css', 'admin.css', 'prestige.css', 'hdr-banner.jpg', 'hdr-side.jpg', 'hdr-side.webp', 'hdr-emblem.jpg', 'hdr-logo.jpg']);
const PUBLIC_FILES = new Set(['login.html', 'login.js', 'login.css', 'scales.js', 'prestige.css', 'edition.js']);

/* توحيد الكتابة العربية للبحث في دليل المحامين */
export const norm = s => String(s || '').normalize('NFKC').replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').toLowerCase().replace(/\s+/g, ' ').trim();
const digits = s => String(s || '').replace(/\D/g, '');

/* صفحة رابط الدخول المرسل عبر واتساب: تتحقق من الرمز ثم تحفظه لبوابة الموكل وتفتحها */
const PLINK = code => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>الدخول إلى بوابة الموكل</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F9F6EF;color:#111B27;font-family:Cairo,Tahoma,sans-serif}.c{background:#fff;border:1px solid #EADCC6;border-radius:16px;padding:28px 24px;max-width:360px;width:calc(100% - 32px);text-align:center;box-shadow:0 10px 30px rgb(11 27 43 / .08)}h1{font-size:20px;margin:6px 0 10px}p{color:#6B7280;margin:0 0 16px;line-height:1.7}.s{width:34px;height:34px;border:3px solid #EADCC6;border-top-color:#B9965A;border-radius:50%;margin:8px auto;animation:r 1s linear infinite}@keyframes r{to{transform:rotate(1turn)}}a{display:inline-block;background:#0B1B2B;color:#F9F6EF;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:700}</style></head>
<body><div class="c" id="c"><div class="s"></div><h1>جارٍ تسجيل دخولك…</h1><p>لحظات ونفتح لك بوابة الموكل.</p></div>
<script>(async()=>{const code=${JSON.stringify(code)},c=document.getElementById('c');
const fail=m=>{c.innerHTML='<h1>تعذّر الدخول</h1><p>'+m+'</p><a href="/portal/">الدخول برمز الموكل</a>'};
try{const r=await fetch('/api/portal/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});const j=await r.json().catch(()=>({}));
if(!r.ok)return fail(j.error||'الرابط غير صالح أو منتهي.');
localStorage.setItem('flutter.code',JSON.stringify(j.code||code));history.replaceState(null,'','/portal/');location.replace('/portal/')}catch(e){fail('تحقق من اتصالك بالإنترنت ثم أعد فتح الرابط.')}})()</script></body></html>`;

export class Office extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = openStore(ctx);
    this.auth = createAuth(this.store);
    this.state = this.store.loadState();
    this.msgs = this.store.loadMessages();
    this.streams = new Map();
    this.enc = new TextEncoder();
    this.ping = null;
  }

  /* ── أدوات ── */
  slug() { return this.store.kv.get('slug') }
  audit(e) { try { this.store.audit({ at: stampS(), ...e }) } catch (err) { console.error('[audit]', err.message) } }
  settings() { const s = this.store.kv.get('settings', {}); const g = this.store.kv.get('support_grant'); const b = this.store.kv.get('backup_last'); return { edition: 'office', officeName: '', lawyerName: '', city: '', phone: '', hours: '', ...s, cloud: true, supportUntil: g && g.until > Date.now() ? g.until : null, backupLast: b || null } }
  officeInfo() { const s = this.settings(); return { name: s.officeName, lawyer: s.lawyerName, city: s.city, phone: s.phone, hours: s.hours } }
  rules() { const saved = this.store.kv.get('appeal_rules', {}); return DEFAULT_RULES.map(r => ({ ...r, ...(saved[r.id] || {}) })) }
  cur() { return this.state || EMPTY() }
  mediaKey() { let k = this.store.kv.get('media_key'); if (!k) { k = crypto.randomBytes(32).toString('hex'); this.store.kv.set('media_key', k) } return k }
  sign(file, exp) { return crypto.createHmac('sha256', this.mediaKey()).update(file + '|' + exp).digest('base64url').slice(0, 32) }
  mediaUrl(file) { const exp = Math.floor(Date.now() / 1000 / 3600) * 3600 + MEDIA_TTL; return `/api/media/${file}?e=${exp}&s=${this.sign(file, exp)}` }
  pub(m) { const { by, ...rest } = m; return { ...rest, file: m.file ? this.mediaUrl(m.file) : null } } // لا تُكشف أسماء مستخدمي المكتب للموكل
  pubAdmin(m) { return { ...m, file: m.file ? this.mediaUrl(m.file) : null } }
  labelOf(r) { return r && (r.name || r.no || r.title || r.purpose || r.subject || r.id) }
  canSeeClient(u, cid) { return this.auth.can(u, 'all') || this.cur().cases.some(k => k.client === cid && (u.cases || []).includes(k.id)) }
  scope(u, S) {
    if (this.auth.can(u, 'all')) return S;
    const ids = new Set(u.cases || []), cases = S.cases.filter(k => ids.has(k.id));
    const cl = new Set(cases.map(k => k.client)), op = new Set(cases.flatMap(k => k.opps || []));
    return { clients: S.clients.filter(c => cl.has(c.id)), opponents: S.opponents.filter(o => op.has(o.id)), cases,
      hearings: S.hearings.filter(h => ids.has(h.k)), deadlines: S.deadlines.filter(d => ids.has(d.k)), docs: S.docs.filter(d => ids.has(d.k)), mzLog: (S.mzLog || []).filter(l => ids.has(l.k)), rulings: S.rulings || [], lawforms: S.lawforms || [] };
  }

  /* ── البث المباشر لشاشة المكتب (SSE) ── */
  broadcast(type, payload) {
    const s = this.enc.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
    for (const [w, u] of this.streams) {
      if (type === 'mizan' && u.role !== 'admin') continue;
      if (payload && payload.client && !this.canSeeClient(u, payload.client)) continue;
      w.write(s).catch(() => this.streams.delete(w));
    }
  }
  openStream(me) {
    const { readable, writable } = new TransformStream(), w = writable.getWriter();
    w.write(this.enc.encode('retry: 3000\n\n')).catch(() => {});
    this.streams.set(w, me);
    if (!this.ping) this.ping = setInterval(() => {
      if (!this.streams.size) { clearInterval(this.ping); this.ping = null; return }
      const p = this.enc.encode(': ping\n\n');
      for (const [x] of this.streams) x.write(p).catch(() => this.streams.delete(x));
    }, 25000);
    return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
  }

  addMsg(m) {
    const msg = { id: rid(), at: stamp(), read: m.from === 'lawyer', seen: m.from === 'client', ...m };
    this.msgs.push(msg); this.store.putMessage(msg); this.broadcast('message', this.pubAdmin(msg));
    return msg;
  }

  /* ── بوابة الموكل ── */
  clientByCode(code) { const c = String(code || '').trim().toUpperCase(); return c ? this.cur().clients.find(x => (x.code || '').toUpperCase() === c) : null }
  portalHome(cl) {
    const S = this.cur();
    const cases = S.cases.filter(k => k.client === cl.id).map(k => {
      const court = courts.find(c => c.id === k.court);
      const hs = S.hearings.filter(h => h.k === k.id).sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));
      return { id: k.id, no: k.no, subject: k.subject, type: k.type, role: k.role, stage: k.stage, step: k.step, status: k.status, court: court ? court.name : '',
        opponents: (k.opps || []).map(o => (S.opponents.find(x => x.id === o) || {}).name).filter(Boolean),
        hearings: hs.map(h => ({ date: h.date, time: h.time || '', purpose: h.purpose, result: h.result || null, attend: !!h.attend })) };
    });
    const docs = S.docs.filter(d => d.shared && cases.some(k => k.id === d.k)).sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map(d => ({ title: d.title, kind: d.kind, date: d.date, pages: d.pages, caseNo: (S.cases.find(k => k.id === d.k) || {}).no }));
    return { client: { id: cl.id, name: cl.name, code: cl.code, type: cl.type, fee: cl.fee, paid: cl.paid, ch: cl.ch, phone: cl.phone || '', phone2: cl.phone2 || '', whatsapp: cl.whatsapp || '' }, office: this.officeInfo(), steps: STEPS, cases, docs };
  }
  /* بث السجلات المعدّلة لزملاء المكتب فوراً (المحامي الخارجي يراها عند إعادة التحميل) */
  broadcastRecords(recs, byId, del = []) {
    if (!recs.length && !del.length) return;
    const s = this.enc.encode(`event: records\ndata: ${JSON.stringify({ by: byId, recs, del })}\n\n`);
    for (const [w, u] of this.streams) if (this.auth.can(u, 'all')) w.write(s).catch(() => this.streams.delete(w));
  }
  ensureState() { if (!this.state) { this.state = EMPTY(); this.store.saveState(null, this.state, 'system', stampS()) } }
  touchClient(cl) { if (!this.state) return; const c = this.state.clients.find(x => x.id === cl.id); if (c) { c.last = stamp().slice(0, 10); c._v = (c._v || 0) + 1; this.store.putRecord('clients', c, 'portal:' + cl.code, stampS()); this.broadcastRecords([{ kind: 'clients', rec: c }], null) } }

  /* ── نقطة الدخول: الطلب يصل من الـ Worker ومعه اسم المكتب ── */
  async fetch(req) {
    const u = new URL(req.url), slug = req.headers.get('x-mq-office');
    if (slug && !this.slug()) this.store.kv.set('slug', slug);
    if (slug && slug !== this.slug()) return new Response('office mismatch', { status: 500 });
    let res;
    try {
      if (u.pathname.startsWith('/_ops/')) res = await this.ops(req, u);
      else if (u.pathname.startsWith('/api/')) res = await this.api(req, u);
      else res = await this.static(req, u);
    } catch (e) { console.error(e); res = json(500, { error: 'خطأ في الخادم' }) }
    // ردّ مبكر قبل قراءة جسم الطلب (رفض/تكرار) يقطع الاتصال؛ نستهلكه أولاً
    if (req.body && !req.bodyUsed) await req.arrayBuffer().catch(() => {});
    return res;
  }

  async static(req, u) {
    let p; try { p = decodeURIComponent(u.pathname) } catch (e) { return new Response('bad', { status: 400 }) }
    const asset = path => this.env.ASSETS.fetch(new Request(new URL(path, u.origin), { headers: { 'accept-encoding': req.headers.get('accept-encoding') || '' } }));
    const noStore = async r => { const h = new Headers(r.headers); h.set('Cache-Control', 'no-store'); Object.entries(SEC).forEach(([k, v]) => h.set(k, v)); return new Response(r.body, { status: r.status, headers: h }) };
    { const m = /^\/p\/(MQ-[A-Za-z0-9]{3,12})$/i.exec(p); if (m) return new Response(PLINK(m[1].toUpperCase()), { headers: { ...SEC, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }) }
    if (p === '/portal') return Response.redirect(new URL('/portal/', u.origin).href, 302);
    if (p.startsWith('/portal/')) {
      let r = await asset('/app' + p);
      if (r.status === 404 || p.endsWith('/')) r = await asset('/app/portal/index.html');
      return noStore(r);
    }
    const name = p === '/' ? 'index.html' : p.slice(1);
    if (/^fonts\/[a-z0-9-]+\.(woff2|css|txt)$/.test(name)) { const r = await asset('/app/' + name); const h = new Headers(r.headers); h.set('Cache-Control', 'public, max-age=604800'); return new Response(r.body, { status: r.status, headers: h }) }
    if (PUBLIC_FILES.has(name)) {
      if (name === 'login.html' && this.auth.fromReq(req)) return Response.redirect(new URL('/', u.origin).href, 302);
      return noStore(await asset('/app/' + name));
    }
    if (!ADMIN_FILES.has(name)) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (!this.auth.fromReq(req)) {
      if (name.endsWith('.html')) return Response.redirect(new URL('/login.html', u.origin).href, 302);
      return new Response(null, { status: 401 });
    }
    return noStore(await asset('/app/' + name));
  }

  async api(req, u) {
    const p = u.pathname, M = req.method, ip = req.headers.get('cf-connecting-ip') || '127.0.0.1';
    const secure = u.protocol === 'https:';
    const jbody = async (limit = 4 * 1024 * 1024) => { try { const t = await req.text(); return t.length > limit ? {} : JSON.parse(t || '{}') } catch (e) { return {} } };
    if (M === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (p === '/api/health') return json(200, { ok: true, at: stamp() });
    /* السحابة دائماً «ميثاق متصل» */
    if (p === '/api/edition') return json(200, { id: 'connected', name: 'ميثاق متصل', tagline: 'مكتبك وموكّلوك على اتصال دائم', offline: false, features: { portal: true, push: true, mizan: true, judgmentSearch: true, rulingImport: true, barRefresh: true, externalLinks: true } });
    if (p === '/api/portal/push-key') return json(200, { enabled: false, key: null });

    /* الملفات: لموظفي المكتب بجلستهم، وللموكل برابط موقّع مؤقت */
    if (p.startsWith('/api/media/')) {
      const file = p.slice(11);
      if (!/^[a-f0-9]{12}\.[a-z0-9]{2,5}$/.test(file)) return new Response('Not found', { status: 404, headers: CORS });
      const e = +u.searchParams.get('e'), s = u.searchParams.get('s') || '';
      const okSig = e > Date.now() / 1000 && s.length === 32 && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(this.sign(file, e)));
      if (!okSig) {
        const me = this.auth.fromReq(req), m = this.msgs.find(x => x.file === file);
        const ref = '/api/media/' + file, ruling = !m && !!me && ((this.cur().rulings || []).some(r => r.file === ref) || (this.cur().lawforms || []).some(r => r.official && r.official.file === ref));
        if (!me || (!ruling && (!m || !this.canSeeClient(me, m.client)))) return new Response('Forbidden', { status: 403, headers: CORS });
      }
      return this.media(req, file);
    }

    /* ── بوابة الموكل (الدخول بالرمز، مع حماية من التخمين على كل العناوين) ── */
    if (p.startsWith('/api/portal/')) {
      const failKey = 'pfail:' + ip;
      if (this.store.blocked(failKey, 20, 15 * 60e3)) return json(429, { error: 'محاولات كثيرة. حاول بعد قليل.' });
      if (p === '/api/portal/login' && M === 'POST') {
        if (this.store.hit('plogin:' + ip, 30, 10 * 60e3)) return json(429, { error: 'محاولات كثيرة. حاول بعد قليل.' });
        const { code } = await jbody(); const cl = this.clientByCode(code);
        if (!cl || !cl.portal) { this.store.hit(failKey, 20, 15 * 60e3); return json(401, { error: 'رمز الدخول غير صحيح أو البوابة غير مفعّلة لحسابك. تواصل مع المكتب.' }) }
        this.touchClient(cl); this.audit({ username: 'portal:' + cl.code, action: 'portal.login', entity: 'clients', entity_id: cl.id, detail: { label: cl.name }, ip });
        return json(200, { ok: true, name: cl.name, code: cl.code });
      }
      const cl = this.clientByCode(req.headers.get('x-client') || u.searchParams.get('code'));
      if (!cl || !cl.portal) { this.store.hit(failKey, 20, 15 * 60e3); return json(401, { error: 'انتهت الجلسة، يرجى الدخول من جديد.' }) }
      const who = { username: 'portal:' + cl.code, ip };
      if (p === '/api/portal/home') return json(200, this.portalHome(cl));
      if (p === '/api/portal/profile' && M === 'POST') {
        const b = await jbody(), ok = v => /^[+\d][\d\s-]{5,19}$/.test(v), clean = v => String(v || '').trim().slice(0, 20);
        const upd = { phone: clean(b.phone), phone2: clean(b.phone2), whatsapp: clean(b.whatsapp) };
        if (Object.values(upd).some(v => v && !ok(v))) return json(400, { error: 'تحقق من الأرقام: أرقام فقط، ويمكن أن تبدأ بـ +' });
        this.ensureState();
        const c = this.state.clients.find(x => x.id === cl.id), before = { ...c }; Object.assign(c, upd); c._v = (c._v || 0) + 1; this.store.putRecord('clients', c, who.username, stampS()); this.broadcastRecords([{ kind: 'clients', rec: c }], null);
        this.audit({ ...who, action: 'record.update', entity: 'clients', entity_id: c.id, detail: { label: c.name, fields: diffFields(before, c), via: 'portal' } });
        this.broadcast('profile', { client: cl.id, ...upd });
        return json(200, upd);
      }
      if (p === '/api/portal/push-subscribe' && M === 'POST') return json(200, { ok: true });
      if (p === '/api/portal/messages' && M === 'GET') {
        const changed = [];
        if (!u.searchParams.get('peek')) this.msgs.forEach(m => { if (m.client === cl.id && m.from === 'lawyer' && !m.seen) { m.seen = true; changed.push(m) } });
        if (changed.length) { this.store.putMessages(changed); this.broadcast('seen', { client: cl.id }) }
        return json(200, this.msgs.filter(m => m.client === cl.id).map(m => this.pub(m)));
      }
      if (p === '/api/portal/messages' && M === 'POST') {
        const { text } = await jbody(); const t = String(text || '').trim().slice(0, 4000);
        if (!t) return json(400, { error: 'الرسالة فارغة.' });
        const m = this.addMsg({ client: cl.id, from: 'client', type: 'text', text: t, ch: 'البوابة' });
        this.audit({ ...who, action: 'message.receive', entity: 'messages', entity_id: m.id, detail: { client: cl.id, label: cl.name, type: 'text' } });
        return json(201, this.pub(m));
      }
      if (p === '/api/portal/voice' && M === 'POST') return this.voice(req, u, cl.id, 'client', who);
      if (p === '/api/portal/file' && M === 'POST') return this.attach(req, u, cl.id, 'client', who);
      return json(404, { error: 'not found' });
    }

    /* ── تسجيل الدخول لشاشة المكتب ── */
    const setupOk = t => { const s = this.store.kv.get('setup'); return !!(s && t && s.exp > Date.now() && s.hash === crypto.createHash('sha256').update(String(t)).digest('hex')) };
    if (p === '/api/auth/status') return json(200, { setup: !this.auth.hasUsers(), local: setupOk(u.searchParams.get('setup')), office: this.settings().officeName, lawyer: this.settings().lawyerName });
    if (p === '/api/auth/setup' && M === 'POST') {
      if (this.auth.hasUsers()) return json(409, { error: 'تم إعداد النظام مسبقاً.' });
      const b = await jbody();
      if (!setupOk(b.setupToken)) return json(403, { error: 'رابط الإعداد غير صالح أو منتهي. اطلب رابطاً جديداً من مزود الخدمة.' });
      let user; try { user = this.auth.createUser({ username: b.username, name: b.name, role: 'admin', password: b.password }, stampS()) } catch (e) { return json(400, { error: e.message }) }
      this.store.kv.set('setup', null);
      this.audit({ user_id: user.id, username: user.username, action: 'auth.setup', entity: 'users', entity_id: user.id, detail: { label: user.name }, ip });
      const r = this.auth.login(b.username, b.password, ip, req.headers.get('user-agent'), stampS());
      this.audit({ user_id: user.id, username: user.username, action: 'auth.login', ip });
      return json(200, { user: r.user }, { 'Set-Cookie': this.auth.cookie(r.token, secure) });
    }
    if (p === '/api/auth/login' && M === 'POST') {
      if (this.store.hit('login:' + ip, 30, 10 * 60e3)) return json(429, { error: 'محاولات كثيرة من هذا الجهاز. حاول بعد 10 دقائق.' });
      const b = await jbody(), r = this.auth.login(b.username, b.password, ip, req.headers.get('user-agent'), stampS());
      if (r.error) {
        this.audit({ user_id: r.user && r.user.id, username: String(b.username || '').slice(0, 40), action: r.locked ? 'auth.locked' : 'auth.login_failed', ip });
        return json(401, { error: r.error });
      }
      this.audit({ user_id: r.user.id, username: r.user.username, action: 'auth.login', ip });
      return json(200, { user: r.user }, { 'Set-Cookie': this.auth.cookie(r.token, secure) });
    }
    if (p === '/api/auth/logout' && M === 'POST') {
      const me = this.auth.fromReq(req); if (me) { this.auth.logout(me.token); this.audit({ user_id: me.id, username: me.username, action: 'auth.logout', ip }) }
      return json(200, { ok: true }, { 'Set-Cookie': this.auth.clearCookie(secure) });
    }

    const me = this.auth.fromReq(req);
    if (!me) return json(401, { error: 'انتهت الجلسة. سجّل الدخول من جديد.', login: true });
    const who = { user_id: me.id, username: me.username, ip };
    const deny = what => this.auth.can(me, what) ? null : json(403, { error: 'لا تملك صلاحية لهذا الإجراء.' });
    let d;

    if (p === '/api/auth/me') return json(200, { user: { ...me, token: undefined }, roles: Object.fromEntries(Object.entries(this.auth.ROLES).map(([k, v]) => [k, v.label])), settings: this.settings() });
    if (p === '/api/me/password' && M === 'POST') {
      const b = await jbody();
      if (!this.auth.checkPassword(me.id, b.current)) return json(400, { error: 'كلمة المرور الحالية غير صحيحة.' });
      try { this.auth.setPassword(me.id, b.password, false) } catch (e) { return json(400, { error: e.message }) }
      this.audit({ ...who, action: 'user.password_change', entity: 'users', entity_id: me.id });
      return json(200, { ok: true });
    }
    if (p === '/api/stream') return this.openStream(me);

    if (p === '/api/settings' && M === 'GET') return json(200, this.settings());
    if (p === '/api/settings' && M === 'POST') {
      if ((d = deny('manage'))) return d;
      const b = await jbody(), before = this.settings();
      const t = (v, dd, n) => String(v == null ? dd : v).trim().slice(0, n) || dd;
      const next = { edition: ['office', 'insurance'].includes(b.edition) ? b.edition : before.edition, officeName: t(b.officeName, before.officeName, 120), lawyerName: t(b.lawyerName, before.lawyerName, 80), city: t(b.city, before.city, 40), phone: t(b.phone, before.phone, 30), hours: t(b.hours, before.hours, 80) };
      this.store.kv.set('settings', next);
      this.audit({ ...who, action: 'settings.update', detail: { fields: diffFields(before, next) } });
      return json(200, this.settings());
    }

    /* دليل محامي النقابة: قاعدة مشتركة (D1) لكل المكاتب */
    if (p === '/api/bar' && M === 'GET') return json(200, await this.barSearch(u.searchParams));
    if (p === '/api/bar/status') return json(200, { running: false, progress: null, meta: await this.barMeta() });
    if (p === '/api/bar/refresh' && M === 'POST') return json(403, { error: 'تحديث الدليل يتم مركزياً من مزود الخدمة لكل المكاتب.' });

    if (p === '/api/rules' && M === 'GET') return json(200, this.rules());
    if (p === '/api/rules' && M === 'POST') {
      if ((d = deny('manage'))) return d;
      const b = await jbody(), before = this.rules(), saved = this.store.kv.get('appeal_rules', {}), changes = [];
      for (const r of Array.isArray(b) ? b : []) {
        const def = DEFAULT_RULES.find(x => x.id === r.id); if (!def) continue;
        const days = Math.round(+r.days); if (!(days >= 1 && days <= 365)) return json(400, { error: 'المدة يجب أن تكون بين 1 و365 يوماً.' });
        const next = { days, verified: !!r.verified, ref: String(r.ref || def.ref).slice(0, 200) }, old = before.find(x => x.id === r.id);
        const f = diffFields({ days: old.days, verified: old.verified, ref: old.ref }, next);
        if (f.length) { saved[r.id] = next; changes.push({ id: r.id, name: def.name, fields: f }) }
      }
      this.store.kv.set('appeal_rules', saved);
      changes.forEach(c => this.audit({ ...who, action: 'rules.update', entity: 'rules', entity_id: c.id, detail: { label: c.name, fields: c.fields } }));
      return json(200, this.rules());
    }

    if (p === '/api/users' && M === 'GET') { if ((d = deny('manage'))) return d; return json(200, this.auth.list()) }
    if (p === '/api/users' && M === 'POST') {
      if ((d = deny('manage'))) return d;
      const b = await jbody();
      let user; try { user = this.auth.createUser({ username: b.username, name: b.name, role: b.role, password: b.password, cases: Array.isArray(b.cases) ? b.cases : [], mustChange: true }, stampS()) } catch (e) { return json(400, { error: e.message }) }
      this.audit({ ...who, action: 'user.create', entity: 'users', entity_id: user.id, detail: { label: user.name, username: user.username, role: user.role, cases: user.cases } });
      return json(201, user);
    }
    const um = /^\/api\/users\/([\w]+)(\/password)?$/.exec(p);
    if (um && M === 'POST') {
      if ((d = deny('manage'))) return d;
      const b = await jbody();
      if (um[2]) {
        try { this.auth.setPassword(um[1], b.password, true); this.auth.logoutUser(um[1]) } catch (e) { return json(400, { error: e.message }) }
        this.audit({ ...who, action: 'user.password_reset', entity: 'users', entity_id: um[1], detail: { label: (this.auth.get(um[1]) || {}).name } });
        return json(200, { ok: true });
      }
      let r; try { r = this.auth.updateUser(um[1], { name: b.name, role: b.role, active: b.active, cases: Array.isArray(b.cases) ? b.cases : null }, me.id) } catch (e) { return json(400, { error: e.message }) }
      const strip = x => ({ name: x.name, role: x.role, active: x.active, cases: x.cases });
      this.audit({ ...who, action: 'user.update', entity: 'users', entity_id: um[1], detail: { label: r.after.name, fields: diffFields(strip(r.before), strip(r.after)) } });
      return json(200, r.after);
    }

    if (p === '/api/audit') { if ((d = deny('manage'))) return d; const s = u.searchParams; return json(200, this.store.auditList({ limit: s.get('limit'), before: s.get('before'), action: s.get('action') || '', user: s.get('user') || '', text: s.get('q') || '' })) }
    if (p === '/api/audit/verify') { if ((d = deny('manage'))) return d; return json(200, this.store.auditVerify()) }

    /* ميزان: يعمل من وكيل المكتب على جهاز المكتب (الوكيل يُضاف لاحقاً) */
    if (p.startsWith('/api/mizan/')) {
      if ((d = deny('manage'))) return d;
      if (p === '/api/mizan/status') return json(200, { configured: false, cred: null, running: false, last: null, captures: 0, agent: true });
      return json(403, { error: 'الربط مع ميزان يعمل من «وكيل المكتب» على جهاز المكتب، ويُفعّل في مرحلة لاحقة.' });
    }

    if (p === '/api/admin/bootstrap') {
      const st = this.auth.can(me, 'all') ? this.state : this.scope(me, this.cur());
      return json(200, { state: st, messages: this.msgs.filter(m => this.canSeeClient(me, m.client)).map(m => this.pubAdmin(m)), push: {}, pushReady: false, user: { ...me, token: undefined }, settings: this.settings() });
    }
    /* الحفظ الآمن: السجلات المتغيرة فقط مع رقم إصدار كل سجل (merge.js) */
    if (p === '/api/admin/state' && M === 'POST') {
      if ((d = deny('write'))) return d;
      const b = await jbody(25 * 1024 * 1024);
      const first = !this.state, at = stampS();
      const r = plan(this.state, b, { randomBytes: n => crypto.randomBytes(n), hashId: (k, x) => 'a' + crypto.createHash('sha1').update(k + JSON.stringify(x)).digest('hex').slice(0, 10) });
      if (!r) return json(400, { error: 'طلب حفظ غير صالح' });
      const lg = lawformsGuard(this.state, r.writes, this.auth.can(me, 'manage')); if (lg) return json(403, { error: lg });
      this.store.applyWrites(r.writes, r.next.mzLog, me.username, at); this.state = r.next;
      if (first) this.audit({ ...who, action: 'state.init', detail: { records: r.writes.length } });
      else r.writes.forEach(c => this.audit({ ...who, action: 'record.' + c.op, entity: c.kind, entity_id: c.id, detail: { label: this.labelOf(c.rec), ...(c.fields ? { fields: c.fields } : {}) } }));
      r.codes.filter(([id]) => r.writes.some(w => w.op === 'create' && w.id === id)).forEach(([id]) => this.audit({ ...who, action: 'portal.code_issue', entity: 'clients', entity_id: id }));
      if (r.conflicts.length) this.audit({ ...who, action: 'state.conflict', detail: { n: r.conflicts.length, ids: r.conflicts.slice(0, 20).map(c => c.kind + ':' + c.id) } });
      this.broadcastRecords(r.writes.filter(w => w.op !== 'delete').map(w => ({ kind: w.kind, rec: w.rec })), String(req.headers.get('x-mq-tab') || '').slice(0, 16) || null, r.writes.filter(w => w.op === 'delete').map(w => ({ kind: w.kind, id: w.id })));
      return json(200, { ok: true, changed: r.writes.length, versions: r.versions, conflicts: r.conflicts, codes: r.codes });
    }
    if ((p === '/api/admin/client-code' || p === '/api/admin/rotate-weak') && M === 'POST') {
      const weak = p.endsWith('weak');
      if ((d = deny(weak ? 'manage' : 'write'))) return d;
      if (!this.state) return json(409, { error: 'لا توجد بيانات محفوظة بعد.' });
      const { client } = weak ? {} : await jbody();
      if (!weak && !this.state.clients.some(c => c.id === client)) return json(404, { error: 'الموكل غير موجود' });
      const done = rotate(this.state, weak ? 'weak' : [client], { randomBytes: n => crypto.randomBytes(n) });
      this.store.applyWrites(done.map(x => ({ op: 'update', kind: 'clients', id: x.rec.id, rec: x.rec })), undefined, me.username, stampS());
      done.forEach(x => this.audit({ ...who, action: 'portal.code_rotate', entity: 'clients', entity_id: x.rec.id, detail: { label: x.rec.name } }));
      this.broadcastRecords(done.map(x => ({ kind: 'clients', rec: x.rec })), null);
      return json(200, { ok: true, n: done.length, clients: done.map(x => ({ id: x.rec.id, code: x.rec.code, _v: x.rec._v })) });
    }
    /* وصول الدعم الفني: لا يستطيع مزود الخدمة تصدير بيانات المكتب إلا بإذن مؤقت يمنحه مدير المكتب ويُسجّل */
    if (p === '/api/support' && M === 'GET') { if ((d = deny('manage'))) return d; const g = this.store.kv.get('support_grant'); return json(200, { until: g && g.until > Date.now() ? g.until : null, by: g && g.by }) }
    if (p === '/api/support/grant' && M === 'POST') {
      if ((d = deny('manage'))) return d;
      const { hours } = await jbody(); const h = Math.min(72, Math.max(1, Math.round(+hours || 24)));
      const g = { until: Date.now() + h * 3600e3, by: me.username, at: stampS() }; this.store.kv.set('support_grant', g);
      this.audit({ ...who, action: 'support.grant', detail: { hours: h } });
      return json(200, { until: g.until });
    }
    if (p === '/api/support/revoke' && M === 'POST') {
      if ((d = deny('manage'))) return d;
      this.store.kv.set('support_grant', null); this.audit({ ...who, action: 'support.revoke' });
      return json(200, { until: null });
    }
    if (p === '/api/admin/messages' && M === 'POST') {
      if ((d = deny('write'))) return d;
      const { client, text, ch, type } = await jbody(); const t = String(text || '').trim().slice(0, 4000);
      if (!client || !t) return json(400, { error: 'missing' });
      const m = this.addMsg({ client, from: 'lawyer', type: type === 'notice' ? 'notice' : 'text', text: t, ch: ch || 'البوابة', by: me.username });
      this.audit({ ...who, action: 'message.send', entity: 'messages', entity_id: m.id, detail: { client, label: (this.cur().clients.find(c => c.id === client) || {}).name, type: m.type, preview: t.slice(0, 80) } });
      return json(201, this.pubAdmin(m));
    }
    if (p === '/api/admin/voice' && M === 'POST') { if ((d = deny('write'))) return d; return this.voice(req, u, u.searchParams.get('client'), 'lawyer', who) }
    if (p === '/api/admin/file' && M === 'POST') { if ((d = deny('write'))) return d; return this.attach(req, u, u.searchParams.get('client'), 'lawyer', who) }
    if (p === '/api/admin/ruling-import' && M === 'POST') {
      if ((d = deny('write'))) return d;
      const b = await jbody(4096), now = Date.now();
      this.importLog = (this.importLog || []).filter(t => now - t < 3600e3);
      if (this.importBusy || this.importLog.length >= 60) return json(429, { error: 'استيراد كثير خلال ساعة. حاول بعد قليل.' });
      this.importBusy = true; this.importLog.push(now);
      try {
        const r = await fetchJudgment(b.url, fetch);
        this.audit({ ...who, action: r.ok ? 'ruling.import' : 'ruling.import_failed', entity: 'rulings', detail: { url: String(b.url || '').slice(0, 200), ...(r.ok ? { no: r.ruling.no } : { error: r.error }) } });
        return r.ok ? json(200, r) : json(r.status || 400, { error: r.error });
      } finally { this.importBusy = false }
    }
    if (p.startsWith('/api/admin/maqam/') && M === 'GET') {
      this.mqSearch ||= maqamService({ audit: e => this.audit(e) });
      const r = await this.mqSearch(p.slice(17), u.searchParams, me);
      if (r.file) return new Response(r.file.body, { headers: { 'Content-Type': r.file.contentType, 'Content-Disposition': `attachment; filename="${r.file.filename}"`, 'Cache-Control': 'no-store', ...CORS, ...SEC } });
      return json(r.status, r.body, r.status === 429 && r.body.retry ? { 'Retry-After': String(r.body.retry) } : {});
    }
    if (p.startsWith('/api/admin/ai/')) {
      /* صياغة اللوائح بالذكاء الاصطناعي: مفتاح المكتب (أو مفتاح المنصة) في الخادم فقط */
      const a = p.slice(14), aiKey = () => this.store.kv.get('ai_key') || this.env.ANTHROPIC_API_KEY || '';
      if (a === 'status' && M === 'GET') { const k = aiKey(); return json(200, { configured: !!k, last4: k ? k.slice(-4) : '', model: AI_MODEL, types: DOC_TYPES, canManage: this.auth.can(me, 'manage') }) }
      if (a === 'key' && M === 'POST') {
        if ((d = deny('manage'))) return d; const b = await jbody(); const k = String(b.key || '').trim();
        if (k && !/^sk-ant-[\w-]{20,200}$/.test(k)) return json(400, { error: 'صيغة المفتاح غير صحيحة (يبدأ بـ sk-ant-).' });
        this.store.kv.set('ai_key', k || null); this.audit({ ...who, action: k ? 'ai.key_set' : 'ai.key_removed', entity: 'settings', detail: k ? { last4: k.slice(-4) } : {} });
        return json(200, { ok: true, configured: !!k, last4: k ? k.slice(-4) : '' });
      }
      if (a === 'extract' && M === 'POST') {
        if ((d = deny('write'))) return d;
        this.extractor ||= createExtractor({ audit: e => this.audit(e), getKey: aiKey, model: this.env.MQ_AI_MODEL });
        const r = await this.extractor(await jbody(16 * 1024 * 1024), me); return json(r.status, r.body);
      }
      if (a === 'assist' && M === 'POST') {
        if ((d = deny('write'))) return d;
        this.laws ||= createLaws({ all: this.store.all, run: this.store.run, tx: this.store.tx }, { randomId: () => 'L' + crypto.randomBytes(6).toString('hex'), now: stampS });
        this.lawSearch ||= createLawSearch({ audit: e => this.audit(e) });
        this.assistant ||= createAssistant({ audit: e => this.audit(e), getKey: aiKey, laws: this.laws, lawSearch: this.lawSearch, model: this.env.MQ_AI_MODEL });
        const r = await this.assistant(await jbody(16 * 1024 * 1024), me, { rulings: (this.cur().rulings) || [] }); return json(r.status, r.body);
      }
      if (a === 'draft' && M === 'POST') {
        if ((d = deny('write'))) return d;
        this.laws ||= createLaws({ all: this.store.all, run: this.store.run, tx: this.store.tx }, { randomId: () => 'L' + crypto.randomBytes(6).toString('hex'), now: stampS });
        this.lawSearch ||= createLawSearch({ audit: e => this.audit(e) });
        this.drafter ||= createDrafter({ audit: e => this.audit(e), getKey: aiKey, laws: this.laws, lawSearch: this.lawSearch, model: this.env.MQ_AI_MODEL });
        const r = await this.drafter(await jbody(2 * 1024 * 1024), me, { rulings: (this.cur().rulings) || [] }); return json(r.status, r.body);
      }
      return json(404, { error: 'غير موجود' });
    }
    if (p.startsWith('/api/admin/lawsearch/') && M === 'GET') {
      this.lawSearch ||= createLawSearch({ audit: e => this.audit(e) });
      const r = await this.lawSearch(p.slice(21), Object.fromEntries(u.searchParams), me);
      return json(r.status, r.body, r.status === 429 && r.body.retry ? { 'Retry-After': String(r.body.retry) } : {});
    }
    if (p.startsWith('/api/admin/laws/')) {
      /* مكتبة التشريعات: جدول خاص في SQLite المكتب (لا تمر بالمزامنة لأن نصوصها كبيرة) */
      this.laws ||= createLaws({ all: this.store.all, run: this.store.run, tx: this.store.tx }, { randomId: () => 'L' + crypto.randomBytes(6).toString('hex'), now: stampS });
      const r = await this.laws.handle(p.slice(16), M, Object.fromEntries(u.searchParams), () => jbody(25 * 1024 * 1024), me, w => this.auth.can(me, w), who, e => this.audit(e));
      if (r.file) return new Response(r.file.body, { headers: { 'Content-Type': r.file.contentType, 'Content-Disposition': `attachment; filename="${r.file.filename}"`, 'Cache-Control': 'no-store', ...CORS, ...SEC } });
      return json(r.status, r.body);
    }
    if (p === '/api/admin/ruling-file' && M === 'POST') { if ((d = deny('write'))) return d; return this.rulingFile(req, u, who) }
    if (p === '/api/admin/read' && M === 'POST') {
      const { client } = await jbody();
      if (!this.canSeeClient(me, client)) return json(403, { error: 'لا تملك صلاحية لهذا الموكل.' });
      const changed = []; this.msgs.forEach(m => { if (m.client === client && m.from === 'client' && !m.read) { m.read = true; changed.push(m) } });
      if (changed.length) { this.store.putMessages(changed); this.broadcast('read', { client }) }
      return json(200, { ok: true, n: changed.length });
    }
    if (p === '/api/admin/reset' && M === 'POST') {
      if ((d = deny('manage'))) return d;
      this.state = EMPTY(); this.store.resetState(); this.store.saveState(null, this.state, me.username, stampS()); this.audit({ ...who, action: 'state.reset' });
      return json(200, { ok: true });
    }
    return json(404, { error: 'not found' });
  }

  /* ── الملفات (R2): كل مكتب في مجلد خاص ── */
  async readBody(req, limit) {
    const n = +req.headers.get('content-length') || 0; if (n > limit) throw new Error('too large');
    const buf = Buffer.from(await req.arrayBuffer()); if (buf.length > limit) throw new Error('too large');
    return buf;
  }
  async media(req, file) {
    const key = this.slug() + '/' + file, ext = file.split('.').pop(), type = TYPES[ext] || 'application/octet-stream';
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
    if (range) {
      const head = await this.env.MEDIA.head(key); if (!head) return new Response('Not found', { status: 404, headers: CORS });
      const size = head.size, start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], size - 1) : size - 1;
      const obj = await this.env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } });
      return new Response(obj.body, { status: 206, headers: { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1), 'Cache-Control': 'private, no-store', ...CORS } });
    }
    const obj = await this.env.MEDIA.get(key); if (!obj) return new Response('Not found', { status: 404, headers: CORS });
    return new Response(obj.body, { headers: { 'Content-Type': type, 'Content-Length': String(obj.size), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, no-store', ...CORS, ...SEC } });
  }
  async voice(req, u, client, from, who) {
    if (!client) return json(400, { error: 'missing client' });
    const type = String(req.headers.get('content-type') || 'audio/webm').split(';')[0].trim().toLowerCase();
    const ext = AUDIO_EXT[type]; if (!ext) return json(415, { error: 'صيغة الصوت غير مدعومة: ' + type });
    let buf; try { buf = await this.readBody(req, 15 * 1024 * 1024) } catch (e) { return json(413, { error: 'الرسالة الصوتية أكبر من المسموح (15 ميغابايت).' }) }
    if (buf.length < 200) return json(400, { error: 'التسجيل قصير جداً.' });
    const id = rid(), file = `${id}.${ext}`; await this.env.MEDIA.put(this.slug() + '/' + file, buf, { httpMetadata: { contentType: type } });
    const dur = Math.max(1, Math.round(+u.searchParams.get('dur') || 0));
    const m = this.addMsg({ id, client, from, type: 'voice', file, dur, ch: 'البوابة', text: '', ...(from === 'lawyer' ? { by: who.username } : {}) });
    this.audit({ ...who, action: from === 'lawyer' ? 'message.send' : 'message.receive', entity: 'messages', entity_id: id, detail: { client, type: 'voice', dur, sha256: crypto.createHash('sha256').update(buf).digest('hex') } });
    return json(201, from === 'lawyer' ? this.pubAdmin(m) : this.pub(m));
  }
  async attach(req, u, client, from, who) {
    if (!client) return json(400, { error: 'missing client' });
    const name = String(u.searchParams.get('name') || 'مرفق').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
    const type = String(req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const dot = name.lastIndexOf('.');
    let ext = ((dot > 0 ? name.slice(dot + 1) : '') || FILE_EXT[type] || '').toLowerCase(); if (ext === 'jpeg') ext = 'jpg';
    if (!EXT_OK.has(ext)) return json(415, { error: 'نوع الملف غير مدعوم. المسموح: الصور وPDF وWord وExcel والنصوص.' });
    let buf; try { buf = await this.readBody(req, 25 * 1024 * 1024) } catch (e) { return json(413, { error: 'الملف أكبر من المسموح (25 ميغابايت).' }) }
    if (!buf.length) return json(400, { error: 'الملف فارغ.' });
    const id = rid(), file = `${id}.${ext}`; await this.env.MEDIA.put(this.slug() + '/' + file, buf, { httpMetadata: { contentType: TYPES[ext] || 'application/octet-stream' } });
    const isImg = ['jpg', 'png', 'webp', 'gif', 'heic'].includes(ext);
    const caption = String(u.searchParams.get('caption') || '').trim().slice(0, 500);
    const m = this.addMsg({ id, client, from, type: isImg ? 'image' : 'file', file, name, size: buf.length, ext, text: caption, ch: 'البوابة', ...(from === 'lawyer' ? { by: who.username } : {}) });
    this.audit({ ...who, action: from === 'lawyer' ? 'message.send' : 'message.receive', entity: 'messages', entity_id: id, detail: { client, type: m.type, name, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') } });
    return json(201, from === 'lawyer' ? this.pubAdmin(m) : this.pub(m));
  }

  // نص حكم قضائي لمكتبة الاجتهادات: ملف فقط دون رسالة لأي موكل
  async rulingFile(req, u, who) {
    const name = String(u.searchParams.get('name') || 'حكم').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
    const type = String(req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const dot = name.lastIndexOf('.');
    let ext = ((dot > 0 ? name.slice(dot + 1) : '') || FILE_EXT[type] || '').toLowerCase(); if (ext === 'jpeg') ext = 'jpg';
    if (!EXT_OK.has(ext)) return json(415, { error: 'نوع الملف غير مدعوم. المسموح: PDF وWord والصور والنصوص.' });
    let buf; try { buf = await this.readBody(req, 25 * 1024 * 1024) } catch (e) { return json(413, { error: 'الملف أكبر من المسموح (25 ميغابايت).' }) }
    if (!buf.length) return json(400, { error: 'الملف فارغ.' });
    const id = rid(), file = `${id}.${ext}`; await this.env.MEDIA.put(this.slug() + '/' + file, buf, { httpMetadata: { contentType: TYPES[ext] || 'application/octet-stream' } });
    this.audit({ ...who, action: 'ruling.file', entity: 'rulings', entity_id: id, detail: { name, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') } });
    return json(201, { file: '/api/media/' + file, name, size: buf.length, ext });
  }

  async backup() {
    const keyB64 = this.env.BACKUP_KEY;
    if (!keyB64) return { ok: false, skipped: 'BACKUP_KEY غير معرّف' };
    try {
      const S = this.store, slug = this.slug();
      const dump = { v: 1, slug, at: stampS(), records: S.all('SELECT * FROM records'), kv: S.all('SELECT * FROM kv').filter(k => !['setup'].includes(k.key)), messages: S.all('SELECT * FROM messages'), users: S.all('SELECT * FROM users'), audit: S.all('SELECT * FROM audit ORDER BY seq') };
      const plain = Buffer.from(JSON.stringify(dump));
      const key = crypto.createHash('sha256').update(String(keyB64)).digest(), iv = crypto.randomBytes(12);
      const c = crypto.createCipheriv('aes-256-gcm', key, iv), enc = Buffer.concat([c.update(plain), c.final()]), tag = c.getAuthTag();
      const body = Buffer.concat([Buffer.from('MQBK1'), iv, tag, enc]);
      const name = `_backups/${slug}/${new Date().toISOString().slice(0, 10)}.mqbk`;
      await this.env.MEDIA.put(name, body, { httpMetadata: { contentType: 'application/octet-stream' }, customMetadata: { sha256: crypto.createHash('sha256').update(plain).digest('hex'), records: String(dump.records.length) } });
      const list = await this.env.MEDIA.list({ prefix: `_backups/${slug}/` });
      const old = list.objects.map(o => o.key).sort(); let pruned = 0;
      while (old.length > BACKUP_KEEP) { await this.env.MEDIA.delete(old.shift()); pruned++ }
      const res = { ok: true, at: dump.at, key: name, bytes: body.length, records: dump.records.length, messages: dump.messages.length, pruned };
      S.kv.set('backup_last', res); this.audit({ action: 'system.backup', detail: { records: res.records, messages: res.messages, bytes: res.bytes } });
      return res;
    } catch (e) { this.audit({ action: 'system.backup_failed', detail: { error: String(e.message || e) } }); return { ok: false, error: String(e.message || e) } }
  }

  /* ── دليل المحامين (D1 مشتركة، للقراءة فقط من المكاتب) ── */
  async barMeta() { const r = await this.env.DB.prepare("SELECT value FROM meta WHERE key = 'bar_meta'").first(); return r ? JSON.parse(r.value) : null }
  async barSearch(s) {
    const DB = this.env.DB, w = [], a = [];
    for (const t of norm(s.get('q') || '').split(' ').filter(Boolean).slice(0, 6)) { const dg = digits(t); w.push('norm LIKE ?'); a.push('%' + (dg.length >= 4 && dg.length === t.length ? dg.replace(/^0/, '') : t) + '%') }
    if (s.get('city')) { w.push('city = ?'); a.push(s.get('city')) }
    if (s.get('status')) { w.push('status = ?'); a.push(s.get('status')) }
    if (s.get('phone')) w.push("phones <> '[]'");
    const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
    const limit = Math.min(200, Math.max(1, +s.get('limit') || 100)), offset = Math.max(0, +s.get('offset') || 0);
    if (!this.facets || Date.now() - this.facets.at > 3600e3) {
      const [c, st, wp] = await DB.batch([
        DB.prepare("SELECT city c, COUNT(*) n FROM bar_dir WHERE city <> '' GROUP BY city ORDER BY n DESC"),
        DB.prepare('SELECT status s, COUNT(*) n FROM bar_dir GROUP BY status ORDER BY n DESC'),
        DB.prepare("SELECT COUNT(*) n FROM bar_dir WHERE phones <> '[]'")]);
      this.facets = { at: Date.now(), v: { cities: c.results, statuses: st.results, withPhone: (wp.results[0] || {}).n || 0 } };
    }
    const [tot, rows] = await DB.batch([
      DB.prepare(`SELECT COUNT(*) n FROM bar_dir ${where}`).bind(...a),
      DB.prepare(`SELECT mno, name, status, city, office, address, phones, email FROM bar_dir ${where} ORDER BY (phones = '[]'), CAST(substr(mno, 2) AS INTEGER) LIMIT ? OFFSET ?`).bind(...a, limit, offset)]);
    return { total: tot.results[0].n, rows: rows.results.map(r => ({ ...r, phones: JSON.parse(r.phones || '[]') })), meta: await this.barMeta(), facets: this.facets.v, running: false, progress: null };
  }

  /* ── عمليات مزود الخدمة (تصل فقط عبر الـ Worker بعد التحقق من رمز العمليات) ── */
  async ops(req, u) {
    const sig = opsSig(this.env), got = req.headers.get('x-mq-ops') || '';
    if (!sig || got.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(sig))) return json(404, { error: 'not found' });
    const p = u.pathname, b = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const granted = () => { const g = this.store.kv.get('support_grant'); return !!(g && g.until > Date.now()) };
    if (p === '/_ops/init') {
      if (!this.store.kv.get('created')) {
        this.store.kv.set('created', stampS());
        this.store.kv.set('settings', { edition: b.edition === 'insurance' ? 'insurance' : 'office', officeName: String(b.name || '').slice(0, 120), lawyerName: String(b.lawyer || '').slice(0, 80), city: String(b.city || '').slice(0, 40), phone: '', hours: '' });
        if (!b.import) {  // مكتب جديد: بيانات فارغة. مكتب منقول: سجل التدقيق يبقى فارغاً حتى يُنقل سجله القديم كما هو
          this.state = EMPTY(); this.store.saveState(null, this.state, 'system', stampS());
          this.audit({ action: 'office.create', detail: { slug: this.slug(), name: b.name || '' } });
        }
      }
      return json(200, { ok: true, slug: this.slug(), created: this.store.kv.get('created') });
    }
    if (p === '/_ops/setup-link') {
      if (this.auth.hasUsers()) return json(409, { error: 'already has users' });
      const t = crypto.randomBytes(24).toString('base64url');
      this.store.kv.set('setup', { hash: crypto.createHash('sha256').update(t).digest('hex'), exp: Date.now() + 72 * 3600e3 });
      this.audit({ action: 'office.setup_link' });
      return json(200, { token: t, expires: '72h' });
    }
    if (p === '/_ops/info') {
      const g = q => this.store.get(q);
      this.audit({ username: 'ops', action: 'ops.info' });
      return json(200, { slug: this.slug(), created: this.store.kv.get('created'), settings: this.settings(), users: g('SELECT COUNT(*) n FROM users').n, records: g('SELECT COUNT(*) n FROM records').n, messages: g('SELECT COUNT(*) n FROM messages').n, audit: g('SELECT COUNT(*) n FROM audit').n, verify: this.store.auditVerify() });
    }
    /* نقل مكتب من جهاز المكتب: لمرة واحدة، فقط إذا كان المكتب فارغاً */
    if (p === '/_ops/import') {
      const S = this.store, g = q => S.get(q);
      if (g('SELECT COUNT(*) n FROM users').n || g('SELECT COUNT(*) n FROM records').n || g('SELECT COUNT(*) n FROM messages').n) return json(409, { error: 'office not empty' });
      const auditRows = b.audit || [];
      S.tx(() => {
        // نحذف قيود الإنشاء التلقائية قبل النقل؟ لا: سجل التدقيق لا يُحذف. لذلك يُنقل سجل المكتب القديم فقط إذا كان السجل هنا فارغاً.
        if (auditRows.length && g('SELECT COUNT(*) n FROM audit').n) throw new Error('audit not empty: create office with import:true');
        if (b.auditKey) S.kv.set('audit_key', b.auditKey);
        for (const r of b.records || []) S.run('INSERT INTO records(kind, id, data, updated_at, updated_by) VALUES(?, ?, ?, ?, ?)', r.kind, r.id, r.data, r.updated_at, r.updated_by);
        for (const k of b.kv || []) if (!['slug', 'created', 'audit_key', 'media_key', 'setup'].includes(k.key)) S.run('INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k.key, k.value);
        for (const m of b.messages || []) S.run('INSERT INTO messages(id, client, at, data) VALUES(?, ?, ?, ?)', m.id, m.client, m.at, m.data);
        for (const x of b.users || []) S.run('INSERT INTO users(id, username, name, role, salt, hash, active, failed, locked_until, must_change, cases, created_at, last_login) VALUES(?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)', x.id, x.username, x.name, x.role, x.salt, x.hash, x.active, x.must_change, x.cases, x.created_at, x.last_login);
        for (const a of auditRows) S.run('INSERT INTO audit(seq, at, user_id, username, action, entity, entity_id, detail, ip, prev, hash) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', a.seq, a.at, a.user_id, a.username, a.action, a.entity, a.entity_id, a.detail, a.ip, a.prev, a.hash);
      });
      this.state = S.loadState(); this.msgs = S.loadMessages();
      const v = S.auditVerify();
      this.audit({ action: 'office.import', detail: { records: (b.records || []).length, messages: (b.messages || []).length, users: (b.users || []).length, audit: auditRows.length, chainOk: v.ok } });
      return json(200, { ok: true, verify: v, files: this.msgs.filter(m => m.file).map(m => m.file) });
    }
    if (p === '/_ops/media' && req.method === 'PUT') {
      const file = u.searchParams.get('file') || '';
      if (!/^[a-f0-9]{12}\.[a-z0-9]{2,5}$/.test(file)) return json(400, { error: 'bad name' });
      /* لا استبدال صامت لملف موجود (سلامة الأدلة): الاستبدال فقط بإذن الدعم وطلب صريح، ويُسجّل */
      const exists = await this.env.MEDIA.head(this.slug() + '/' + file);
      if (exists && !(u.searchParams.get('replace') === '1' && granted())) return json(409, { error: 'الملف موجود؛ لا يُستبدل دون إذن المكتب' });
      await this.env.MEDIA.put(this.slug() + '/' + file, req.body, { httpMetadata: { contentType: TYPES[file.split('.').pop()] || 'application/octet-stream' } });
      this.audit({ username: 'ops', action: exists ? 'ops.media_replace' : 'ops.media_upload', detail: { file } });
      return json(200, { ok: true });
    }
    /* تصدير كامل لبيانات المكتب (نسخ احتياطي / مغادرة العميل) */
    /* تصدير بيانات المكتب لمزود الخدمة: فقط بإذن مؤقت من مدير المكتب، ودون أسرار (كلمات المرور ومفاتيح التدقيق والتوقيع)، ويُسجّل في سجل المكتب */
    if (p === '/_ops/export') {
      if (!granted()) { this.audit({ username: 'ops', action: 'ops.export_denied' }); return json(403, { error: 'لم يمنح المكتب إذن وصول للدعم الفني. يمنحه مدير المكتب من الإعدادات.' }) }
      const S = this.store, SECRET = ['setup', 'media_key', 'audit_key', 'support_grant'];
      this.audit({ username: 'ops', action: 'ops.export' });
      return json(200, { slug: this.slug(), at: stampS(), records: S.all('SELECT * FROM records'), kv: S.all('SELECT * FROM kv').filter(k => !SECRET.includes(k.key)), messages: S.all('SELECT * FROM messages'), users: S.all('SELECT id, username, name, role, active, must_change, cases, created_at, last_login FROM users'), audit: S.all('SELECT * FROM audit ORDER BY seq') });
    }
    /* نسخة احتياطية مشفّرة يومية إلى R2 (يستدعيها الـ Worker المجدول). المحتوى كامل لأنه للاستعادة، ومشفّر بمفتاح لا يملكه إلا الخادم */
    if (p === '/_ops/backup') return json(200, await this.backup());
    /* إعادة تعيين كلمة مرور مستخدم (بطلب مالك الخدمة): مكتب العرض التجريبي فقط، أو مكتب حقيقي منح مديره إذن الدعم الفني.
       في المكتب الحقيقي تُولَّد كلمة مؤقتة ويُلزم المستخدم بتغييرها عند أول دخول. تُلغى جلساته، ويُسجَّل الإجراء دون كلمة المرور */
    if (p === '/_ops/reset-password' && req.method === 'POST') {
      const demo = this.slug() === 'demo';
      if (!demo && !granted()) { this.audit({ username: 'ops', action: 'ops.password_reset_denied' }); return json(403, { error: 'لم يمنح المكتب إذن وصول للدعم الفني.' }) }
      const usr = this.store.get('SELECT id, username FROM users WHERE username = ?', String(b.username || ''));
      if (!usr) return json(404, { error: 'no such user' });
      const pw = demo && b.password ? String(b.password) : crypto.randomBytes(9).toString('base64url');
      try { this.auth.setPassword(usr.id, pw, !demo) } catch (e) { return json(400, { error: e.message }) }
      this.store.run('UPDATE users SET failed = 0, locked_until = 0 WHERE id = ?', usr.id);
      this.auth.logoutUser(usr.id);
      this.audit({ username: 'ops', action: 'ops.password_reset', entity: 'users', entity_id: usr.id, detail: { username: usr.username, mustChange: !demo } });
      return json(200, { ok: true, username: usr.username, mustChange: !demo, ...(demo && b.password ? {} : { temporary: pw }) });
    }
    return json(404, { error: 'unknown op' });
  }
}
