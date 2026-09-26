"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggle } = useThemeStore();

    return (
        <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
                "size-8 flex items-center justify-center rounded-full text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors",
                className,
            )}
        >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
    );
}
