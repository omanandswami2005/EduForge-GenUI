const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
    token?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || `API error: ${res.status}`);
    }

    return res.json();
}

// Lessons
export const api = {
    getUploadUrl: (token: string, filename: string, contentType: string, lessonTitle: string, subject: string) =>
        apiFetch<{ uploadUrl: string; lessonId: string; gcsPath: string }>(
            "/lessons/upload-url",
            { method: "POST", token, body: JSON.stringify({ filename, contentType, lessonTitle, subject }) }
        ),

    startIngestion: (token: string, lessonId: string, gcsPath: string) =>
        apiFetch<{ status: string; lessonId: string }>(
            "/lessons/start-ingestion",
            { method: "POST", token, body: JSON.stringify({ lessonId, gcsPath }) }
        ),

    getLesson: (token: string, lessonId: string) =>
        apiFetch<any>(`/lessons/${lessonId}`, { token }),

    getTeacherLessons: (token: string) =>
        apiFetch<any[]>("/lessons/", { token }),

    getSubtopics: (token: string, lessonId: string) =>
        apiFetch<any[]>(`/lessons/${lessonId}/subtopics`, { token }),

    getMCQs: (token: string, lessonId: string, subtopicId: string) =>
        apiFetch<any[]>(`/lessons/${lessonId}/subtopics/${subtopicId}/mcqs`, { token }),

    // Students
    enrollStudent: (token: string, lessonId: string) =>
        apiFetch<any>("/students/enroll", {
            method: "POST", token,
            body: JSON.stringify({ lessonId }),
        }),

    getStudentLessons: (token: string, studentId: string) =>
        apiFetch<any[]>(`/students/${studentId}/lessons`, { token }),

    // BKT
    updateBKT: (token: string, data: any) =>
        apiFetch<any>("/bkt/update", { method: "POST", token, body: JSON.stringify(data) }),

    getBKTState: (token: string, studentId: string, conceptId: string) =>
        apiFetch<any>(`/bkt/state?studentId=${studentId}&conceptId=${conceptId}`, { token }),

    getScaffold: (token: string, pMastery: number) =>
        apiFetch<any>(`/bkt/scaffold?p_mastery=${pMastery}`, { token }),

    // Analytics
    getClassAnalytics: (token: string, lessonId: string) =>
        apiFetch<any>(`/analytics/class/${lessonId}`, { token }),
};
