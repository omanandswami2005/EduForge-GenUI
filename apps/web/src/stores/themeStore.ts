import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
    theme: Theme;
    toggle: () => void;
    init: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
    // Dark is the brand default; the inline script in app/layout.tsx applies
    // the same rule before hydration so there's no flash.
    theme: "dark",

    toggle: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
        localStorage.setItem("eduforge-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
    },

    init: () => {
        const stored = localStorage.getItem("eduforge-theme") as Theme | null;
        const theme: Theme = stored === "light" ? "light" : "dark";
        set({ theme });
        document.documentElement.classList.toggle("dark", theme === "dark");
    },
}));
