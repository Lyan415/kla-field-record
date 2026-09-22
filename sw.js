// kLa 現場紀錄 — 離線快取（版本需與 index.html 的 APP_VERSION 一致）
const CACHE = 'kla-record-v1.0.1';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 有網路：抓最新版並更新快取；沒網路或 5 秒無回應：改用快取
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  const fromNet = fetch(e.request).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000));
  e.respondWith(
    Promise.race([fromNet, timeout]).catch(() =>
      caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))
    )
  );
});
