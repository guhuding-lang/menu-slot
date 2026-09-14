const CACHE = 'gaba47-v66'
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './app.css?v=31',
  './photo-fix.js?v=1',
  './app.js?v=57',
  './sports-cat-ui.js?v=3',
  './assets/sports-cats/01-hiking-cat.webp',
  './assets/sports-cats/02-bench-press-cat.webp',
  './assets/sports-cats/03-ice-skating-cat.webp',
  './assets/sports-cats/04-basketball-cat.webp',
  './assets/sports-cats/05-running-cat.webp',
  './assets/sports-cats/06-flexing-cat.webp',
  './assets/sports-cats/07-stair-climbing-cat.webp',
  './assets/sports-cats/08-yoga-cat.webp',
  './assets/sports-cats/09-chicken-breast-cat.webp',
  './assets/sports-cats/10-sit-up-cat.webp',
  './assets/sports-cats/11-sleeping-cat.webp',
  './assets/sports-cats/12-fast-food-cat.webp',
  './assets/sports-cats/13-working-overtime-cat.webp',
  './assets/sports-cats/14-aerobics-cat.webp',
  './assets/phosphor/phosphor.css',
  './assets/phosphor/Phosphor-Regular.woff2',
  './assets/app-icon-192.webp',
  './assets/app-icon-512.webp',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put('./index.html', response.clone()))
          }
          return response
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  const url = new URL(event.request.url)
  if (url.origin !== location.origin || !url.pathname.includes('/gaba47/')) return

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
      return response
    })),
  )
})
