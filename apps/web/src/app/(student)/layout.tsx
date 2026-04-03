"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useSessionStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || role !== "student")) {
            router.push("/login");
        }
    }, [user, role, loading, router]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user || role !== "student") return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/learn" className="text-xl font-bold">
                        Edu<span className="text-blue-600">Forge</span>
                    </Link>
                    <Link href="/learn" className="text-sm text-gray-600 hover:text-gray-900">
                        My Lessons
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <button
                        onClick={() => useSessionStore.getState().logout().then(() => router.push("/login"))}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Sign Out
                    </button>
                </div>
            </nav>
            {children}
        </div>
    );
}
