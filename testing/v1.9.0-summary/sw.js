const scope = new URL(self.registration.scope);
const icon = new URL("notification-icon.png", scope).href;
const scopedUrl = (path) => {
  const target = new URL(String(path || "").replace(/^\/+/, ""), scope);
  return target.origin === scope.origin && target.pathname.startsWith(scope.pathname) ? target.href : scope.href;
};

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "По ходу.", {
    body: data.body || "У вас есть запланированные задачи",
    icon,
    tag: data.tag || "po-khodu-reminder",
    renotify: false,
    ...(data.action === "open-day" ? { actions: [{ action: "open-day", title: "Открыть день" }] } : {}),
    data: { url: data.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = scopedUrl(event.notification.data?.url);
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clients.find((client) => client.url.startsWith(scope.href) && !client.url.slice(scope.href.length).startsWith("testing/"));
    if (existing) {
      const navigated = await existing.navigate(target);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(target);
  })());
});
