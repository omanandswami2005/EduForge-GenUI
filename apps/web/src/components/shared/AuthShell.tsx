import Link from "next/link";
import { EduForgeLogo } from "@/components/shared/EduForgeLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Card, Eyebrow } from "@/components/ui";

export function AuthShell({
    eyebrow,
    title,
    footer,
    children,
}: {
    eyebrow: string;
    title: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-10">
            <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none -z-10" />
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <Link href="/" className="mb-8 hover:opacity-90 transition-opacity">
                <EduForgeLogo size={28} />
            </Link>

            <Card className="max-w-md w-full p-8 shadow-2xl shadow-black/10">
                <Eyebrow tone="accent" className="mb-1">
                    {eyebrow}
                </Eyebrow>
                <h1 className="text-2xl font-bold tracking-tight text-fg mb-6">{title}</h1>
                {children}
            </Card>

            <p className="mt-6 text-sm text-fg-subtle">{footer}</p>
        </div>
    );
}
