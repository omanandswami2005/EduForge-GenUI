"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";

export default function StudentLearnPage() {
    const { user, token, role, loading } = useSessionStore();
    const router = useRouter();
    const [lessons, setLessons] = useState<any[]>([]);
    const [enrollCode, setEnrollCode] = useState("");
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        if (!loading && (!user || role !== "student")) {
            router.push("/login");
        }
    }, [user, role, loading, router]);

    useEffect(() => {
        if (token && user) {
            api.getStudentLessons(token, user.uid).then(setLessons).catch(console.error);
        }
    }, [token, user]);

    const handleEnroll = async () => {
        if (!enrollCode.trim() || !token) return;
        setEnrolling(true);
        try {
            await api.enrollStudent(token, enrollCode.trim());
            if (user) {
                const updated = await api.getStudentLessons(token, user.uid);
                setLessons(updated);
            }
            setEnrollCode("");
        } catch (err) {
            console.error(err);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold">
                    Edu<span className="text-blue-600">Forge</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">Student</span>
                </h1>
                <button
                    onClick={() => useSessionStore.getState().logout().then(() => router.push("/login"))}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Sign Out
                </button>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Lessons</h2>

                {/* Enroll */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-3">
                    <input
                        type="text"
                        placeholder="Enter lesson ID to enroll..."
                        value={enrollCode}
                        onChange={(e) => setEnrollCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {enrolling ? "Enrolling..." : "Enroll"}
                    </button>
                </div>

                {lessons.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No enrolled lessons. Enter a lesson ID above to get started.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {lessons.map((lesson: any) => (
                            <Link
                                key={lesson.id}
                                href={`/learn/${lesson.id}`}
                                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{lesson.subject}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
