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

  // Reuse an already-open window instead of just focusing it — a PWA left
  // open on the home screen would otherwise "open" the notification's link
  // by focusing the home tab without ever navigating it anywhere.
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of clients) {
        if (!("focus" in client)) continue;
        await client.focus();
        if ("navigate" in client) {
          try {
            await client.navigate(url);
          } catch {
            // Cross-origin or otherwise unnavigable; the focused tab is
            // still better than nothing.
          }
        }
        return;
      }

      if (self.clients.openWindow) await self.clients.openWindow(url);
    })()
  );
});
