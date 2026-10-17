// أداة مزود الخدمة: إدارة المكاتب على ميثاق السحابي. الرمز السري يُقرأ من ملف .ops_token (لا يُطبع).
// node tools/ops.mjs list | create <slug> "<اسم المكتب>" ["<اسم المحامي>"] | setup <slug> | info <slug> | suspend <slug> | activate <slug> | reset-password <slug> <user> [password]
// يستخدم DNS الخاص بـ Cloudflare (1.1.1.1) مباشرة كي لا يتأثر بتأخر تحديث DNS في الراوتر.
import fs from 'node:fs'; import https from 'node:https'; import dns from 'node:dns';
const API = new URL(process.env.MQ_API || 'https://test.palgaz.net'), TOKEN = fs.readFileSync(new URL('../.ops_token', import.meta.url), 'utf8').trim();
const R = new dns.Resolver(); R.setServers(['1.1.1.1', '1.0.0.1']);
const lookup = (host, opts, cb) => R.resolve4(host, (e, a) => e ? dns.lookup(host, opts, cb) : (opts && opts.all ? cb(null, a.map(x => ({ address: x, family: 4 }))) : cb(null, a[0], 4)));
const call = (m, p, b) => new Promise((ok, bad) => {
  const data = b ? Buffer.from(JSON.stringify(b)) : null;
  const r = https.request({ host: API.hostname, path: p, method: m, lookup, headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json', ...(data ? { 'content-length': data.length } : {}) } }, s => {
    const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { const t = Buffer.concat(ch).toString(); try { ok({ status: s.statusCode, ...JSON.parse(t) }) } catch (e) { ok({ status: s.statusCode, raw: t.slice(0, 200) }) } });
  }); r.on('error', bad); if (data) r.write(data); r.end();
});
const [cmd, slug, name, lawyer] = process.argv.slice(2);
const out = x => console.log(JSON.stringify(x, null, 1));
if (cmd === 'list') out(await call('GET', '/_ops/offices'));
else if (cmd === 'create') out(await call('POST', '/_ops/offices', { slug, name, lawyer }));
else if (cmd === 'setup') out(await call('POST', `/_ops/offices/${slug}/setup-link`));
else if (cmd === 'info') out(await call('GET', `/_ops/offices/${slug}/info`));
else if (cmd === 'suspend' || cmd === 'activate') out(await call('POST', `/_ops/offices/${slug}/status`, { status: cmd === 'suspend' ? 'suspended' : 'active' }));
// إعادة تعيين كلمة مرور: للعرض التجريبي بكلمة محددة، ولمكتب حقيقي بكلمة مؤقتة (يلزمه إذن الدعم من مدير المكتب)
else if (cmd === 'reset-password') out(await call('POST', `/_ops/offices/${slug}/reset-password`, { username: name, ...(lawyer ? { password: lawyer } : {}) }));
else console.log('usage: list | create <slug> "<name>" ["<lawyer>"] | setup <slug> | info <slug> | suspend|activate <slug> | reset-password <slug> <user> [password]');
