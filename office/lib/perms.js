// صلاحيات مستخدمي المكتب: أدوار جاهزة (مدير، محامٍ، سكرتارية، مدخل بيانات، محاسب، طباعة فقط…)
// وصلاحيات مفصّلة يمكن تعديلها لكل مستخدم. تُفرض في الخادم (الحفظ والرفع والتحليل والمراسلة)،
// وتُخفي الواجهة ما لا يحق للمستخدم (الأتعاب، الطباعة، أزرار التعديل).
'use strict';

/* الصلاحيات المفصّلة، بالترتيب الذي تظهر به في شاشة المستخدمين */
const PERMS = {
  view_all:     { label: 'الاطلاع على كل القضايا والموكلين', hint: 'دونها يرى القضايا المسندة إليه فقط' },
  clients:      { label: 'إضافة وتعديل الموكلين والخصوم' },
  cases:        { label: 'إضافة وتعديل القضايا والجلسات والمهل' },
  docs:         { label: 'رفع المستندات والملفات والأحكام' },
  delete:       { label: 'حذف السجلات' },
  finance_view: { label: 'الاطلاع على الأتعاب والدفعات والمصاريف' },
  finance:      { label: 'تسجيل الأتعاب والدفعات والمصاريف' },
  print:        { label: 'الطباعة والتصدير' },
  messages:     { label: 'مراسلة الموكلين' },
  ai:           { label: 'عقل المسبار: التحليل والصياغة والاستخراج' },
  library:      { label: 'تعديل النماذج والمراجع القانونية' },
  manage:       { label: 'إدارة المستخدمين والإعدادات' },
};
const ALL = Object.keys(PERMS);

const ROLES = {
  admin:      { label: 'مدير النظام', perms: ALL },
  lawyer:     { label: 'محامٍ', perms: ALL.filter(p => p !== 'manage') },
  secretary:  { label: 'سكرتارية', perms: ['view_all', 'clients', 'cases', 'docs', 'messages', 'print'] },
  data_entry: { label: 'مدخل بيانات', perms: ['view_all', 'clients', 'cases', 'docs'] },
  accountant: { label: 'محاسب', perms: ['view_all', 'finance_view', 'finance', 'print'] },
  print_only: { label: 'طباعة فقط', perms: ['view_all', 'print'] },
  external:   { label: 'محامٍ خارجي', perms: ['print'] },
  viewer:     { label: 'مطّلع', perms: ['view_all'] },
};

/* صلاحيات المستخدم: المخصّصة له إن وُجدت، وإلا صلاحيات دوره. المدير له كل شيء دائماً */
function permsOf(u) {
  if (!u) return [];
  if (u.role === 'admin') return ALL.slice();
  const own = Array.isArray(u.perms) ? u.perms : null;
  const base = own || ((ROLES[u.role] || {}).perms || []);
  const set = new Set(base.filter(p => PERMS[p]));
  if (set.has('finance')) set.add('finance_view');
  return ALL.filter(p => set.has(p));
}
/* الكلمات القديمة في الشيفرة: all / write / manage */
const WRITE = ['clients', 'cases', 'docs', 'finance', 'library'];
function can(u, what) {
  const ps = permsOf(u);
  if (what === 'all') return ps.includes('view_all');
  if (what === 'write') return WRITE.some(p => ps.includes(p));
  return ps.includes(what);
}
/* تنظيف قائمة مرسلة من الواجهة: null = حسب الدور */
function clean(list, role) {
  if (!Array.isArray(list)) return null;
  const s = ALL.filter(p => list.includes(p));
  const def = (ROLES[role] || {}).perms || [];
  return s.length === def.length && s.every(p => def.includes(p)) ? null : s;
}

