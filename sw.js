// sw.js
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const scopeUrl = self.registration.scope;
    const getAssetUrl = (relPath) => new URL(relPath, scopeUrl).href;
    
    const options = {
      body: data.body,
      icon: getAssetUrl('image/favicon.png'),
      badge: getAssetUrl('image/favicon.png'),
      image: getAssetUrl('image/osro_quests_logo_mr_v3.png'),
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 'osro-timer',
        url: data.url || scopeUrl
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Closes the notification if the user clicks it
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || 'https://torrq.github.io/osro-quests-mr/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus and navigate an already-open app tab if one exists, otherwise open a new window
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if ('focus' in client) {
          if (client.url === targetUrl) {
            return client.focus();
          } else if (client.url.includes('/osro-quests-mr') || client.url.includes('localhost') || client.url.includes('127.0.0.1')) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});