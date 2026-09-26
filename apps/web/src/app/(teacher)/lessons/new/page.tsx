"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";
import { FileUp, FileCheck2 } from "lucide-react";
import { Alert, Button, Card, Input, Label, PageHeader, Spinner } from "@/components/ui";

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
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
                body: file,
            });
            if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

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
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <PageHeader
                eyebrow="Ingestion Pipeline"
                title="Upload a Lesson"
                description="Upload a PowerPoint presentation. EduForge extracts topics, generates tiered MCQs, and calibrates the knowledge model."
            />

            {error && <Alert className="mb-6">{error}</Alert>}

            <Card className="p-6">
                <form onSubmit={handleUpload} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="title">Lesson Title</Label>
                            <Input
                                id="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Newton's Laws of Motion"
                            />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                type="text"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g., Physics"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Presentation File</Label>
                        <button
                            type="button"
                            className="w-full border-2 border-dashed border-line-strong bg-surface-2/50 rounded-lg p-8 text-center hover:border-accent hover:bg-accent/5 transition-colors"
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
                                <div className="flex flex-col items-center">
                                    <FileCheck2 className="size-6 text-accent mb-2" />
                                    <p className="text-sm font-medium text-fg">{file.name}</p>
                                    <p className="text-xs font-mono text-fg-subtle mt-1">
                                        {(file.size / 1024 / 1024).toFixed(1)} MB
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileUp className="size-6 text-fg-faint mb-2" />
                                    <p className="text-sm text-fg-muted">Click to select a .pptx file</p>
                                    <p className="text-xs font-mono text-fg-faint mt-1">Max 50MB</p>
                                </div>
                            )}
                        </button>
                    </div>

                    {status && (
                        <Alert tone="accent" className="flex items-center gap-2 font-mono text-xs">
                            {uploading && <Spinner className="size-3.5" />}
                            {status}
                        </Alert>
                    )}

                    <Button type="submit" size="lg" disabled={uploading || !file} className="w-full">
                        {uploading ? "Processing..." : "Upload & Analyze"}
                    </Button>
                </form>
            </Card>
        </main>
    );
}
