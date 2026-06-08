importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAT4o7cHZ3pr2d99V2d-bkdDQA4kiUGpwk",
  authDomain: "krishisense-4b3a3.firebaseapp.com",
  projectId: "krishisense-4b3a3",
  storageBucket: "krishisense-4b3a3.firebasestorage.app",
  messagingSenderId: "726877565518",
  appId: "1:726877565518:web:ce0cfbb654fe5776c5491f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};
  const notifOptions = {
    body: body || "",
    icon: icon || "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: data || {},
    actions: [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
    requireInteraction: data?.urgent === "true",
    tag: data?.alertType || "krishisense-alert",
  };
  self.registration.showNotification(
    title || "KrishiSense Alert",
    notifOptions,
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const targetUrl = event.notification.data?.targetUrl || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    }),
  );
});
