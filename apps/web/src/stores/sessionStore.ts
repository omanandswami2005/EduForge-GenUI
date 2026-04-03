import { create } from "zustand";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface SessionStore {
    user: User | null;
    role: "teacher" | "student" | null;
    loading: boolean;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role: "teacher" | "student") => Promise<void>;
    logout: () => Promise<void>;
    initAuth: () => () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
    user: null,
    role: null,
    loading: true,
    token: null,

    login: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        const role = userDoc.exists() ? (userDoc.data().role as "teacher" | "student") : null;
        if (!role) {
            // User authenticated but has no profile doc (e.g. previous failed registration).
            // Sign them out so they can re-register cleanly.
            await signOut(auth);
            throw new Error("No account profile found. Please register to create your account.");
        }
        if (role) document.cookie = `user-role=${role};path=/;max-age=86400;SameSite=Strict`;
        document.cookie = `firebase-token=${token};path=/;max-age=3600;SameSite=Strict`;
        set({ user: cred.user, token, role });
    },

    register: async (email, password, name, role) => {
        let cred;
        try {
            cred = await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            // If auth/email-already-in-use, the user registered before but Firestore write
            // failed. Sign them in and upsert the profile document instead.
            if (err.code === "auth/email-already-in-use") {
                const existing = await signInWithEmailAndPassword(auth, email, password);
                cred = existing;
            } else {
                throw err;
            }
        }
        // Force-refresh the token so Firestore SDK has auth ready before the write
        const token = await cred.user.getIdToken(true);
        await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email,
            displayName: name,
            role,
            createdAt: new Date(),
        });
        document.cookie = `user-role=${role};path=/;max-age=86400;SameSite=Strict`;
        document.cookie = `firebase-token=${token};path=/;max-age=3600;SameSite=Strict`;
        set({ user: cred.user, token, role });
    },

    logout: async () => {
        await signOut(auth);
        document.cookie = "user-role=;path=/;max-age=0";
        document.cookie = "firebase-token=;path=/;max-age=0";
        set({ user: null, token: null, role: null });
    },

    initAuth: () => {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Force-refresh on init to ensure we always have a valid non-expired token
                const token = await user.getIdToken(true);
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const role = userDoc.exists() ? (userDoc.data().role as "teacher" | "student") : null;
                if (role) document.cookie = `user-role=${role};path=/;max-age=86400;SameSite=Strict`;
                document.cookie = `firebase-token=${token};path=/;max-age=3600;SameSite=Strict`;
                set({ user, token, role, loading: false });
            } else {
                document.cookie = "user-role=;path=/;max-age=0";
                document.cookie = "firebase-token=;path=/;max-age=0";
                set({ user: null, token: null, role: null, loading: false });
            }
        });
    },
}));
