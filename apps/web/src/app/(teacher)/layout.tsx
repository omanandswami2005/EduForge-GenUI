"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useSessionStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || role !== "teacher")) {
            router.push("/login");
        }
    }, [user, role, loading, router]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user || role !== "teacher") return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="text-xl font-bold">
                        Edu<span className="text-blue-600">Forge</span>
                    </Link>
                    <div className="flex items-center gap-4 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                            Dashboard
                        </Link>
                        <Link href="/lessons" className="text-gray-600 hover:text-gray-900">
                            Lessons
                        </Link>
                        <Link
                            href="/lessons/new"
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            + New Lesson
                        </Link>
                    </div>
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
