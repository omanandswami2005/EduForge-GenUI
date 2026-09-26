"use client";

import { AppShell } from "@/components/shared/AppShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell role="student" homeHref="/learn" links={[{ href: "/learn", label: "My Lessons" }]}>
            {children}
        </AppShell>
    );
}
