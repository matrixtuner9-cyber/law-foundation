// دليل المحامين: يُحمَّل من ملف المحامين المضمّن في البرنامج (bar/directory.json) ويُبحث فيه محلياً دون أي موقع خارجي.
// يستطيع مدير المكتب تحديثه باستيراد ملف Excel أحدث. (قراءة الموقع العام للنقابة بقيت أداة احتياطية لنسخة «ميثاق متصل» فقط)
const fs = require('fs'), path = require('path'), { spawn } = require('child_process'), XLSX = require('./xlsx');

/* توحيد الكتابة العربية للبحث: الهمزات، التاء المربوطة، الألف المقصورة، التشكيل */
const norm = s => String(s || '').normalize('NFKC').replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').toLowerCase().replace(/\s+/g, ' ').trim();
const digits = s => String(s || '').replace(/\D/g, '');

function create({ store, DATA, ROOT, audit, broadcast, stampS }) {
  const db = store.raw;
  db.exec(`CREATE TABLE IF NOT EXISTS bar_dir(mno TEXT PRIMARY KEY, name TEXT, status TEXT, city TEXT, office TEXT, address TEXT, phones TEXT, email TEXT, page INTEGER, norm TEXT);
           CREATE INDEX IF NOT EXISTS bar_city ON bar_dir(city); CREATE INDEX IF NOT EXISTS bar_status ON bar_dir(status);`);
  const FILE = path.join(DATA, 'bar', 'lawyers.json');
  let run = null, progress = null, facets = null;

  const SEED = path.join(ROOT, 'bar', 'directory.json');
  function importData(d, meta) {
    const ins = db.prepare('INSERT OR REPLACE INTO bar_dir(mno, name, status, city, office, address, phones, email, page, norm) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const pick = (info, re, not) => { const k = Object.keys(info || {}).find(k => re.test(k) && !(not && not.test(k))); return k ? info[k] : '' };
    store.tx(() => {
      db.exec('DELETE FROM bar_dir');
      for (const l of d.lawyers || []) {
        const city = pick(l.info, /مدين/), office = pick(l.info, /اسم|مكتب/, /عنوان/), address = pick(l.info, /عنوان/);
        const phones = (l.phones || []).map(p => String(p).replace(/[^\d+]/g, '')).filter(Boolean);
        ins.run(String(l.mno), l.name, l.status || '', city, office, address, JSON.stringify(phones), l.email || '', l.page || null,
          [norm(l.name), /^L\d+$/.test(l.mno) ? '' : norm(l.mno), phones.map(digits).join(' '), norm(office), norm(l.email), norm(city), norm(l.status)].join(' | '));
      }
      store.kv.set('bar_meta', { fetchedAt: d.fetchedAt, source: d.source, total: (d.lawyers || []).length, pages: d.pages, ...meta });
    });
    facets = null;
    return (d.lawyers || []).length;
  }
  const importFile = () => importData(JSON.parse(fs.readFileSync(FILE, 'utf8')), { kind: 'crawl' });
  /* ملف المحامين المضمّن: يُحمَّل عند أول تشغيل، ويحل محل أي نسخة مقروءة من الموقع، ولا يمس ملفاً استورده المكتب بنفسه */
  function loadSeed() {
    if (!fs.existsSync(SEED)) return 0;
    const meta = store.kv.get('bar_meta', null), d = JSON.parse(fs.readFileSync(SEED, 'utf8'));
    if (meta && (meta.kind === 'upload' || (meta.kind === 'bundled' && meta.version === d.version))) return 0;
    const n = importData(d, { kind: 'bundled', version: d.version });
    audit({ action: 'bar.result', detail: { ok: true, records: n, via: 'bundled', version: d.version } });
    return n;
  }
  try { loadSeed() } catch (e) { console.error('[bar seed]', e.message) }
  /* استيراد ملف Excel من مدير المكتب */
  function importUpload(buf, who, name) {
    const lawyers = XLSX.lawyersFromRows(XLSX.readSheet(buf));
    if (lawyers.length < 10) throw new Error('الملف يحتوي ' + lawyers.length + ' أسماء فقط؛ تأكد أنه ملف المحامين الصحيح.');
    const n = importData({ lawyers, source: 'ملف Excel مستورد: ' + String(name || '').slice(0, 80), fetchedAt: new Date().toISOString() }, { kind: 'upload', by: who && who.username });
    audit({ ...who, action: 'bar.import', detail: { records: n, file: String(name || '').slice(0, 120) } });
    return n;
  }
  // تشغيل قديم: إن وُجد ملف مقروء سابقاً من الموقع ولا يوجد ملف مضمّن
  try { if (!fs.existsSync(SEED) && fs.existsSync(FILE) && !db.prepare('SELECT COUNT(*) n FROM bar_dir').get().n) { const n = importFile(); audit({ action: 'bar.result', detail: { ok: true, records: n, via: 'startup' } }) } } catch (e) { console.error('[bar]', e.message) }

  function getFacets() {
    if (!facets) facets = {
      cities: db.prepare("SELECT city c, COUNT(*) n FROM bar_dir WHERE city <> '' GROUP BY city ORDER BY n DESC").all(),
      statuses: db.prepare("SELECT status s, COUNT(*) n FROM bar_dir GROUP BY status ORDER BY n DESC").all(),
      withPhone: db.prepare("SELECT COUNT(*) n FROM bar_dir WHERE phones <> '[]'").get().n,
    };
    return facets;
  }

  function search({ q = '', city = '', status = '', phone = '', offset = 0, limit = 100 }) {
    const w = [], a = [];
    for (const t of norm(q).split(' ').filter(Boolean).slice(0, 6)) { const dg = digits(t); w.push('norm LIKE ?'); a.push('%' + (dg.length >= 4 && dg.length === t.length ? dg.replace(/^0/, '') : t) + '%') }
    if (city) { w.push('city = ?'); a.push(city) }
    if (status) { w.push('status = ?'); a.push(status) }
    if (phone) w.push("phones <> '[]'");
    const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) n FROM bar_dir ${where}`).get(...a).n;
    const rows = db.prepare(`SELECT mno, name, status, city, office, address, phones, email FROM bar_dir ${where} ORDER BY (phones = '[]'), CASE WHEN mno LIKE 'L%' THEN mno ELSE '' END, CAST(substr(mno, 2) AS INTEGER) LIMIT ? OFFSET ?`)
      .all(...a, Math.min(200, Math.max(1, +limit || 100)), Math.max(0, +offset || 0)).map(r => ({ ...r, phones: JSON.parse(r.phones || '[]') }));
    return { total, rows, meta: store.kv.get('bar_meta', null), facets: getFacets(), running: !!run, progress, canImport: true };
  }

  function refresh(who) {
    if (run) return false;
    const args = [path.join(ROOT, 'bar', 'crawler.js'), DATA];
    run = spawn(process.execPath, args, { cwd: ROOT, windowsHide: true, env: { ...process.env, ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}) } });
    progress = { stage: 'start', page: 0, pages: 0, total: 0, at: stampS() };
    audit({ ...who, action: 'bar.refresh', detail: { stage: 'start' } });
    let buf = '';
    run.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1);
      try { const o = JSON.parse(line); progress = { ...progress, ...o }; broadcast('bar', progress);
        if (o.done) { if (o.ok) { const n = importFile(); progress.imported = n; audit({ ...who, action: 'bar.result', detail: { ok: true, records: n, pages: o.pages } }) } else audit({ ...who, action: 'bar.result', detail: { ok: false, error: o.error } }) }
      } catch (e) {} } });
    run.stderr.on('data', d => console.error('[bar]', String(d).trim().slice(0, 300)));
    run.on('exit', () => { run = null; broadcast('bar', { ...progress, running: false }) });
    return true;
  }

  return { search, refresh, importUpload, status: () => ({ running: !!run, progress, meta: store.kv.get('bar_meta', null), canImport: true }) };
}
module.exports = { create, norm };
