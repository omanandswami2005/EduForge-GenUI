"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { SiteNav, type NavLink } from "@/components/shared/SiteNav";
import { LoadingState } from "@/components/ui";

/**
 * Authenticated app chrome shared by the teacher and student route groups:
 * role guard, pill navbar, user chip, and the page canvas.
 */
export function AppShell({
    role,
    homeHref,
    links,
    actions,
    children,
}: {
    role: "teacher" | "student";
    homeHref: string;
    links: NavLink[];
    actions?: React.ReactNode;
    children: React.ReactNode;
}) {
    const { user, role: userRole, loading } = useSessionStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || userRole !== role)) {
            router.push("/login");
        }
    }, [user, userRole, role, loading, router]);

    if (loading) {
        return <LoadingState className="min-h-dvh" />;
    }

    if (!user || userRole !== role) return null;

    return (
        <div className="min-h-dvh bg-canvas">
            <SiteNav
                homeHref={homeHref}
                links={links}
                right={
                    <>
                        {actions}
                        <span
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-fg-subtle px-2.5 py-1 rounded-full border border-line bg-surface-2 max-w-[14rem] truncate"
                            title={user.email ?? undefined}
                        >
                            <span className="size-1.5 rounded-full bg-accent shrink-0" />
                            <span className="truncate">{user.email}</span>
                        </span>
                        <button
                            onClick={() => useSessionStore.getState().logout().then(() => router.push("/login"))}
                            aria-label="Sign out"
                            title="Sign out"
                            className="size-8 flex items-center justify-center rounded-full text-fg-subtle hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                            <LogOut className="size-4" />
                        </button>
                    </>
                }
            />
            {children}
        </div>
    );
}
