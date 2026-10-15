import io, sys, json
R = 'D:\\Mithaq\\'
def edit(f, pairs):
    p = R + f; s = io.open(p, encoding='utf-8').read()
    for a, b in pairs:
        if b in s: continue
        if s.count(a) != 1: print('ANCHOR', f, a[:70]); sys.exit(1)
        s = s.replace(a, b, 1)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

edit('app.js', [
 ("const tabs=[['hearings','الجلسات'],['docs','المستندات']", "const tabs=[['track','مسار التقاضي'],['hearings','الجلسات'],['docs','المستندات']"),
 ("function caseTab(k){\n", "function caseTab(k){\n if(S.caseTab==='track'&&window.trackTab)return trackTab(k);\n"),
 ("""<div class="toolbar"><span class="pill ${statusPill(k.status)}">${esc(k.status)}</span>""", """<div class="toolbar">${window.caseBadges?caseBadges(k):''}<span class="pill ${statusPill(k.status)}">${esc(k.status)}</span>"""),
 ("""<div class="toolbar"><div class="chips">${fs.map(f=>`<button class="chip ${S.cf===f?'on':''}" data-act="cf" data-v="${f}">${f}</button>`).join('')}</div>""", """<div class="toolbar"><div class="chips">${fs.map(f=>`<button class="chip ${S.cf===f?'on':''}" data-act="cf" data-v="${f}">${f}</button>`).join('')}</div>${window.catFilter?catFilter():''}"""),
 ("<th>المحكمة</th><th>المرحلة</th><th>الجلسة القادمة</th></tr></thead><tbody id=\"ctb\">", "<th>المحكمة</th><th>الدرجة والمرحلة</th><th>الجلسة القادمة</th></tr></thead><tbody id=\"ctb\">"),
 ("const list=cases.filter(k=>(S.cf==='الكل'||k.status===S.cf)&&", "const list=cases.filter(k=>(S.cf==='الكل'||k.status===S.cf)&&(!S.cat||!window.catOf||catOf(k).k===S.cat)&&"),
 ("""<td><span class="pill ${statusPill(k.status)}">${esc(k.stage)}</span></td>""", """<td>${window.levelPill?levelPill(k):''}<span class="pill ${statusPill(k.status)}">${esc(k.stage)}</span></td>"""),
 ("""<td><span class="mono" style="font-weight:500">${k.no}</span><div class="m">${esc(k.type)}</div></td>""", """<td><span class="mono" style="font-weight:500">${k.no}</span><div class="m">${window.catOf?esc(catOf(k).n):esc(k.type)}</div></td>"""),
 ("const TODAY=new Date(2026,9,12);", "const TODAY=(d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()))(new Date());"),
])

