const CACHE = "kinsous-public-f7e1232247e3";
const ASSETS = ["/offline.html", "/android-chrome-192x192.png", "/android-chrome-512x512.png", "/favicon-32x32.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("kinsous-public-") && key !== CACHE).map(key => caches.delete(key)))), self.clients.claim()])));
self.addEventListener("message", event => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
 const url = new URL(event.request.url);
 if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
 if (event.request.mode === "navigate") event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
 else if (ASSETS.includes(url.pathname)) event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(event.request)));
});
self.addEventListener("push", event => {
 let data = {}; try { data = event.data ? event.data.json() : {}; } catch {}
 event.waitUntil(self.registration.showNotification("KinSous", { body: "You have a new update. Open KinSous to view it.", icon: "/android-chrome-192x192.png", badge: "/favicon-32x32.png", tag: data.id, data: { url: data.url || data.href || "/messages" } }));
});
self.addEventListener("notificationclick", event => {
 event.notification.close();
 let url = new URL("/", self.location.origin);
 try { const candidate = new URL(event.notification.data?.url || "/", self.location.origin); if (candidate.origin === self.location.origin) url = candidate; } catch {}
 event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(async windows => {
  const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
  if (existing) { await existing.navigate(url.href); return existing.focus(); }
  return clients.openWindow(url.href);
 }));
});
