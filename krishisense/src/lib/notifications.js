import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, getFirestore } from "firebase/firestore";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const initNotifications = async (firebaseApp, userId) => {
  if (!firebaseApp)                    return { supported: false };
  if (!("Notification" in window))     return { supported: false };
  if (!("serviceWorker" in navigator)) return { supported: false };

  // Step 1 — register service worker and wait for it to become active
  let registration;
  try {
    registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    // Wait for the SW to be active — getToken() fails if it's still installing
    if (registration.installing || registration.waiting) {
      await new Promise((resolve) => {
        const sw = registration.installing || registration.waiting;
        sw.addEventListener("statechange", function handler(e) {
          if (e.target.state === "activated") {
            sw.removeEventListener("statechange", handler);
            resolve();
          }
        });
        // Safety timeout after 5 s
        setTimeout(resolve, 5000);
      });
    }
  } catch (e) {
    console.warn("[FCM] SW registration failed:", e.message);
    return { supported: true, granted: false, error: "sw_failed", detail: e.message };
  }

  // Step 2 — ask for permission (may already be granted)
  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") {
    return { supported: true, granted: false, error: "permission_denied" };
  }

  // Step 3 — get FCM token
  try {
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { supported: true, granted: true, token: null, error: "no_token" };

    // Step 4 — save token to Firestore
    try {
      const db = getFirestore(firebaseApp);
      await setDoc(
        doc(db, "fcmTokens", userId),
        {
          token,
          userId,
          platform: /Mobile/.test(navigator.userAgent) ? "mobile" : "desktop",
          updatedAt: new Date().toISOString(),
          active: true,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[FCM] Firestore token save failed:", e.message);
      // Token is still usable even if Firestore save fails
    }

    return { supported: true, granted: true, token };
  } catch (e) {
    console.warn("[FCM] getToken failed:", e.message);
    return { supported: true, granted: true, error: "token_failed", detail: e.message };
  }
};

export const onForegroundMessage = (firebaseApp, callback) => {
  if (!firebaseApp) return () => {};
  try {
    const messaging = getMessaging(firebaseApp);
    return onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title || "KrishiSense Alert",
        body:  payload.notification?.body  || "",
        data:  payload.data || {},
        timestamp: new Date(),
      });
    });
  } catch (e) {
    console.warn("onForegroundMessage failed:", e.message);
    return () => {};
  }
};

export const getNotificationStatus = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
};
