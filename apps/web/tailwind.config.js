/** @type {import('tailwindcss').Config} */

// Every color resolves to a CSS variable defined in src/app/globals.css,
// so light/dark switching happens in one place and classes need no `dark:`.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                canvas: token("canvas"),
                surface: {
                    DEFAULT: token("surface"),
                    2: token("surface-2"),
                    3: token("surface-3"),
                },
                line: {
                    DEFAULT: token("line"),
                    strong: token("line-strong"),
                },
                fg: {
                    DEFAULT: token("fg"),
                    muted: token("fg-muted"),
                    subtle: token("fg-subtle"),
                    faint: token("fg-faint"),
                },
                accent: {
                    DEFAULT: token("accent"),
                    hover: token("accent-hover"),
                    fg: token("accent-fg"),
                },
                success: token("success"),
                info: token("info"),
                warning: token("warning"),
                danger: token("danger"),
                violet: token("violet"),
            },
            fontFamily: {
                sans: [
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
                mono: [
                    "ui-monospace",
                    "SFMono-Regular",
                    "SF Mono",
                    "Menlo",
                    "Consolas",
                    "Liberation Mono",
                    "monospace",
                ],
            },
            borderColor: {
                DEFAULT: token("line"),
            },
        },
    },
    plugins: [],
};
