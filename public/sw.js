// Service worker skeleton. Caching strategy lands in a later phase; push
// notifications ("necesito más gente") are handled below.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Kancha", body: "" };
  try {
    payload = event.data.json();
  } catch {
    // Ignore malformed/empty payloads; fall back to the default above.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Kancha", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      data: { url: payload.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
