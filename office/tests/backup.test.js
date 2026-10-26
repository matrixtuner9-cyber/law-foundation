// النسخ الاحتياطي: الحفظ خارج الجهاز، والاستعادة الآمنة، والتذكير الدوري
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-bk-'));
const DATA = path.join(TMP, 'data'), ROOT = path.join(TMP, 'backups'), USB = path.join(TMP, 'usb');
process.env.MQ_BACKUP_DIR = ROOT; delete process.env.MQ_BACKUP_MIRROR;
const Store = require('../lib/db'), Backup = require('../lib/backup');
const stampS = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
let store = Store.open(DATA), bk;
const events = [];
const mk = () => Backup.create({ store, DATA, audit: e => events.push(e), stampS, log: { error() {}, log() {} } });
const wait = ms => new Promise(r => setTimeout(r, ms));

test('نسخة يدوية تُحسب في التذكير، وقائمة النسخ تظهرها', () => {
  store.raw.prepare("INSERT INTO records(kind,id,data) VALUES('clients','c1','{\"name\":\"أحمد\"}')").run();
  fs.mkdirSync(path.join(DATA, 'media'), { recursive: true }); fs.writeFileSync(path.join(DATA, 'media', 'a.pdf'), 'PDF1');
  bk = mk();
  const r0 = bk.remind(); assert.equal(r0.due, false, 'أول تشغيل: لا تذكير فوراً'); assert.equal(r0.hours, 48);
  const r = bk.run('manual:admin'); assert.ok(r.ok, r.error);
  const l = bk.list(); assert.equal(l.length, 1); assert.match(l[0].id, /^auto_/); assert.equal(l[0].integrity, 'ok');
  assert.ok(bk.remind().lastUser);
});

test('التذكير يحين بعد 48 ساعة، والتأجيل يعيد العدّ', () => {
  const now = Date.now();
  assert.equal(bk.remind(now + 47 * 3600e3).due, false);
  assert.equal(bk.remind(now + 49 * 3600e3).due, true);
  bk.snooze(); assert.equal(bk.remind(Date.now() + 47 * 3600e3).due, false);
  const c = bk.setCfg({ remindHours: 24 }); assert.ok(c.ok); assert.equal(bk.remind(Date.now() + 25 * 3600e3).due, true);
  assert.equal(bk.setCfg({ remindHours: 2 }).ok, false);
  bk.setCfg({ remindHours: 48 });
});

test('الحفظ على قرص خارجي: نسخة متحقق منها مع المرفقات', () => {
  assert.equal(bk.exportTo('relative/dir').ok, false);
  assert.equal(bk.exportTo(path.join(TMP, 'لا-يوجد')).ok, false, 'قرص غير موصول');
  fs.mkdirSync(USB);
  const r = bk.exportTo(USB, 'admin'); assert.ok(r.ok, r.error);
  assert.ok(fs.existsSync(path.join(r.dir, 'mithaq.db')));
  assert.ok(fs.existsSync(path.join(USB, 'Misbar-Backups', 'media', 'a.pdf')));
  assert.equal(bk.status().lastExternal.how, 'export');
  assert.ok(events.some(e => e.action === 'system.backup_export'));
});

test('مجلد النسخة الثانية يُضبط من الإعدادات ويُستعمل في النسخ التالية', async () => {
  const M = path.join(TMP, 'mirror'); assert.equal(bk.setCfg({ mirror: M }).ok, false, 'غير موجود');
  fs.mkdirSync(M); assert.ok(bk.setCfg({ mirror: M }).ok);
  await wait(1100);
  const r = bk.run('schedule'); assert.ok(r.ok && r.mirror && r.mirror.ok, JSON.stringify(r.mirror));
  assert.equal(bk.status().lastExternal.how, 'mirror');
  bk.setCfg({ mirror: '' });
});

test('الاستعادة: ترفض نسخة تالفة، وتأخذ نسخة من الوضع الحالي، وتطبَّق عند إعادة التشغيل', async () => {
  assert.equal(bk.restore('../../etc').ok, false);
  const id = bk.list().at(-1).id; // أقدم نسخة: عميل واحد
  // تغيير بعد النسخة
  store.raw.prepare("INSERT INTO records(kind,id,data) VALUES('clients','c2','{\"name\":\"لاحق\"}')").run();
  fs.writeFileSync(path.join(DATA, 'media', 'b.pdf'), 'PDF2');
  // نسخة تالفة تُرفض
  const bad = bk.list()[0].id; const bf = path.join(ROOT, bad, 'mithaq.db'); const orig = fs.readFileSync(bf);
  fs.appendFileSync(bf, 'x'); assert.match(bk.restore(bad).error, /بصمة/); fs.writeFileSync(bf, orig);
  await wait(1100);
  const r = bk.restore(id, 'admin'); assert.ok(r.ok, r.error); assert.equal(r.restart, true);
  assert.ok(fs.existsSync(path.join(DATA, 'restore.pending.json')));
  assert.ok(bk.list().some(x => x.id === r.pre), 'نسخة ما قبل الاستعادة محفوظة');
  // «إعادة التشغيل»: إغلاق القاعدة ثم تطبيق الاستعادة قبل فتحها
  store.raw.close();
  fs.rmSync(path.join(DATA, 'media', 'a.pdf'));
  const done = Backup.applyPending(DATA, { log() {}, error() {} });
  assert.ok(done.ok, done.error);
  assert.ok(!fs.existsSync(path.join(DATA, 'restore.pending.json')));
  store = Store.open(DATA);
  const ids = store.raw.prepare("SELECT id FROM records WHERE kind='clients' ORDER BY id").all().map(x => x.id);
  assert.deepEqual(ids, ['c1'], 'عادت البيانات إلى حالة النسخة');
  assert.ok(fs.existsSync(path.join(DATA, 'media', 'a.pdf')), 'المرفق المفقود عاد');
  assert.ok(fs.existsSync(path.join(DATA, 'media', 'b.pdf')), 'المرفقات الأحدث لا تُحذف');
  // ويمكن التراجع بنسخة «ما قبل الاستعادة»
  bk = mk(); const back = bk.restore(r.pre, 'admin'); assert.ok(back.ok, back.error);
  store.raw.close(); assert.ok(Backup.applyPending(DATA, { log() {}, error() {} }).ok);
  store = Store.open(DATA);
  assert.equal(store.raw.prepare("SELECT COUNT(*) n FROM records WHERE kind='clients'").get().n, 2);
});

test.after(() => { try { store.raw.close() } catch (e) {} fs.rmSync(TMP, { recursive: true, force: true }) });
