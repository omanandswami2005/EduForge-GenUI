import type { Metadata } from "next";
import "./globals.css";

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
            <body className="antialiased">{children}</body>
        </html>
    );
}
