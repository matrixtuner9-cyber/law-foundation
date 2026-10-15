import io, json, sys
R = 'D:\\Mithaq\\'
def rd(f): return io.open(R + f, encoding='utf-8').read()
def wr(f, s): io.open(R + f, 'w', encoding='utf-8', newline='\n').write(s)
def rep(s, a, b, f):
    if a not in s: print('MISSING in', f, ':', a[:70]); sys.exit(1)
    return s.replace(a, b, 1)

f = 'index.html'; s = rd(f)
if 'prestige.css' not in s:
    s = rep(s, '<html lang="ar" dir="rtl">', '<html lang="ar" dir="rtl" data-theme="prestige">', f)
    s = rep(s, 'family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500', 'family=Cairo:wght@400;500;600;700;800&family=Amiri:wght@400;700&family=IBM+Plex+Mono:wght@400;500', f)
    s = rep(s, '<link rel="stylesheet" href="mizan.css">', '<link rel="stylesheet" href="mizan.css">\n<link rel="stylesheet" href="admin.css">\n<link rel="stylesheet" href="prestige.css">', f)
    s = rep(s, '<script src="briefcase.js"></script>', '<script src="briefcase.js"></script>\n<script src="admin.js"></script>', f)
    s = rep(s, 'stroke="#c99a46"', 'stroke="#E6C77A"', f)
    s = rep(s, '<div class="who"><span>المحامي سامر عبد الله</span><div class="avatar">س</div></div>', '<div class="who"></div>', f)
    wr(f, s)

f = 'sync.js'; s = rd(f)
if 'MQ_applyUser' not in s:
    s = rep(s, "function saveState(){if(!MQ.ready)return;", "function saveState(){if(!MQ.ready||MQ.readOnly)return;", f)
    s = rep(s, "const post=(url,obj)=>fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(obj)}).then(async r=>{const j=await r.json();", "const post=(url,obj)=>fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(obj)}).then(async r=>{if(r.status===401)location.replace('/login.html');const j=await r.json();", f)
    s = rep(s, " .then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'تعذّر الرفع');", " .then(async r=>{if(r.status===401)location.replace('/login.html');const j=await r.json();if(!r.ok)throw new Error(j.error||'تعذّر الرفع');", f)
    s = rep(s, "  const b=await (await fetch('/api/admin/bootstrap')).json();", "  const r=await fetch('/api/admin/bootstrap');if(r.status===401){location.replace('/login.html');return}\n  const b=await r.json();\n  if(window.MQ_applyUser)MQ_applyUser(b.user,b.settings);", f)
    s = rep(s, "  if(!b.state)saveState();", "  if(!b.state&&!MQ.readOnly)saveState();", f)
    s = rep(s, "  MQ.ready=true;MQ_buildFeed();render();connect();", "  MQ.ready=true;MQ_buildFeed();render();connect();document.body.classList.add('ready');", f)
    s = rep(s, " }catch(e){console.warn(", " }catch(e){document.body.classList.add('ready');console.warn(", f)
    wr(f, s)

f = 'electron\\main.js'; s = rd(f)
a = ".find(d => fs.existsSync(path.join(d, 'messages.json')));"
if a in s:
    s = s.replace(a, ".find(d => ['mithaq.db', 'messages.json'].some(f => fs.existsSync(path.join(d, f))));", 1); wr(f, s)

f = 'package.json'; s = rd(f); p = json.loads(s)
files = p['build']['files']
for extra in ['lib/**', 'admin.js', 'admin.css', 'prestige.css', 'login.html', 'login.css', 'login.js', 'scales.js']:
    if extra not in files: files.insert(files.index('package.json'), extra)
wr(f, json.dumps(p, ensure_ascii=False, indent=2) + '\n')
print('PATCHED')
