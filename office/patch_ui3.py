import io, sys, json
R = 'D:\\Mithaq\\'
def edit(f, pairs):
    p = R + f; s = io.open(p, encoding='utf-8').read()
    for a, b in pairs:
        if b in s: continue
        if s.count(a) != 1: print('ANCHOR', f, a[:70]); sys.exit(1)
        s = s.replace(a, b, 1)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
def append(f, text, marker):
    p = R + f; s = io.open(p, encoding='utf-8').read()
    if marker not in s: io.open(p, 'w', encoding='utf-8', newline='\n').write(s + text)

edit('index.html', [
 ('<link rel="stylesheet" href="prestige.css">', '<link rel="stylesheet" href="prestige.css">\n<link rel="stylesheet" href="responsive.css">'),
 ('<script src="bar.js"></script>', '<script src="bar.js"></script>\n<script src="responsive.js"></script>'),
])
edit('server.js', [
 ("'bar.js', 'bar.css',", "'bar.js', 'bar.css', 'responsive.js', 'responsive.css',"),
 ("const settings = () => ({ edition: 'office', officeName: OFFICE.name, ...store.kv.get('settings', {}) });",
  "const settings = () => ({ edition: 'office', officeName: OFFICE.name, lawyerName: OFFICE.lawyer, city: OFFICE.city, phone: OFFICE.phone, hours: OFFICE.hours, ...store.kv.get('settings', {}) });\n/* بيانات المكتب كما تظهر للموكلين: من الإعدادات */\nconst officeInfo = () => { const s = settings(); return { name: s.officeName, lawyer: s.lawyerName, city: s.city, phone: s.phone, hours: s.hours } };"),
 ("pushTo(msg.client, { title: msg.type === 'notice' ? 'إشعار من ' + OFFICE.name : 'رسالة من ' + OFFICE.lawyer,",
  "pushTo(msg.client, { title: msg.type === 'notice' ? 'إشعار من ' + officeInfo().name : 'رسالة من ' + officeInfo().lawyer,"),
 ("whatsapp: cl.whatsapp || '' }, office: OFFICE, steps: SEED.STEPS, cases, docs };",
  "whatsapp: cl.whatsapp || '' }, office: officeInfo(), steps: SEED.STEPS, cases, docs };"),
 ("if (p === '/api/auth/status') return json(res, 200, { setup: !auth.hasUsers(), local: isLocal(req), office: settings().officeName });",
  "if (p === '/api/auth/status') return json(res, 200, { setup: !auth.hasUsers(), local: isLocal(req), office: settings().officeName, lawyer: settings().lawyerName });"),
 ("    const next = { edition: ['office', 'insurance'].includes(b.edition) ? b.edition : before.edition, officeName: String(b.officeName || before.officeName).trim().slice(0, 120) };",
  "    const t = (v, d, n) => String(v == null ? d : v).trim().slice(0, n) || d;\n    const next = { edition: ['office', 'insurance'].includes(b.edition) ? b.edition : before.edition, officeName: t(b.officeName, before.officeName, 120), lawyerName: t(b.lawyerName, before.lawyerName, 80), city: t(b.city, before.city, 40), phone: t(b.phone, before.phone, 30), hours: t(b.hours, before.hours, 80) };"),
])
edit('admin.js', [
 ("if(d.fields&&d.fields.length)bits.push(d.fields.map(f=>`<span class=\"chg\"><i>${esc(FLD[f.f]||f.f)}</i> ${f.from!==''?`<del>${esc(f.from)}</del> ← `:''}<ins>${esc(f.to===''?'(فارغ)':f.to)}</ins></span>`).join(''));",
  "const obj=v=>/^[\\[{]/.test(v||'');\n if(d.fields&&d.fields.length)bits.push(d.fields.map(f=>obj(f.from)||obj(f.to)?`<span class=\"chg\"><i>${esc(FLD[f.f]||f.f)}</i> <ins>${f.from===''?'أُضيف':'عُدّل'}</ins></span>`:`<span class=\"chg\"><i>${esc(FLD[f.f]||f.f)}</i> ${f.from!==''?`<del>${esc(f.from)}</del> ← `:''}<ins>${esc(f.to===''?'(فارغ)':f.to)}</ins></span>`).join(''));"),
 ("window.MQ_applyUser=function(u,st){\n MQ.user=u;MQ.settings=st||{};MQ.readOnly=!can('write');",
  "window.MQ_applyUser=function(u,st){\n MQ.user=u;MQ.settings=st||{};MQ.readOnly=!can('write');\n if(st)Object.assign(OFFICE,{name:st.officeName||OFFICE.name,lawyer:st.lawyerName||OFFICE.lawyer,city:st.city||OFFICE.city});"),
 ("const sub=document.querySelector('.brand small');if(sub)sub.textContent=st&&st.edition==='insurance'?'الإدارة القانونية':'مكتب المحاماة · نابلس';",
  "const sub=document.querySelector('.brand small');if(sub)sub.textContent=(st&&st.edition==='insurance'?'الإدارة القانونية':'مكتب المحاماة')+' · '+OFFICE.city;"),
 (""" <section class="panel"><header><h2>بيانات الجهة</h2></header><div class="bd"><div class="form"><label class="wide">الاسم الرسمي<input class="field" id="setName" value="${esc(st.officeName||'')}"></label></div></div></section>""",
  """ <section class="panel"><header><h2>بيانات المكتب والمحامي</h2><span class="m">تظهر في رسائل البوابة وإشعارات الموكلين وتطبيقهم، وفي النماذج وشاشة الدخول</span></header><div class="bd"><div class="form">
  <label class="wide">اسم المحامي كما يظهر للموكلين<input class="field" id="setLawyer" required value="${esc(st.lawyerName||'')}" placeholder="المحامي سامر عبد الله"></label>
  <label class="wide">الاسم الرسمي للمكتب أو الجهة<input class="field" id="setName" required value="${esc(st.officeName||'')}"></label>
  <label>المدينة<input class="field" id="setCity" value="${esc(st.city||'')}"></label><label>هاتف المكتب<input class="field mono" id="setPhone" dir="ltr" value="${esc(st.phone||'')}"></label>
  <label class="wide">ساعات الدوام<input class="field" id="setHours" value="${esc(st.hours||'')}" placeholder="الأحد – الخميس · 8:30 – 16:00"></label>
  <div class="wide preview-msg"><small>معاينة إشعار يصل للموكل:</small><b>رسالة من ${esc(st.lawyerName||'')}</b><span>${esc(st.officeName||'')}</span></div></div></div></section>"""),
 ("  api('/api/settings',{edition:ed,officeName:f.setName.value})",
  "  api('/api/settings',{edition:ed,officeName:f.setName.value,lawyerName:f.setLawyer.value,city:f.setCity.value,phone:f.setPhone.value,hours:f.setHours.value})"),
 ("FLD={days:'المدة بالأيام',", "FLD={lawyerName:'اسم المحامي',city:'المدينة',hours:'ساعات الدوام',days:'المدة بالأيام',"),
])
append('admin.css', "\n.preview-msg{display:flex;flex-direction:column;gap:2px;background:var(--sunk);border-radius:12px;padding:10px 14px;border-inline-start:4px solid var(--gold,#C9A24B)}\n.preview-msg small{color:var(--muted)}\n", '.preview-msg{')
edit('dash.js', [("<h1>${greet()}، أستاذ سامر</h1>", "<h1>${greet()}، ${esc(window.MQ&&MQ.user?'أستاذ '+MQ.user.name.replace(/^(المحامي|المحامية|الأستاذ|الأستاذة)\\s+/,'').split(' ')[0]:'أستاذ')}</h1>")])
edit('login.html', [
 ('<label>اسم المستخدم<input id="lu" name="username" autocomplete="username" required dir="ltr" autofocus></label>', '<label>اسم المستخدم<span class="nf"><input id="lu" name="username" autocomplete="username" required dir="ltr" autofocus></span></label>'),
 ('<span class="pw"><input id="lp"', '<span class="pw nf"><input id="lp"'),
 ('<label>الاسم الكامل<input id="sn" required placeholder="المحامي سامر عبد الله"></label>', '<label>الاسم الكامل<span class="nf"><input id="sn" required placeholder="المحامي سامر عبد الله"></span></label>'),
 ('<label>اسم المستخدم<input id="su" required dir="ltr" placeholder="samer" autocomplete="username"></label>', '<label>اسم المستخدم<span class="nf"><input id="su" required dir="ltr" placeholder="samer" autocomplete="username"></span></label>'),
 ('<label>كلمة المرور<input id="sp" type="password" required dir="ltr" autocomplete="new-password" placeholder="8 أحرف على الأقل، حروف وأرقام"></label>', '<label>كلمة المرور<span class="nf"><input id="sp" type="password" required dir="ltr" autocomplete="new-password" placeholder="8 أحرف على الأقل، حروف وأرقام"></span></label>'),
 ('<label>تأكيد كلمة المرور<input id="sp2" type="password" required dir="ltr" autocomplete="new-password"></label>', '<label>تأكيد كلمة المرور<span class="nf"><input id="sp2" type="password" required dir="ltr" autocomplete="new-password"></span></label>'),
 ('<span>العدالة تبدأ من ملف منظّم</span>', '<span id="sceneLawyer">العدالة تبدأ من ملف منظّم</span>'),
 ('<p class="sub" id="office">نظام ميثاق لإدارة القضايا</p>', '<p class="sub"><b id="lawyer"></b><span id="office">نظام ميثاق لإدارة القضايا</span></p>'),
 ('<div class="card">', '<div class="card neon-card">'),
])
edit('login.js', [("    if (s.office) $('office').textContent = s.office;", "    if (s.office) $('office').textContent = s.office;\n    if (s.lawyer) { $('lawyer').textContent = s.lawyer; $('sceneLawyer').textContent = s.lawyer + ' · ' + (s.office || '') }")])
edit('scales.js', [
 ("function size() { dpr = Math.min(2, devicePixelRatio || 1);", "function size() { dpr = Math.min(3, Math.max(1, devicePixelRatio || 1)); /* حتى 3× لشاشات 4K */"),
 ("    function frame(now) {\n      const t = still ? .1 : ((now - t0) / 26000) % 1;\n      bg(t); columns(t); particles(t);\n      const S = Math.min(w * .62, h * .42, 300); scales(t, w / 2, h * (opts.scalesY || .4), S);\n      vignette();",
  """    /* أشعة ضوء ذهبية تنزل من الأعلى */
    function rays(t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * .16 + Math.sin(t * Math.PI * 2 + i) * .03, len = h * 1.1, x0 = w / 2 + mx * 18, y0 = -h * .08;
        const g = ctx.createLinearGradient(x0, y0, x0 + Math.cos(-a) * len, y0 + Math.sin(-a) * len);
        const al = .045 + .03 * Math.sin(t * Math.PI * 6 + i * 1.7);
        g.addColorStop(0, `rgba(246,227,166,${al})`); g.addColorStop(1, 'rgba(246,227,166,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(-a - .05) * len, y0 + Math.sin(-a - .05) * len); ctx.lineTo(x0 + Math.cos(-a + .05) * len, y0 + Math.sin(-a + .05) * len); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    let mx = 0, my = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2 }, { passive: true });
    function frame(now) {
      const t = still ? .1 : ((now - t0) / 26000) % 1;
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      bg(t); rays(t);
      ctx.save(); ctx.translate(-mx * 10, -my * 6); columns(t); ctx.restore();
      particles(t);
      const S = Math.min(w * .62, h * .42, 340); ctx.save(); ctx.translate(mx * 8, my * 5); scales(t, w / 2, h * (opts.scalesY || .4), S); ctx.restore();
      vignette();"""),
])
p = R + 'package.json'; pk = json.loads(io.open(p, encoding='utf-8').read()); files = pk['build']['files']
for x in ['responsive.js', 'responsive.css']:
    if x not in files: files.insert(files.index('package.json'), x)
io.open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(pk, ensure_ascii=False, indent=2) + '\n')
print('PATCHED')
