// نسخة مطابقة لـ office/lib/merge.js (وحدة ES للسحابة). أي تعديل هنا يُنقل هناك والعكس.
// دمج تعديلات شاشة المكتب مع البيانات المحفوظة بأمان (منطق خالص بلا قاعدة بيانات، مشترك بين خادم المكتب والسحابة)
// القواعد:
//  1) لا يُحذف أي سجل لأنه غاب عن الطلب. الحذف صريح فقط (deleted).
//  2) كل سجل يحمل رقم إصدار _v. تعديلٌ مبني على إصدار قديم يُرفض كتعارض، ويُعاد للمتصفح أحدث نسخة من الخادم.
//  3) رمز دخول بوابة الموكل يولّده الخادم: قوي (10 رموز من 32 ≈ 50 بت) وفريد، ولا يتغير إلا بعملية «تجديد» صريحة.

const COLL = ['clients', 'opponents', 'cases', 'hearings', 'deadlines', 'docs', 'rulings', 'lawforms'];
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بلا 0/O و1/I لتجنب الالتباس عند الكتابة اليدوية
const STRONG = /^MQ-[A-HJ-NP-Z2-9]{10}$/;
const isStrong = c => STRONG.test(String(c || ''));
const MAX_RECS = 5000;

function makeCode(randomBytes, taken) {
  for (;;) {
    const b = randomBytes(10); let s = 'MQ-';
    for (const x of b) s += ALPH[x & 31];
    if (!taken.has(s)) { taken.add(s); return s }
  }
}

/* الحقول التي تغيّرت بين نسختين (للتدقيق) */
function diffFields(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]), out = [];
  const short = v => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s == null ? '' : s.length > 80 ? s.slice(0, 77) + '…' : s };
  for (const k of keys) if (k !== '_v' && JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k])) out.push({ f: k, from: short((a || {})[k]), to: short((b || {})[k]) });
  return out.slice(0, 20);
}
const bare = r => { const { _v, ...x } = r || {}; return x };
const same = (a, b) => JSON.stringify(bare(a)) === JSON.stringify(bare(b));

/* يحوّل جسم الطلب إلى تغييرات: الصيغة الجديدة {changes, deleted} أو القديمة (الحالة كاملة) */
function normalize(body) {
  const b = body && typeof body === 'object' ? body : {};
  if (b.changes && typeof b.changes === 'object') return { changes: b.changes, deleted: b.deleted || {}, mzLog: Array.isArray(b.mzLog) ? b.mzLog : undefined, legacy: false };
  if (Array.isArray(b.clients) || Array.isArray(b.cases)) {
    const changes = {}; for (const k of COLL) if (Array.isArray(b[k])) changes[k] = b[k];
    return { changes, deleted: {}, mzLog: Array.isArray(b.mzLog) ? b.mzLog : undefined, legacy: true };
  }
  return null;
}

/**
 * prev: الحالة الحالية {clients:[],…} أو null. body: جسم الطلب. deps: { randomBytes, hashId(kind, rec) }
 * يعيد: { next, writes:[{op,kind,id,rec,fields}], conflicts:[{kind,id,rec}], versions:[[kind,id,_v]], codes:[[id,code]], legacy }
 */
