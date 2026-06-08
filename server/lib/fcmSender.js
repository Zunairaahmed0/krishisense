import admin from "firebase-admin";

let adminInitialized = false;

const initAdmin = () => {
  if (adminInitialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.warn("[fcm] FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM disabled");
    return;
  }
  try {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    adminInitialized = true;
    console.log("[fcm] Firebase Admin initialized ✅");
  } catch (e) {
    console.error("[fcm] Admin init failed:", e.message);
  }
};

export const isAdminReady = () => {
  initAdmin();
  return adminInitialized;
};

export const getAdminFirestore = () => {
  initAdmin();
  if (!adminInitialized) throw new Error("Firebase Admin not initialized");
  return admin.firestore();
};

export const sendAlertToUser = async (fcmToken, alert) => {
  if (!isAdminReady()) {
    console.warn("[fcm] Admin not ready — skipping send");
    return false;
  }
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: alert.title,
        body:  alert.body,
      },
      data: {
        alertType: alert.alertType || "general",
        action:    alert.action    || "",
        severity:  alert.severity  || "info",
        urgent:    alert.severity === "critical" ? "true" : "false",
        targetUrl: alert.targetUrl || "/",
      },
      android: {
        priority: alert.severity === "critical" ? "high" : "normal",
        notification: {
          channelId:            "krishisense-alerts",
          priority:             alert.severity === "critical" ? "max" : "high",
          defaultVibrateTimings: true,
          color:
            alert.severity === "critical" ? "#EF4444" :
            alert.severity === "high"     ? "#F59E0B" : "#16864B",
        },
      },
      webpush: {
        notification: {
          requireInteraction: alert.severity === "critical",
        },
      },
    };
    await admin.messaging().send(message);
    return true;
  } catch (e) {
    console.error("[fcm] send failed:", e.message);
    return false;
  }
};

export const sendAlertToAllFarmersInRegion = async (alert) => {
  if (!isAdminReady()) return 0;
  try {
    const db       = admin.firestore();
    const snapshot = await db.collection("fcmTokens").where("active", "==", true).get();
    const tokens   = snapshot.docs.map((d) => d.data().token).filter(Boolean);
    if (!tokens.length) return 0;

    let sent = 0;
    for (let i = 0; i < tokens.length; i += 500) {
      const results = await Promise.allSettled(
        tokens.slice(i, i + 500).map((t) => sendAlertToUser(t, alert))
      );
      sent += results.filter((r) => r.status === "fulfilled" && r.value).length;
    }
    return sent;
  } catch (e) {
    console.error("[fcm] regional send failed:", e.message);
    return 0;
  }
};
