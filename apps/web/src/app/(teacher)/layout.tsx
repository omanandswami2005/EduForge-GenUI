"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/shared/AppShell";
import { buttonVariants } from "@/components/ui";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell
            role="teacher"
            homeHref="/dashboard"
            links={[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/lessons", label: "Lessons" },
            ]}
            actions={
                <Link href="/lessons/new" className={buttonVariants({ size: "sm", className: "rounded-full" })}>
                    <Plus className="size-3.5" />
                    <span className="hidden sm:inline">New Lesson</span>
                </Link>
            }
        >
            {children}
        </AppShell>
    );
}