edit('server.js', [
 ("const settings = () => ({ edition: 'office', officeName: OFFICE.name, ...store.kv.get('settings', {}) });", """const settings = () => ({ edition: 'office', officeName: OFFICE.name, ...store.kv.get('settings', {}) });

/* مدد الطعن: جدول قابل للتعديل من مدير النظام. القيم الافتراضية متحقق منها من أحكام منشورة إلا ما عُلّم verified:false */
const DEFAULT_RULES = [
  { id: 'civ-appeal', name: 'استئناف حكم حقوقي', nature: 'civil', to: 'استئناف', from: ['صلح', 'بداية'], urgent: false, days: 30, start: 'judgment', ref: 'م205/1 وم193 من قانون أصول المحاكمات المدنية والتجارية رقم 2 لسنة 2001', verified: true },
  { id: 'civ-appeal-urgent', name: 'استئناف في المواد المستعجلة', nature: 'civil', to: 'استئناف', from: ['صلح', 'بداية'], urgent: true, days: 15, start: 'judgment', ref: 'م205/2 من قانون أصول المحاكمات المدنية والتجارية', verified: true },
  { id: 'civ-cassation', name: 'نقض حكم حقوقي', nature: 'civil', to: 'نقض', from: ['استئناف'], urgent: false, days: 40, start: 'judgment', ref: 'م227 وم193/1 من قانون أصول المحاكمات المدنية والتجارية', verified: true },
  { id: 'crim-appeal', name: 'استئناف حكم جزائي', nature: 'criminal', to: 'استئناف', from: ['صلح', 'بداية'], urgent: false, days: 15, start: 'judgment', ref: 'م328 من قانون الإجراءات الجزائية رقم 3 لسنة 2001 المعدلة بالقرار بقانون 17 لسنة 2014', verified: true },
  { id: 'crim-cassation', name: 'نقض حكم جزائي', nature: 'criminal', to: 'نقض', from: ['استئناف'], urgent: false, days: 40, start: 'judgment', ref: 'قانون الإجراءات الجزائية رقم 3 لسنة 2001 (يحتاج تأكيد المادة والمدة)', verified: false },
];
const rules = () => { const saved = store.kv.get('appeal_rules', {}); return DEFAULT_RULES.map(r => ({ ...r, ...(saved[r.id] || {}) })) };"""),
 ("""  /* المستخدمون (مدير النظام فقط) */""", """  /* مدد الطعن */
  if (p === '/api/rules' && M === 'GET') return json(res, 200, rules());
  if (p === '/api/rules' && M === 'POST') {
    if (!need('manage')) return;
    const b = await jbody(req), before = rules(), saved = store.kv.get('appeal_rules', {}), changes = [];
    for (const r of Array.isArray(b) ? b : []) {
      const d = DEFAULT_RULES.find(x => x.id === r.id); if (!d) continue;
      const days = Math.round(+r.days); if (!(days >= 1 && days <= 365)) return json(res, 400, { error: 'المدة يجب أن تكون بين 1 و365 يوماً.' });
      const next = { days, verified: !!r.verified, ref: String(r.ref || d.ref).slice(0, 200) }, old = before.find(x => x.id === r.id);
      const f = Store.diffFields({ days: old.days, verified: old.verified, ref: old.ref }, next);
      if (f.length) { saved[r.id] = next; changes.push({ id: r.id, name: d.name, fields: f }) }
    }
    store.kv.set('appeal_rules', saved);
    changes.forEach(c => audit({ ...who, action: 'rules.update', entity: 'rules', entity_id: c.id, detail: { label: c.name, fields: c.fields } }));
    return json(res, 200, rules());
  }

  /* المستخدمون (مدير النظام فقط) */"""),
 ("'admin.js', 'style.css',", "'admin.js', 'phase2.js', 'phase2.css', 'style.css',"),
])

edit('admin.js', [
 ("'system.repair':'إصلاح بيانات منقولة'};", "'system.repair':'إصلاح بيانات منقولة','rules.update':'تعديل مدد الطعن'};"),
 ("const ENT={clients:'موكل',", "const ENT={rules:'مدة طعن',clients:'موكل',"),
 ("const FLD={subject:'الموضوع',", "const FLD={days:'المدة بالأيام',verified:'مؤكَّدة',ref:'السند',cat:'التصنيف',refs:'المراجع',track:'مسار التقاضي',decisions:'الأحكام والقرارات',subject:'الموضوع',"),
])

edit('index.html', [
 ('<link rel="stylesheet" href="prestige.css">', '<link rel="stylesheet" href="phase2.css">\n<link rel="stylesheet" href="prestige.css">'),
 ('<script src="admin.js"></script>', '<script src="admin.js"></script>\n<script src="phase2.js"></script>'),
])

p = R + 'package.json'; pk = json.loads(io.open(p, encoding='utf-8').read()); files = pk['build']['files']
for x in ['phase2.js', 'phase2.css']:
    if x not in files: files.insert(files.index('package.json'), x)
io.open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(pk, ensure_ascii=False, indent=2) + '\n')
print('PATCHED')
