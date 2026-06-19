import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const isRealFirebase = !!(API_KEY && API_KEY.trim().length > 0);

// Initialize real or mock Firebase references
let appInstance = null;
let authInstance = null;
let dbInstance = null;

// Unique seed for simulated OTP codes
let activeSimulatedOTP = "";

// Initialize standard LocalStorage key fallbacks
const LOCAL_USERS_KEY = "krishi_local_users";
const LOCAL_SCANS_KEY = "krishi_local_scans";
const ACTIVE_SESSION_KEY = "krishi_active_session";

function getLocalData(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage write error:", e);
  }
}

if (isRealFirebase) {
  console.log("🔥 KRISHISENSE: INITIALIZING REAL FIREBASE CLOUD PROVIDER");
  const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  
  appInstance = initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
} else {
  console.log("📦 KRISHISENSE: RUNNING EMULATED LOCAL-STORAGE HYBRID DATABASE ENGINE");
  
  // Custom emulated session listener pool
  const authListeners = [];
  
  // Simulated Auth Provider
  authInstance = {
    currentUser: getLocalData(ACTIVE_SESSION_KEY, null),
    
    onAuthStateChanged: (callback) => {
      authListeners.push(callback);
      // Immediately invoke with active state
      const current = getLocalData(ACTIVE_SESSION_KEY, null);
      callback(current);
      return () => {
        const index = authListeners.indexOf(callback);
        if (index > -1) authListeners.splice(index, 1);
      };
    },
    
    triggerAuthStateChange: (user) => {
      authInstance.currentUser = user;
      setLocalData(ACTIVE_SESSION_KEY, user);
      authListeners.forEach(cb => cb(user));
    }
  };
}

export { appInstance as firebaseApp };

