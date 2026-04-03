import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
    title: "EduForge — AI-Powered Adaptive Learning",
    description: "Generative UI meets Bayesian Knowledge Tracing for personalized education",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
