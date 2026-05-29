import { collection, query, where, getDocs } from "firebase/firestore";
import { firebaseCore } from "./firebase";

export const api = {
  /**
   * Log in user using email and password
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    return firebaseCore.loginWithEmail(email, password);
  },

  /**
   * Register a new user with email, name, and password
   * @param {string} email
   * @param {string} fullName
   * @param {string} password
   */
  async register(email, fullName, password) {
    return firebaseCore.registerUser(email, fullName, password);
  },

  /**
   * Trigger Firebase or Emulated SMS OTP
   * @param {string} phoneNumber
   * @param {string} recaptchaContainerId
   */
  async sendPhoneOTP(phoneNumber, recaptchaContainerId) {
    return firebaseCore.sendPhoneOTP(phoneNumber, recaptchaContainerId);
  },

  /**
   * Get active session profile (automatically called on mount)
   */
  async getMe() {
    const isReal = firebaseCore.isRealFirebase;
    if (isReal) {
      return new Promise((resolve) => {
        const unsubscribe = firebaseCore.auth.onAuthStateChanged(async (user) => {
          unsubscribe();
          if (!user) {
            resolve(null);
            return;
          }
          
          try {
            const q = query(collection(firebaseCore.db, "users"), where("uid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            let fullName = user.email ? user.email.split("@")[0] : `Farmer (${user.phoneNumber?.slice(-4) || ""})`;
            if (!querySnapshot.empty) {
              fullName = querySnapshot.docs[0].data().fullName;
            }
            resolve({
              uid: user.uid,
              email: user.email || "",
              phoneNumber: user.phoneNumber || "",
              fullName
            });
          } catch (e) {
            console.warn("Error fetching user profile in getMe:", e);
            resolve({
              uid: user.uid,
              email: user.email || "",
              phoneNumber: user.phoneNumber || "",
              fullName: user.displayName || user.email?.split("@")[0] || "Farmer"
            });
          }
        });
      });
    } else {
      // Return emulated session user
      return firebaseCore.auth.currentUser;
    }
  },

  /**
   * Update user profile fields (fullName, avatar)
   * @param {string} uid
   * @param {object} updates - e.g. { fullName: "Ramesh Kumar", avatar: "👨‍🌾" }
   */
  async updateProfile(uid, updates) {
    return firebaseCore.updateUserProfile(uid, updates);
  },

  /**
   * Log out active session
   */
  async logout() {
    return firebaseCore.logoutUser();
  },

  /**
   * Save a soil or crop leaf diagnostic report
   * @param {string} type - 'soil' or 'leaf'
   * @param {object} data - Scan metadata payload
   */
  async saveScan(type, data) {
    return firebaseCore.saveScanRecord(type, data);
  },

  /**
   * Retrieve scan history logs
   */
  async getScans() {
    return firebaseCore.fetchUserScans();
  },

  /**
   * Delete a scan record by ID
   * @param {string} scanId
   */
  async deleteScan(scanId) {
    return firebaseCore.deleteScanRecord(scanId);
  }
};
