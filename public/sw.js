// Minimal service worker: only exists so browsers treat the site as an
// installable app. It has no fetch handler and caches nothing — every request
// goes straight to the network, so auth and fresh content are unaffected.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
