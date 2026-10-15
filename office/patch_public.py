import io
p=r'D:\Mithaq\server.js'
s=io.open(p,encoding='utf-8').read()
a="  const u = new URL(req.url, 'http://localhost');\n  if (u.pathname.startsWith('/api/'))"
assert s.count(a)==1, 'anchor'
guard="""  const u = new URL(req.url, 'http://localhost');
  /* وضع النشر العام: الزيارات القادمة عبر نفق Cloudflare ترى بوابة الموكل فقط ولا تصل للإدارة أو ميزان أو ملفات النظام */
  if (req.headers['cf-connecting-ip'] || req.headers['cf-ray']) {
    const q = u.pathname;
    const ok = q === '/portal' || q.startsWith('/portal/') || q.startsWith('/api/portal/') || q.startsWith('/api/media/') || q === '/api/health';
    if (!ok) { res.writeHead(404); return res.end() }
  }
  if (u.pathname.startsWith('/api/'))"""
s=s.replace(a,guard,1)
io.open(p,'w',encoding='utf-8',newline='\n').write(s)
print('OK')
