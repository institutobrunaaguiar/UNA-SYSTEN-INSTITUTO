const CACHE_NAME = "una-system-v2"
const STATIC_ASSETS = [
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip API, auth, and supabase requests
  if (url.pathname.startsWith("/api/")) return
  if (request.url.includes("supabase")) return

  // Only cache static assets (images, icons, fonts, CSS, JS bundles)
  // NEVER cache HTML pages — they require auth validation via middleware
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|svg|ico|jpg|jpeg|webp|woff2?|ttf|css|js)$/)

  if (!isStaticAsset) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
