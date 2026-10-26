(function () {
  MQScene(document.getElementById('scene'), { scalesY: .38 });
  const $ = id => document.getElementById(id), err = $('err');
  const show = m => { err.textContent = m; err.hidden = !m };
  const post = (url, b) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
    .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'تعذّر الاتصال بالخادم.'); return j });

  fetch('/api/auth/status').then(r => r.json()).then(s => {
    if (s.office) $('office').textContent = s.office;
    if (s.lawyer) { $('lawyer').textContent = s.lawyer; $('sceneLawyer').textContent = s.lawyer + ' · ' + (s.office || '') }
    if (s.setup) {
      $('title').textContent = 'إعداد النظام لأول مرة';
      if (!s.local) { show('إنشاء حساب مدير النظام متاح من جهاز المكتب نفسه فقط. افتح المِسْبار على الحاسوب الرئيسي.'); return }
      $('fSetup').hidden = false; $('sn').focus();
    } else { $('fLogin').hidden = false; $('lu').focus() }
  }).catch(() => show('تعذّر الاتصال بخادم المكتب.'));

  document.querySelectorAll('.eye').forEach(b => b.onclick = () => { const i = $(b.dataset.for), on = i.type === 'password'; i.type = on ? 'text' : 'password'; b.textContent = on ? 'إخفاء' : 'إظهار'; i.focus() });
  $('lp').addEventListener('keyup', e => { $('caps').hidden = !(e.getModifierState && e.getModifierState('CapsLock')) });

  $('fLogin').onsubmit = async e => {
    e.preventDefault(); show(''); const b = $('goL'); b.disabled = true; b.textContent = 'جارٍ التحقق…';
    try { await post('/api/auth/login', { username: $('lu').value.trim(), password: $('lp').value }); location.replace('/') }
    catch (x) { show(x.message); $('lp').select() } finally { b.disabled = false; b.textContent = 'دخول' }
  };
  $('fSetup').onsubmit = async e => {
    e.preventDefault(); show('');
    if ($('sp').value !== $('sp2').value) return show('كلمتا المرور غير متطابقتين.');
    try { await post('/api/auth/setup', { name: $('sn').value.trim(), username: $('su').value.trim(), password: $('sp').value }); location.replace('/') }
    catch (x) { show(x.message) }
  };
})();
