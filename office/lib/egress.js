// قاطع الاتصال الخارجي لـ«ميثاق خاص»: يمنع داخل عملية الخادم كل اتصال بشبكة غير الجهاز نفسه (loopback)،
// قبل أي استعلام DNS، ويشمل fetch وhttp/https وtls والمقابس المباشرة وUDP. كل محاولة تُرفض وتُسجَّل.
// طبقة ثانية لا تعتمد على هذا الكود: قاعدة جدار حماية ويندوز التي يضيفها مثبّت النسخة الخاصة.
'use strict';
const net = require('net'), dns = require('dns'), dgram = require('dgram');
const MSG = 'النسخة الخاصة من ميثاق لا تتصل بالإنترنت.';

function isLoopback(host) {
  const h = String(host ?? '').trim().replace(/^\[|\]$/g, '').toLowerCase();
  if (!h || h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '::1' || h === '0:0:0:0:0:0:0:1') return true;
  if (/^::ffff:127\./.test(h)) return true;
  return net.isIPv4(h) && h.startsWith('127.');
}
const blocked = (what, target, onBlock) => { try { onBlock && onBlock({ what, target: String(target).slice(0, 200) }) } catch (e) {} return Object.assign(new Error(MSG), { code: 'MQ_OFFLINE' }) };

let installed = null;
function install({ onBlock } = {}) {
  if (installed) return installed;
  const orig = { connect: net.Socket.prototype.connect, fetch: globalThis.fetch, lookup: dns.lookup, plookup: dns.promises.lookup, send: dgram.Socket.prototype.send };

  /* كل اتصال TCP/TLS في Node (http وhttps وtls وundici/fetch) يمر من Socket.connect */
  net.Socket.prototype.connect = function (...args) {
    let o = args[0];
    if (Array.isArray(o)) o = o[0];                        // الصيغة الداخلية [options, cb]
    const opts = o && typeof o === 'object' ? o : { port: o, host: typeof args[1] === 'string' ? args[1] : undefined };
    if (opts.path) return orig.connect.apply(this, args);  // أنابيب داخلية (IPC) محلية
    const host = opts.host ?? opts.hostname ?? 'localhost';
    if (!isLoopback(host)) { const err = blocked('tcp', `${host}:${opts.port}`, onBlock); process.nextTick(() => this.destroy(err)); return this }
    return orig.connect.apply(this, args);
  };
  /* fetch: رفض فوري بعنوان واضح قبل أي محاولة */
  if (orig.fetch) globalThis.fetch = async function (input, init) {
    let url; try { url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url) } catch (e) { return orig.fetch(input, init) }
    if (!isLoopback(url.hostname)) throw blocked('fetch', url.origin + url.pathname, onBlock);
    return orig.fetch(input, init);
  };
  /* DNS: لا استعلام عن أسماء خارجية (لا تسرّب حتى لاسم الموقع) */
  dns.lookup = function (host, ...rest) {
    if (isLoopback(host)) return orig.lookup.call(dns, host, ...rest);
    const cb = rest.find(x => typeof x === 'function'); const err = blocked('dns', host, onBlock);
    if (cb) process.nextTick(cb, Object.assign(err, { code: 'ENOTFOUND' })); return {};
  };
  dns.promises.lookup = async function (host, ...rest) { if (isLoopback(host)) return orig.plookup.call(dns.promises, host, ...rest); throw blocked('dns', host, onBlock) };
  /* UDP */
  dgram.Socket.prototype.send = function (...args) {
    const host = args.find((a, i) => i > 0 && typeof a === 'string');
    if (host && !isLoopback(host)) { const cb = args.find(a => typeof a === 'function'); const err = blocked('udp', host, onBlock); if (cb) process.nextTick(cb, err); return }
    return orig.send.apply(this, args);
  };
  installed = { isLoopback, restore() { net.Socket.prototype.connect = orig.connect; globalThis.fetch = orig.fetch; dns.lookup = orig.lookup; dns.promises.lookup = orig.plookup; dgram.Socket.prototype.send = orig.send; installed = null } };
  return installed;
}
module.exports = { install, isLoopback, MSG };
