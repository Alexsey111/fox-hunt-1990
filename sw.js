/* Офлайн-кэш «Охоты на лис».
   Игра статическая: список файлов фиксированный, сеть нужна только чтобы
   получить новую версию. Поэтому:
     · оболочка (index.html) кладётся в кэш на установке и обновляется в фоне;
     · ассеты (js/css/иконки) отдаются из кэша сразу, свежая копия подтягивается
       следом (stale-while-revalidate);
     · в кэш попадает только своё происхождение и только GET.
   ВАЖНО: при выпуске новой версии поднимите CACHE — иначе у тех, кто уже
   открывал игру, останется старый app.js. */
var CACHE = 'fox-hunt-1.0.3';

var SHELL = [
  './index.html',
  './manifest.json',
  './assets/styles.css',
  './assets/i18n.js',
  './assets/engine.js',
  './assets/solver.js',
  './assets/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* cache: 'reload' — чтобы не взять устаревшее из HTTP-кэша браузера */
      return c.addAll(SHELL.map(function (url) {
        return new Request(url, { cache: 'reload' });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function fresh(req, cache) {
  return fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  }).catch(function () { return null; });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match('./index.html').then(function (hit) {
        var net = fresh(req, cache);
        return hit || net.then(function (res) {
          return res || new Response('Нет сети и нет копии игры.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      });
    }));
    return;
  }

  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) { fresh(req, cache); return hit; }
      return fresh(req, cache).then(function (res) {
        return res || new Response('', { status: 504 });
      });
    });
  }));
});
