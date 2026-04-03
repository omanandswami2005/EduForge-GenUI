"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useThemeStore } from "@/stores/themeStore";
import { auth } from "@/lib/firebase";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        useThemeStore.getState().init();
        const unsub = useSessionStore.getState().initAuth();
        return unsub;
    }, []);

    // Auto-refresh Firebase token before expiry (every 50 min)
    useEffect(() => {
        const interval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken(true);
                useSessionStore.setState({ token });
                document.cookie = `firebase-token=${token};path=/;max-age=3600;SameSite=Strict`;
            }
        }, 50 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return <>{children}</>;
}
