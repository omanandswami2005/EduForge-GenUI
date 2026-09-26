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
        apiFetch<any[]>("/lessons", { token }),

    publishLesson: (token: string, lessonId: string) =>
        apiFetch<{ status: string; lessonId: string }>(
            `/lessons/${lessonId}/publish`,
            { method: "PATCH", token }
        ),

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

    // Join codes
    previewJoinCode: (token: string, code: string) =>
        apiFetch<JoinPreview>(`/students/join/${encodeURIComponent(code)}`, { token }),

    joinWithCode: (token: string, code: string) =>
        apiFetch<{ lessonId: string; alreadyEnrolled: boolean }>("/students/join", {
            method: "POST", token,
            body: JSON.stringify({ code }),
        }),

    getJoinCode: (token: string, lessonId: string) =>
        apiFetch<JoinCodeInfo>(`/lessons/${lessonId}/join-code`, { token }),

    regenerateJoinCode: (token: string, lessonId: string) =>
        apiFetch<JoinCodeInfo>(`/lessons/${lessonId}/join-code/regenerate`, { method: "POST", token }),

    setJoinEnabled: (token: string, lessonId: string, enabled: boolean) =>
        apiFetch<JoinCodeInfo>(`/lessons/${lessonId}/join-code`, {
            method: "PATCH", token,
            body: JSON.stringify({ enabled }),
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

    getMisconceptionInsights: (token: string, lessonId: string) =>
        apiFetch<any>(`/analytics/misconceptions/${lessonId}`, { token }),

    getTeacherOverview: (token: string) =>
        apiFetch<TeacherOverview>("/analytics/teacher-overview", { token }),
};

/** Shape of GET /analytics/teacher-overview (apps/api/src/services/teacher_overview.py) */
export interface TeacherOverview {
    totals: {
        lessons: number;
        published: number;
        processing: number;
        failed: number;
        draft: number;
        students: number;
        subtopics: number;
        mcqs: number;
        responses: number;
        accuracy: number | null;
        avgMastery: number | null;
        conceptStates: number;
    };
    masteryDistribution: Record<"struggling" | "developing" | "proficient" | "mastered", number>;
    lessons: {
        id: string;
        title: string;
        subject: string;
        status: string;
        ingestion: { step: string; progress: number; message: string } | null;
        students: number;
        avgMastery: number | null;
        responses: number;
        accuracy: number | null;
    }[];
    strugglingStudents: { id: string; name: string; lessonId: string; lessonTitle: string; avgMastery: number; conceptsTracked: number }[];
    weakConcepts: { conceptId: string; lessonId: string; lessonTitle: string; avgMastery: number; students: number }[];
    topMisconceptions: { conceptId: string; text: string; count: number; lessonId: string; lessonTitle: string }[];
}

export interface JoinPreview {
    lessonId: string;
    title: string;
    subject: string;
    subtopicCount: number | null;
    teacherName: string | null;
    alreadyEnrolled: boolean;
}

export interface JoinCodeInfo {
    code: string;
    /** "K7M-Q2P" */
    display: string;
    enabled: boolean;
}
