import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
    title: "EduForge — AI-Powered Adaptive Learning",
    description: "Generative UI meets Bayesian Knowledge Tracing for personalized education",
};

// Runs before first paint so the stored theme applies without a flash.
// Must match useThemeStore.init(): dark unless the user chose light.
const themeScript = `try{if(localStorage.getItem("eduforge-theme")!=="light")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
