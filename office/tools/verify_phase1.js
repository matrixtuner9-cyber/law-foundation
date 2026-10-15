const fs = require('fs');
process.removeAllListeners('warning');
const { DatabaseSync } = require('node:sqlite');
const out = [];
(async () => {
  const L = 'http://localhost:8080', P = 'https://mithaq.palgaz.net';
  const st = await (await fetch(L + '/api/auth/status')).json(); out.push('status ' + JSON.stringify({ setup: st.setup, local: st.local }));
  for (const [n, u] of [['admin page (no login)', L + '/'], ['bootstrap (no login)', L + '/api/admin/bootstrap'], ['server.js', L + '/server.js'], ['db file', L + '/data/mithaq.db'], ['login page', L + '/login.html'], ['tunnel admin', P + '/'], ['tunnel login page', P + '/login.html'], ['tunnel portal', P + '/portal/']]) {
    const r = await fetch(u, { redirect: 'manual' }); out.push(n + ' -> ' + r.status + (r.headers.get('location') ? ' ' + r.headers.get('location') : ''));
  }
  const lg = await fetch(P + '/api/portal/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'MQ-2051' }) });
  out.push('tunnel portal login -> ' + lg.status);
  const ms = await (await fetch(P + '/api/portal/messages?peek=1', { headers: { 'x-client': 'MQ-2051' } })).json();
  out.push('MQ-2051 messages via tunnel: ' + ms.length + ', last: ' + (ms.length ? ms[ms.length - 1].at + ' ' + ms[ms.length - 1].text : ''));
  const db = new DatabaseSync('D:\\Mithaq\\data\\mithaq.db', { readOnly: true });
  out.push('records: ' + JSON.stringify(db.prepare('SELECT kind, COUNT(*) n FROM records GROUP BY kind').all().map(r => r.kind + '=' + r.n).join(' ')));
  out.push('messages: ' + db.prepare('SELECT COUNT(*) n FROM messages').get().n + ', users: ' + db.prepare('SELECT COUNT(*) n FROM users').get().n);
  out.push('audit: ' + JSON.stringify(db.prepare('SELECT seq, action, detail FROM audit ORDER BY seq').all()));
  const old = JSON.parse(fs.readFileSync('D:\\Mithaq\\data\\messages.json.migrated-backup', 'utf8')); out.push('old messages.json count: ' + old.length);
  const olds = JSON.parse(fs.readFileSync('D:\\Mithaq\\data\\state.json.migrated-backup', 'utf8')); out.push('old state: ' + ['clients', 'opponents', 'cases', 'hearings', 'deadlines', 'docs'].map(k => k + '=' + (olds[k] || []).length).join(' '));
})().catch(e => out.push('ERR ' + e.message)).finally(() => fs.writeFileSync('D:\\Mithaq\\tools\\verify_phase1.txt', out.join('\n')));
