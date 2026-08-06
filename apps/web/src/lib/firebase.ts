import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

// Emulator mode needs no real project — any fixed id works as long as it's
// consistent across the client SDK and the Admin SDK on the backend services.
const firebaseConfig = USE_EMULATOR
    ? {
          apiKey: "demo-key",
          authDomain: "localhost",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-eduforge",
          storageBucket: "demo-eduforge.appspot.com",
          messagingSenderId: "0",
          appId: "demo-app-id",
      }
    : {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to local emulators exactly once (Next.js Fast Refresh re-runs this module).
// Only Auth + Firestore are emulated (see firebase.emulator.json) — Storage is unused client-side,
// file uploads go through the API gateway.
if (USE_EMULATOR && typeof window !== "undefined" && !(globalThis as any).__firebaseEmulatorsConnected) {
    (globalThis as any).__firebaseEmulatorsConnected = true;
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 9090);
}
