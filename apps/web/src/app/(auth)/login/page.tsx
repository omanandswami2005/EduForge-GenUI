"use client";

import { useState } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { AuthShell } from "@/components/shared/AuthShell";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const login = useSessionStore((s) => s.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            const { role } = useSessionStore.getState();
            if (!role) {
                setError("Account setup incomplete. Please register again.");
                return;
            }
            // Use full navigation to bypass Next.js router cache — ensures
            // the server always receives the fresh auth cookie
            window.location.href = role === "teacher" ? "/dashboard" : "/learn";
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Welcome back"
            title="Sign in to EduForge"
            footer={
                <>
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-accent hover:underline">
                        Register
                    </Link>
                </>
            }
        >
            {error && <Alert className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="w-full">
                    {loading ? "Signing in..." : "Sign In"}
                </Button>
            </form>
        </AuthShell>
    );
}