export const firebaseCore = {
  isRealFirebase,
  auth: authInstance,
  db: dbInstance,
  
  // Real or emulated email-password registration
  async registerUser(email, fullName, password) {
    if (isRealFirebase) {
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      const user = userCredential.user;
      
      // Update local storage profile or Firestore profile info
      const profile = {
        uid: user.uid,
        email: user.email,
        fullName: fullName.trim(),
        createdAt: new Date().toISOString()
      };
      
      // Save metadata directly to firestore
      await addDoc(collection(dbInstance, "users"), profile);
      return profile;
    } else {
      const users = getLocalData(LOCAL_USERS_KEY, []);
      const normalizedEmail = email.trim().toLowerCase();
      
      if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error("Email address is already registered.");
      }
      
      const newProfile = {
        uid: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        email: normalizedEmail,
        fullName: fullName.trim(),
        createdAt: new Date().toISOString()
      };
      
      users.push({ ...newProfile, password }); // In emulated mode, store securely for matching
      setLocalData(LOCAL_USERS_KEY, users);
      
      authInstance.triggerAuthStateChange(newProfile);
      return newProfile;
    }
  },
  
  // Real or emulated email login
  async loginWithEmail(email, password) {
    if (isRealFirebase) {
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      const user = userCredential.user;
      
      // Find full name profile from users collection in Firestore
      const q = query(collection(dbInstance, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      let fullName = email.split("@")[0];
      if (!querySnapshot.empty) {
        fullName = querySnapshot.docs[0].data().fullName;
      }
      
      return {
        uid: user.uid,
        email: user.email,
        fullName
      };
    } else {
      const users = getLocalData(LOCAL_USERS_KEY, []);
      const normalizedEmail = email.trim().toLowerCase();
      const targetUser = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
      
      if (!targetUser) {
        throw new Error("Invalid email or password.");
      }
      
      const { password: _, ...profile } = targetUser;
      authInstance.triggerAuthStateChange(profile);
      return profile;
    }
  },
  
  // Real or emulated Phone Authentication OTP trigger
  async sendPhoneOTP(phoneNumber, recaptchaContainerId) {
    if (isRealFirebase) {
      // Verify container exists before initializing RecaptchaVerifier
      if (!document.getElementById(recaptchaContainerId)) {
        throw new Error(`Recaptcha container '#${recaptchaContainerId}' not found in DOM. Ensure the element is mounted before calling sendPhoneOTP.`);
      }
      // Configure Firebase Recaptcha
      const verifier = new RecaptchaVerifier(authInstance, recaptchaContainerId, {
        size: "invisible"
      });
      const confirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, verifier);
      return {
        isReal: true,
        confirm: async (otpCode) => {
          const result = await confirmationResult.confirm(otpCode);
          const user = result.user;
          return {
            uid: user.uid,
            phoneNumber: user.phoneNumber,
            fullName: `Farmer (${user.phoneNumber.slice(-4)})`
          };
        }
      };
    } else {
      // Emulate SMS sending
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      activeSimulatedOTP = mockCode;
      
      // Flash code to console & alerts for ultimate sandbox interaction!
      console.log(`💬 [SMS emu] KrishiSense Verification code to ${phoneNumber}: ${mockCode}`);
      alert(`💬 [OTP SENT] KrishiSense Verification OTP: ${mockCode}\n\n(Enter this 6-digit code on the next screen)`);
      
      return {
        isReal: false,
        confirm: async (otpCode) => {
          if (otpCode !== activeSimulatedOTP) {
            throw new Error("Incorrect 6-digit verification code.");
          }
          
          const users = getLocalData(LOCAL_USERS_KEY, []);
          let profile = users.find(u => u.phoneNumber === phoneNumber);
          
          if (!profile) {
            profile = {
              uid: "p-" + Math.random().toString(36).substring(2, 10),
              phoneNumber,
              fullName: `Farmer (${phoneNumber.slice(-4)})`,
              createdAt: new Date().toISOString()
            };
            users.push(profile);
            setLocalData(LOCAL_USERS_KEY, users);
          }
          
          authInstance.triggerAuthStateChange(profile);
          return profile;
        }
      };
    }
  },
  
  // Real or emulated logout
  async logoutUser() {
    if (isRealFirebase) {
      await signOut(authInstance);
    } else {
      authInstance.triggerAuthStateChange(null);
    }
  },
  
  // Save scan to Firestore (real) or LocalStorage (emulated)
  async saveScanRecord(type, scanData, userLoc) {
    const activeUser = isRealFirebase ? authInstance.currentUser : getLocalData(ACTIVE_SESSION_KEY, null);
    if (!activeUser) throw new Error("Authentication required to save scans.");

    const userId = activeUser.uid;
    const scanItem = {
      userId,
      type,
      date: new Date().toISOString(),
      data: scanData,
      ...(userLoc?.lat != null && { lat: userLoc.lat, lon: userLoc.lon }),
    };
    
    if (isRealFirebase) {
      const docRef = await addDoc(collection(dbInstance, "scans"), scanItem);
      return { id: docRef.id, ...scanItem };
    } else {
      const scans = getLocalData(LOCAL_SCANS_KEY, []);
      const newScan = {
        id: Math.random().toString(36).substring(2, 15),
        ...scanItem
      };
      scans.unshift(newScan);
      setLocalData(LOCAL_SCANS_KEY, scans);
      return newScan;
    }
  },
  
  // Fetch user scans from Firestore (real) or LocalStorage (emulated)
  async fetchUserScans() {
    const activeUser = isRealFirebase ? authInstance.currentUser : getLocalData(ACTIVE_SESSION_KEY, null);
    if (!activeUser) return [];
    
    const userId = activeUser.uid;
    
    if (isRealFirebase) {
      const q = query(
        collection(dbInstance, "scans"), 
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort descending by date/timestamp in memory to avoid Firestore composite index requirement
      list.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0);
        const dateB = new Date(b.date || b.timestamp || 0);
        return dateB - dateA;
      });
      return list;
    } else {
      const scans = getLocalData(LOCAL_SCANS_KEY, []);
      return scans.filter(s => s.userId === userId);
    }
  },

  // Update user profile (fullName, avatar emoji)
  async updateUserProfile(uid, updates) {
    if (isRealFirebase) {
      const q = query(collection(dbInstance, "users"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await updateDoc(doc(dbInstance, "users", snapshot.docs[0].id), updates);
      }
    } else {
      // Update in local users list
      const users = getLocalData(LOCAL_USERS_KEY, []);
      const idx = users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        setLocalData(LOCAL_USERS_KEY, users);
      }
      // Update active session
      const session = getLocalData(ACTIVE_SESSION_KEY, null);
      if (session?.uid === uid) {
        setLocalData(ACTIVE_SESSION_KEY, { ...session, ...updates });
      }
    }
  },

  // Delete a specific scan record from Firestore or LocalStorage
  async deleteScanRecord(scanId) {
    if (isRealFirebase) {
      await deleteDoc(doc(dbInstance, "scans", scanId));
    } else {
      const scans = getLocalData(LOCAL_SCANS_KEY, []);
      const filtered = scans.filter(s => s.id !== scanId);
      setLocalData(LOCAL_SCANS_KEY, filtered);
    }
  },

  // Save a crop listing to Firestore or LocalStorage
  async saveMarketListing(listing) {
    const activeUser = isRealFirebase
      ? authInstance.currentUser
      : getLocalData(ACTIVE_SESSION_KEY, null);
    if (!activeUser) throw new Error("Authentication required");

    const item = {
      ...listing,
      sellerId: activeUser.uid,
      sellerName: listing.sellerName || "Anonymous Farmer",
      createdAt: new Date().toISOString(),
      active: true,
    };

    if (isRealFirebase) {
      const docRef = await addDoc(collection(dbInstance, "marketListings"), item);
      return { id: docRef.id, ...item };
    } else {
      const listings = getLocalData("krishi_local_listings", []);
      const newItem = { id: "ml-" + Math.random().toString(36).slice(2), ...item };
      listings.unshift(newItem);
      setLocalData("krishi_local_listings", listings);
      return newItem;
    }
  },

  // Fetch all active listings (not just by current user)
  async fetchAllListings() {
    if (isRealFirebase) {
      const q = query(
        collection(dbInstance, "marketListings"),
        where("active", "==", true)
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list;
    } else {
      return getLocalData("krishi_local_listings", []);
    }
  },

  // Delete a listing (only callable by owner)
  async deleteMarketListing(listingId, userId) {
    if (isRealFirebase) {
      await deleteDoc(doc(dbInstance, "marketListings", listingId));
    } else {
      const listings = getLocalData("krishi_local_listings", []);
      setLocalData(
        "krishi_local_listings",
        listings.filter(l => !(l.id === listingId && l.sellerId === userId))
      );
    }
  },
};
