"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useSessionStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || role !== "student")) {
            router.push("/login");
        }
    }, [user, role, loading, router]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-dvh text-gray-500 dark:text-gray-400">Loading...</div>;
    }

    if (!user || role !== "student") return null;

    return (
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
            <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/learn" className="text-xl font-bold text-gray-900 dark:text-white">
                        Edu<span className="text-blue-600 dark:text-blue-400">Forge</span>
                    </Link>
                    <Link href="/learn" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        My Lessons
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
                    <button
                        onClick={() => useSessionStore.getState().logout().then(() => router.push("/login"))}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        Sign Out
                    </button>
                </div>
            </nav>
            {children}
        </div>
    );
}