function plan(prev, body, deps) {
  const n = normalize(body); if (!n) return null;
  const next = {}; for (const k of COLL) next[k] = ((prev && prev[k]) || []).slice();
  next.mzLog = n.mzLog !== undefined ? n.mzLog : ((prev && prev.mzLog) || []);
  const writes = [], conflicts = [], versions = [], codes = [];
  const taken = new Set(next.clients.map(c => String(c.code || '').toUpperCase()).filter(Boolean));
  let count = 0;

  for (const kind of COLL) {
    const list = Array.isArray(n.changes[kind]) ? n.changes[kind] : [];
    const idx = new Map(next[kind].map((x, i) => [String(x.id), i]));
    for (const raw of list) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      if (++count > MAX_RECS) break;
      const rec = { ...raw };
      if (rec.id == null || rec.id === '') rec.id = deps.hashId(kind, bare(rec));
      const id = String(rec.id), i = idx.get(id), old = i == null ? null : next[kind][i];
      if (!old) {
        const out = { ...bare(rec), _v: 1 };
        if (kind === 'clients') {
          const c = String(out.code || '').toUpperCase();
          if (!isStrong(c) || taken.has(c)) { out.code = makeCode(deps.randomBytes, taken); codes.push([id, out.code]) }
          else { out.code = c; taken.add(c) }
        }
        idx.set(id, next[kind].push(out) - 1);
        writes.push({ op: 'create', kind, id, rec: out }); versions.push([kind, id, 1]);
        continue;
      }
      const incoming = bare(rec);
      if (kind === 'clients' && 'code' in old) {           // الرمز لا يتغير من شاشة المكتب
        if (incoming.code !== old.code) codes.push([id, old.code]);
        incoming.code = old.code;
      }
      const ov = old._v || 0, iv = rec._v || 0;
      if (same(incoming, old)) { versions.push([kind, id, ov]); continue }
      if (iv !== ov) { conflicts.push({ kind, id, rec: old }); continue }
      const out = { ...incoming, _v: ov + 1 };
      next[kind][i] = out;
      writes.push({ op: 'update', kind, id, rec: out, fields: diffFields(old, out) }); versions.push([kind, id, out._v]);
    }
    for (const did of (n.deleted && n.deleted[kind]) || []) {
      const i = idx.get(String(did)); if (i == null) continue;
      const old = next[kind][i]; next[kind].splice(i, 1);
      idx.clear(); next[kind].forEach((x, j) => idx.set(String(x.id), j));
      writes.push({ op: 'delete', kind, id: String(did), rec: old });
    }
  }
  return { next, writes, conflicts, versions, codes, legacy: n.legacy };
}

/* تجديد رمز موكل (أو كل الرموز الضعيفة): يعيد السجلات المعدّلة */
function rotate(state, ids, deps) {
  const taken = new Set(state.clients.map(c => String(c.code || '').toUpperCase()).filter(Boolean)), out = [];
  for (const c of state.clients) if (ids === 'weak' ? !isStrong(c.code) : ids.includes(c.id)) {
    const before = c.code; c.code = makeCode(deps.randomBytes, taken); c._v = (c._v || 0) + 1; out.push({ rec: c, before });
  }
  return out;
}


/* اعتماد النماذج القانونية: «معتمد داخلياً» و«نموذج رسمي محقق» لا يمنحهما إلا مدير المكتب، وبشروطهما كاملة.
   يعيد رسالة خطأ إن خالف الطلب ذلك، وإلا null */
const APPROVED = ['internal', 'official'];
function lawformsGuard(prev, writes, canManage) {
  const old = new Map(((prev && prev.lawforms) || []).map(r => [String(r.id), r]));
  for (const w of writes) {
    if (w.kind !== 'lawforms' || w.op === 'delete') continue;
    const r = w.rec, o = old.get(String(w.id));
    if (!APPROVED.includes(r.status)) continue;
    const same = o && o.status === r.status && JSON.stringify([o.body, o.version, o.jur, o.approvedBy, o.barNo, o.official]) === JSON.stringify([r.body, r.version, r.jur, r.approvedBy, r.barNo, r.official]);
    if (same) continue;
    if (!canManage) return 'اعتماد النماذج القانونية من صلاحية مدير المكتب فقط.';
    if (!r.version || !Array.isArray(r.jur) || !r.jur.length) return 'الاعتماد يتطلب رقم الإصدار ونطاق الاختصاص.';
    if (r.status === 'internal' && (!r.approvedBy || !r.barNo)) return 'الاعتماد الداخلي يتطلب اسم المحامي المعتمِد ورقم مزاولته.';
    if (r.status === 'official' && (r.kind !== 'A' || !r.official || !r.official.file || !r.official.src || !r.official.retrieved)) return '«نموذج رسمي محقق» يتطلب نسخة الجهة الأصلية ومصدرها وتاريخ الحصول عليها.';
  }
  return null;
}

export { COLL, lawformsGuard, plan, rotate, isStrong, makeCode, diffFields, normalize, STRONG };
