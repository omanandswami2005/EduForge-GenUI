"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";

export default function NewLessonPage() {
    const { token } = useSessionStore();
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !token) return;

        setUploading(true);
        setError("");

        try {
            // 1. Get signed upload URL
            setStatus("Getting upload URL...");
            const { uploadUrl, lessonId, gcsPath } = await api.getUploadUrl(
                token,
                file.name,
                file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                title,
                subject,
            );

            // 2. Upload file to GCS
            setStatus("Uploading presentation...");
            await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
                body: file,
            });

            // 3. Trigger ingestion
            setStatus("Starting AI analysis...");
            await api.startIngestion(token, lessonId, gcsPath);

            // 4. Redirect to lesson page
            router.push(`/lessons/${lessonId}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3">
                <h1 className="text-xl font-bold">
                    Edu<span className="text-blue-600">Forge</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">New Lesson</span>
                </h1>
            </nav>

            <main className="max-w-2xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload a Lesson</h2>
                <p className="text-gray-500 mb-8">
                    Upload a PowerPoint presentation. Our AI will automatically extract topics,
                    generate assessments, and calibrate the knowledge model.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Newton's Laws of Motion"
                        />
                    </div>

                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                            id="subject"
                            type="text"
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Physics"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Presentation File</label>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pptx"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(file.size / 1024 / 1024).toFixed(1)} MB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-500">Click to select a .pptx file</p>
                                    <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {status && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                            {status}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {uploading ? "Processing..." : "Upload & Analyze"}
                    </button>
                </form>
            </main>
        </div>
    );
}