/* ── الأتعاب والمال داخل السجلات ── */
const FIN = { cases: ['fee', 'paid', 'feeNote', 'feeType', 'feeCurrency'], clients: ['payments', 'expenses', 'fee', 'feeNote'] };
const isFinField = (kind, f) => (FIN[kind] || []).includes(f) || /^(fee|paid)/.test(f) && kind in FIN;
const hasVal = v => v != null && v !== '' && v !== 0 && !(Array.isArray(v) && !v.length);
function stripFin(kind, rec) {
  if (!rec || !FIN[kind]) return rec;
  const x = { ...rec }; for (const k of Object.keys(x)) if (isFinField(kind, k)) delete x[k]; return x;
}
/* الحالة كما يراها المستخدم: بلا الأتعاب لمن لا يحق له */
function viewState(u, S) {
  if (!S || can(u, 'finance_view')) return S;
  const out = { ...S }; for (const k of Object.keys(FIN)) if (Array.isArray(S[k])) out[k] = S[k].map(r => stripFin(k, r));
  return out;
}
/* قبل الدمج: من لا يرى الأتعاب لا يرسلها، فتُعاد من السجل المحفوظ حتى لا تُمسح */
function restoreFin(u, prev, body) {
  if (can(u, 'finance_view') || !body || !body.changes || !prev) return body;
  const changes = { ...body.changes };
  for (const kind of Object.keys(FIN)) {
    if (!Array.isArray(changes[kind])) continue;
    const old = new Map((prev[kind] || []).map(r => [String(r.id), r]));
    changes[kind] = changes[kind].map(r => { const o = r && old.get(String(r.id)); if (!o) return stripFin(kind, r); const x = stripFin(kind, r); for (const k of Object.keys(o)) if (isFinField(kind, k)) x[k] = o[k]; return x });
  }
  return { ...body, changes };
}

/* ما تحتاجه كل كتابة: يعيد رسالة الرفض أو null */
const KIND_PERM = { clients: 'clients', opponents: 'clients', cases: 'cases', hearings: 'cases', deadlines: 'cases', docs: 'docs', rulings: 'docs', lawforms: 'library', legalRefs: 'library' };
const KIND_AR = { clients: 'الموكلين', opponents: 'الخصوم', cases: 'القضايا', hearings: 'الجلسات', deadlines: 'المهل', docs: 'المستندات', rulings: 'الأحكام', lawforms: 'النماذج', legalRefs: 'المراجع' };
const changedKeys = (a, b) => [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].filter(k => k !== '_v' && JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k]));
function guardWrites(u, writes, prev) {
  const ps = new Set(permsOf(u));
  for (const w0 of writes) {
    const o = prev && w0.op === 'update' ? (prev[w0.kind] || []).find(r => String(r.id) === String(w0.id)) : null;
    const w = o ? { ...w0, fields: changedKeys(o, w0.rec).map(f => ({ f })) } : w0;
    const need = KIND_PERM[w.kind]; if (!need) continue;
    if (w.op === 'delete') { if (!ps.has('delete')) return 'لا تملك صلاحية الحذف.'; if (!ps.has(need)) return 'لا تملك صلاحية تعديل ' + KIND_AR[w.kind] + '.'; continue }
    const fin = FIN[w.kind] ? (w.op === 'create' ? Object.keys(w.rec || {}).filter(k => isFinField(w.kind, k) && hasVal(w.rec[k])) : (w.fields || []).map(f => f.f).filter(f => isFinField(w.kind, f))) : [];
    const other = w.op === 'create' ? true : (w.fields || []).some(f => !isFinField(w.kind, f.f));
    if (fin.length && !ps.has('finance')) return 'لا تملك صلاحية تسجيل الأتعاب والدفعات.';
    if (other && !ps.has(need)) {
      // المحاسب يسجّل دفعة لموكل موجود دون صلاحية تعديل بياناته: مسموح ما دام التغيير مالياً فقط
      return 'لا تملك صلاحية ' + (w.op === 'create' ? 'إضافة ' : 'تعديل ') + KIND_AR[w.kind] + '.';
    }
  }
  return null;
}

module.exports = { PERMS, ROLES, ALL, permsOf, can, clean, FIN, isFinField, stripFin, viewState, restoreFin, guardWrites };
