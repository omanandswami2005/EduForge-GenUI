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
        if (role) document.cookie = `user-role=${role};path=/;max-age=86400;SameSite=Strict`;
        document.cookie = `firebase-token=${token};path=/;max-age=3600;SameSite=Strict`;
        set({ user: cred.user, token, role });
    },

    register: async (email, password, name, role) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
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
                const token = await user.getIdToken();
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
