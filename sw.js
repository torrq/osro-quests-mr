// sw.js
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      // You can add paths to your actual icons here
      icon: '/osro-quests-hr/image/favicon.png',
      badge: '/osro-quests-hr/image/favicon.png',
      image: '/osro-quests-hr/image/osro_quests_logo_v3.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 'osro-timer',
        url: data.url || 'https://torrq.github.io/osro-quests-hr/'
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
  const targetUrl = event.notification.data?.url || 'https://torrq.github.io/osro-quests-hr/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus an already-open tab if the URL matches, otherwise open a new one
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});