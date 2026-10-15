import io, sys, json
R = 'D:\\Mithaq\\'
def edit(f, pairs):
    p = R + f; s = io.open(p, encoding='utf-8').read()
    for a, b in pairs:
        if b in s: continue
        if s.count(a) != 1: print('ANCHOR', f, a[:70]); sys.exit(1)
        s = s.replace(a, b, 1)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

edit('server.js', [
 ("const isLocal = req =>", """const bar = require('./lib/bar').create({ store, DATA, ROOT, audit: e => audit(e), broadcast: (t, p) => broadcast(t, p), stampS });
const isLocal = req =>"""),
 ("""  /* مدد الطعن */""", """  /* دليل محامي النقابة (نسخة من الصفحة العامة) */
  if (p === '/api/bar' && M === 'GET') { const s = u.searchParams; return json(res, 200, bar.search({ q: s.get('q') || '', city: s.get('city') || '', status: s.get('status') || '', phone: s.get('phone') || '', offset: s.get('offset'), limit: s.get('limit') })) }
  if (p === '/api/bar/status') return json(res, 200, bar.status());
  if (p === '/api/bar/refresh' && M === 'POST') {
    if (!need('manage')) return;
    if (!isLocal(req)) return json(res, 403, { error: 'التحديث متاح من جهاز المكتب فقط.' });
    if (!bar.refresh(who)) return json(res, 409, { error: 'التحديث قيد التنفيذ.' });
    return json(res, 202, bar.status());
  }

  /* مدد الطعن */"""),
 ("'admin.js', 'phase2.js', 'phase2.css',", "'admin.js', 'phase2.js', 'phase2.css', 'bar.js', 'bar.css',"),
])
edit('admin.js', [
 ("'rules.update':'تعديل مدد الطعن'};", "'rules.update':'تعديل مدد الطعن','bar.refresh':'تحديث دليل المحامين','bar.result':'نتيجة تحديث دليل المحامين'};"),
 ("['settings.','الإعدادات'],", "['settings.','الإعدادات'],['bar.','دليل المحامين'],"),
])
edit('index.html', [
 ('<link rel="stylesheet" href="prestige.css">', '<link rel="stylesheet" href="bar.css">\n<link rel="stylesheet" href="prestige.css">'),
 ('<script src="phase2.js"></script>', '<script src="phase2.js"></script>\n<script src="bar.js"></script>'),
])
p = R + 'package.json'; pk = json.loads(io.open(p, encoding='utf-8').read()); files = pk['build']['files']
for x in ['bar/**', 'bar.js', 'bar.css']:
    if x not in files: files.insert(files.index('package.json'), x)
io.open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(pk, ensure_ascii=False, indent=2) + '\n')
print('PATCHED')
