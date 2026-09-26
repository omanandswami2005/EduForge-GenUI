"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EduForgeLogo } from "@/components/shared/EduForgeLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

export interface NavLink {
    href: string;
    label: string;
    /** Match nested routes too (default true, except for "/") */
    matchPrefix?: boolean;
}

/**
 * The floating pill navbar from the landing page, shared by every surface
 * (landing, teacher, student) so the app reads as one product.
 */
export function SiteNav({
    homeHref = "/",
    links = [],
    right,
}: {
    homeHref?: string;
    links?: NavLink[];
    right?: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (l: NavLink) => {
        if (l.href.startsWith("#")) return false;
        if (l.matchPrefix === false || l.href === "/") return pathname === l.href;
        return pathname === l.href || pathname.startsWith(`${l.href}/`);
    };
    // Only the most specific matching link is highlighted (/lessons vs /lessons/new)
    const active = links.filter(isActive).sort((a, b) => b.href.length - a.href.length)[0];

    return (
        <div className="sticky top-0 z-50 pt-3 sm:pt-4 px-4 sm:px-6">
            <nav className="max-w-6xl mx-auto rounded-full bg-surface/90 backdrop-blur-md border border-line pl-4 pr-2 py-1.5 flex items-center justify-between gap-3 shadow-2xl shadow-black/10">
                <Link href={homeHref} className="hover:opacity-90 transition-opacity shrink-0">
                    <EduForgeLogo size={24} />
                </Link>

                {links.length > 0 && (
                    <div className="hidden md:flex items-center gap-1 text-xs font-mono">
                        {links.map((l) => {
                            const cls = cn(
                                "px-3 py-1.5 rounded-full transition-colors",
                                l === active ? "text-accent bg-accent/10" : "text-fg-subtle hover:text-fg",
                            );
                            return l.href.startsWith("#") ? (
                                <a key={l.href} href={l.href} className={cls}>
                                    {l.label}
                                </a>
                            ) : (
                                <Link key={l.href} href={l.href} className={cls}>
                                    {l.label}
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <ThemeToggle />
                    {right}
                </div>
            </nav>

            {/* Compact link row for small screens */}
            {links.length > 0 && (
                <div className="md:hidden max-w-6xl mx-auto mt-2 flex items-center gap-1 overflow-x-auto text-xs font-mono">
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={cn(
                                "px-3 py-1.5 rounded-full border whitespace-nowrap",
                                l === active
                                    ? "text-accent bg-accent/10 border-accent/30"
                                    : "text-fg-subtle border-line bg-surface/80",
                            )}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
