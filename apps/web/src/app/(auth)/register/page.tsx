"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Presentation } from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { AuthShell } from "@/components/shared/AuthShell";
import { Alert, Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"teacher" | "student">("student");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const register = useSessionStore((s) => s.register);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(email, password, name, role);
            window.location.href = role === "teacher" ? "/dashboard" : "/learn";
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { value: "teacher" as const, label: "Teacher", hint: "Upload & analyze", Icon: Presentation },
        { value: "student" as const, label: "Student", hint: "Learn adaptively", Icon: GraduationCap },
    ];

    return (
        <AuthShell
            eyebrow="Get started"
            title="Create your EduForge account"
            footer={
                <>
                    Already have an account?{" "}
                    <Link href="/login" className="text-accent hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
            {error && <Alert className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {roles.map(({ value, label, hint, Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setRole(value)}
                                aria-pressed={role === value}
                                className={cn(
                                    "p-3 rounded-lg border text-left transition-colors",
                                    role === value
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-line-strong bg-surface-2 text-fg-muted hover:border-fg-faint",
                                )}
                            >
                                <Icon className="size-5 mb-2" />
                                <div className="text-sm font-semibold">{label}</div>
                                <div className="text-[11px] font-mono text-fg-subtle">{hint}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="w-full">
                    {loading ? "Creating account..." : "Create Account"}
                </Button>
            </form>
        </AuthShell>
    );
}
