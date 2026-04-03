import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
    theme: Theme;
    toggle: () => void;
    init: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
    theme: "light",

    toggle: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
        localStorage.setItem("eduforge-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
    },

    init: () => {
        const stored = localStorage.getItem("eduforge-theme") as Theme | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = stored || (prefersDark ? "dark" : "light");
        set({ theme });
        document.documentElement.classList.toggle("dark", theme === "dark");
    },
}));
