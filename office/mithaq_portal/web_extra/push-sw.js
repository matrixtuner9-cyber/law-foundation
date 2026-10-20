// عامل الخدمة لبوابة الموكل: يعرض تنبيهات المحامي بصوت النظام حتى والتطبيق مغلق
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: 'بوابة ميثاق', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    // إن كان التطبيق مفتوحاً أمام الموكل، فهو يُصدر التنبيه بنفسه
    // على الآيفون يجب أن يُعرض كل إشعار وإلا ألغى Safari اشتراك البوابة، فنعرضه دائماً هناك
    const ios = /iPhone|iPad|iPod|Macintosh/.test(self.navigator.userAgent);
    if (!ios && list.some(c => c.visibilityState === 'visible' && c.focused)) return;
    return self.registration.showNotification(d.title || 'بوابة ميثاق', {
      body: d.body || '',
      icon: 'icons/Icon-192.png',
      badge: 'icons/Icon-maskable-192.png',
      tag: d.tag || 'mithaq',
      renotify: true,
      silent: false,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [180, 80, 180, 80, 260],
      timestamp: Date.now(),
      data: { url: d.url || './' },
    });
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
