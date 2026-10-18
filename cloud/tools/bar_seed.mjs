// تحميل ملف المحامين المضمّن (office/bar/directory.json) إلى الدليل المركزي في السحابة. الرمز السري يُقرأ من .ops_token ولا يُطبع.
// node tools/bar_seed.mjs [مسار directory.json]
import fs from 'node:fs'; import https from 'node:https'; import dns from 'node:dns'; import path from 'node:path';
const API = new URL(process.env.MQ_API || 'https://test.palgaz.net'), TOKEN = process.env.OPS_TOKEN || fs.readFileSync(new URL('../.ops_token', import.meta.url), 'utf8').trim();
const F = process.argv[2] || path.join(process.env.MQ_SRC || '../office', 'bar', 'directory.json');
const R = new dns.Resolver(); R.setServers(['1.1.1.1', '1.0.0.1']);
const lookup = (host, opts, cb) => R.resolve4(host, (e, a) => e ? dns.lookup(host, opts, cb) : (opts && opts.all ? cb(null, a.map(x => ({ address: x, family: 4 }))) : cb(null, a[0], 4)));
const call = (p, b) => new Promise((ok, bad) => { const data = Buffer.from(JSON.stringify(b));
  const r = https.request({ host: API.hostname, path: p, method: 'POST', lookup, headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json', 'content-length': data.length } }, s => {
    const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { const t = Buffer.concat(ch).toString(); let j; try { j = JSON.parse(t) } catch (e) { j = { raw: t.slice(0, 200) } } s.statusCode >= 300 ? bad(new Error(s.statusCode + ' ' + JSON.stringify(j).slice(0, 200))) : ok(j) }) });
  r.on('error', bad); r.write(data); r.end() });
const d = JSON.parse(fs.readFileSync(F, 'utf8')), L = d.lawyers || [], N = 400;
for (let i = 0; i < L.length; i += N) {
  const r = await call('/_ops/bar/import', { reset: i === 0, lawyers: L.slice(i, i + N), meta: i + N >= L.length ? { fetchedAt: d.fetchedAt, source: d.source, total: L.length, kind: 'bundled', version: d.version } : null });
  process.stdout.write(`\r  دليل المحامين: ${r.total} / ${L.length}`);
}
console.log('\nDONE');
