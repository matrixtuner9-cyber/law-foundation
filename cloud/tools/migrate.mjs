// نقل مكتب من جهاز المكتب (mithaq.db) إلى المِسْبار السحابي على Cloudflare.
// الاستخدام (على جهاز المكتب، Node 22.5+):
//   node migrate.mjs --data D:\Mithaq\data --slug mithaq --api https://<worker> --token <OPS_TOKEN> [--bar]
// ينقل: السجلات، الإعدادات، الرسائل، المستخدمين بكلمات مرورهم، سجل التدقيق مع مفتاحه (فتبقى السلسلة سليمة)، الملفات، ودليل المحامين (--bar).
// لا يحذف ولا يعدّل شيئاً على جهاز المكتب.
import fs from 'node:fs'; import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true) : d };
const DATA = arg('data'), SLUG = arg('slug'), API = String(arg('api', '')).replace(/\/$/, ''), TOKEN = arg('token') || process.env.OPS_TOKEN || (fs.existsSync(new URL('../.ops_token', import.meta.url)) ? fs.readFileSync(new URL('../.ops_token', import.meta.url), 'utf8').trim() : '');
if (!DATA || !SLUG || !API || !TOKEN) { console.error('usage: node migrate.mjs --data <dir> --slug <office> --api <url> --token <OPS_TOKEN> [--bar] [--bar-only]'); process.exit(2) }
const H = { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' };
// طلبات HTTPS عبر DNS الخاص بـ Cloudflare مباشرة (لا تتأثر بتأخر DNS في الراوتر)
import https from 'node:https'; import http from 'node:http'; import dns from 'node:dns';
const RES = new dns.Resolver(); RES.setServers(['1.1.1.1', '1.0.0.1']);
const lookup = (host, opts, cb) => RES.resolve4(host, (e, a) => e ? dns.lookup(host, opts, cb) : (opts && opts.all ? cb(null, a.map(x => ({ address: x, family: 4 }))) : cb(null, a[0], 4)));
const call = (method, p, body, raw) => new Promise((ok, bad) => {
  const u = new URL(API + p), data = body == null ? null : raw ? body : Buffer.from(JSON.stringify(body));
  const lib = u.protocol === 'https:' ? https : http;
  const r = lib.request({ host: u.hostname, port: u.port || undefined, path: u.pathname + u.search, method, ...(u.protocol === 'https:' ? { lookup } : {}),
    headers: { authorization: H.authorization, 'content-type': raw ? 'application/octet-stream' : 'application/json', ...(data ? { 'content-length': data.length } : {}) } }, s => {
    const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => {
      const t = Buffer.concat(ch).toString(); let j; try { j = JSON.parse(t) } catch (e) { j = { raw: t.slice(0, 300) } }
      if (s.statusCode >= 300) bad(new Error(`${method} ${p} → ${s.statusCode} ${JSON.stringify(j).slice(0, 300)}`)); else ok(j);
    });
  }); r.on('error', bad); if (data) r.write(data); r.end();
});
const log = (...a) => console.log('•', ...a);

async function bar() {
  const f = path.join(DATA, 'bar', 'lawyers.json'); if (!fs.existsSync(f)) { log('لا يوجد ملف دليل المحامين، تخطٍّ'); return }
  const d = JSON.parse(fs.readFileSync(f, 'utf8')), L = d.lawyers || [], N = 400;
  for (let i = 0; i < L.length; i += N) {
    const r = await call('POST', '/_ops/bar/import', { reset: i === 0, lawyers: L.slice(i, i + N), meta: i + N >= L.length ? { fetchedAt: d.fetchedAt, source: d.source, total: L.length, pages: d.pages } : null });
    process.stdout.write(`\r  دليل المحامين: ${r.total} / ${L.length}`);
  }
  console.log();
}

if (arg('bar-only')) { await bar(); process.exit(0) }

const db = new DatabaseSync(path.join(DATA, 'mithaq.db'), { readOnly: true });
const all = q => db.prepare(q).all();
const tables = new Set(all("SELECT name FROM sqlite_master WHERE type = 'table'").map(r => r.name));
const payload = {
  records: all('SELECT kind, id, data, updated_at, updated_by FROM records'),
  kv: all('SELECT key, value FROM kv'),
  messages: all('SELECT id, client, at, data FROM messages'),
  users: all('SELECT id, username, name, role, salt, hash, active, must_change, cases, created_at, last_login FROM users'),
  audit: tables.has('audit') ? all('SELECT seq, at, user_id, username, action, entity, entity_id, detail, ip, prev, hash FROM audit ORDER BY seq') : [],
  auditKey: fs.existsSync(path.join(DATA, 'audit.key')) ? fs.readFileSync(path.join(DATA, 'audit.key')).toString('hex') : null,
};
const settings = JSON.parse((payload.kv.find(k => k.key === 'settings') || { value: '{}' }).value);
log(`المصدر: ${payload.records.length} سجلاً، ${payload.messages.length} رسالة، ${payload.users.length} مستخدم، ${payload.audit.length} قيد تدقيق`);

const list = await call('GET', '/_ops/offices');
if (!list.some(o => o.slug === SLUG)) { await call('POST', '/_ops/offices', { slug: SLUG, name: settings.officeName || SLUG, lawyer: settings.lawyerName, city: settings.city, import: true }); log('أُنشئ المكتب', SLUG) }
else log('المكتب موجود مسبقاً', SLUG);

const info0 = await call('GET', `/_ops/offices/${SLUG}/info`);
let files;
if (!info0.records && !info0.messages && !info0.users) {
  const r = await call('POST', `/_ops/offices/${SLUG}/import`, payload);
  log('نُقلت البيانات. سلسلة التدقيق بعد النقل:', r.verify.ok ? `سليمة (${r.verify.n} قيد)` : 'مكسورة!', JSON.stringify(r.verify));
  files = r.files;
} else { log('المكتب يحتوي بيانات مسبقاً، لن تُنقل البيانات مرة ثانية (تُستكمل الملفات فقط)'); files = payload.messages.map(m => JSON.parse(m.data).file).filter(Boolean) }

let n = 0, miss = 0;
for (const f of files) {
  const p = path.join(DATA, 'media', f);
  if (!fs.existsSync(p)) { miss++; continue }
  await call('PUT', `/_ops/offices/${SLUG}/media?file=${encodeURIComponent(f)}`, fs.readFileSync(p), true); n++;
  process.stdout.write(`\r  الملفات: ${n} / ${files.length}`);
}
console.log(); log(`الملفات: نُقل ${n}${miss ? `، مفقود على الجهاز ${miss}` : ''}`);
if (arg('bar')) await bar();

const info = await call('GET', `/_ops/offices/${SLUG}/info`);
const okc = info.records === payload.records.length && info.messages === payload.messages.length && info.users === payload.users.length;
log('التحقق:', JSON.stringify({ records: info.records, messages: info.messages, users: info.users, audit: info.audit, chain: info.verify }));
console.log(okc && info.verify.ok ? '\n✔ اكتمل النقل وتطابقت الأعداد وسلسلة التدقيق سليمة.' : '\n✘ يوجد اختلاف، راجع الأرقام أعلاه.');
process.exit(okc && info.verify.ok ? 0 : 1);
