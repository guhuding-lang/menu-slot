const CACHE = 'gaba47-v16'
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './app.css?v=9',
  './photo-fix.js?v=1',
  './app.js?v=10',
  './members-page.js?v=1',
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
