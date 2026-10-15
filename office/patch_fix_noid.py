import io, sys
R = 'D:\\Mithaq\\'
def edit(f, a, b):
    p = R + f; s = io.open(p, encoding='utf-8').read()
    if b in s: return
    if s.count(a) != 1: print('ANCHOR', f); sys.exit(1)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(a, b, 1))

edit('lib\\db.js', """          const after = new Map((next[kind] || []).filter(x => x && x.id != null).map(x => [String(x.id), x]));""",
"""          const list = (next[kind] || []).filter(x => x && typeof x === 'object');
          const seen = new Set(list.filter(x => x.id != null).map(x => String(x.id)));
          for (const x of list) if (x.id == null) { // سجلات بلا معرّف (مثل المهل): معرّف ثابت من محتواها
            let id = 'a' + crypto.createHash('sha1').update(kind + JSON.stringify(x)).digest('hex').slice(0, 10), n = 1;
            while (seen.has(id)) id = id.replace(/-\\d+$/, '') + '-' + (++n);
            x.id = id; seen.add(id);
          }
          const after = new Map(list.map(x => [String(x.id), x]));""")

edit('server.js', "let state = store.loadState();", """/* إصلاح لمرة واحدة: سجلات بلا معرّف (المهل) لم تُنقل في الإصدار الأول من النقل */
(function repairNoId() {
  if (store.kv.get('repair_noid_v1')) return;
  const bak = readJSON(STATE_F + '.migrated-backup', null), cur0 = store.loadState();
  if (bak && cur0) {
    const next = JSON.parse(JSON.stringify(cur0)); let added = 0;
    for (const k of Store.COLL) {
      const have = new Set((next[k] || []).map(x => JSON.stringify({ ...x, id: undefined })));
      for (const x of bak[k] || []) if (x.id == null && !have.has(JSON.stringify({ ...x, id: undefined }))) { (next[k] = next[k] || []).push({ ...x }); added++ }
    }
    if (added) { store.saveState(cur0, next, 'system', stampS()); audit({ action: 'system.repair', detail: { records: added, note: 'سجلات بلا معرّف (المهل)' } }) }
  }
  store.kv.set('repair_noid_v1', true);
})();
let state = store.loadState();""")

edit('admin.js', "'system.migrate':'نقل البيانات إلى قاعدة البيانات'};", "'system.migrate':'نقل البيانات إلى قاعدة البيانات','system.repair':'إصلاح بيانات منقولة'};")
print('FIXED')
