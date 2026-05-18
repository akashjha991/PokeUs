// PokeUs Background Service Worker for Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Push event received with no data.");
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || "PokeUs 💜";
    const options = {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/chat",
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Fallback if data is not JSON
    const text = event.data.text();
    const options = {
      body: text,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      vibrate: [100, 50, 100],
      data: {
        url: "/chat",
      },
    };

    event.waitUntil(self.registration.showNotification("PokeUs 💜", options));
  }
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const urlToOpen = new URL(notification.data.url, self.location.origin).href;

  notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and redirect
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
