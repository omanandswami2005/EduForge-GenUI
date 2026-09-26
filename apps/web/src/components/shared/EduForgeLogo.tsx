import React from "react";

interface LogoProps {
    className?: string;
    size?: number;
    showWordmark?: boolean;
}

export function EduForgeLogo({ className = "", size = 26, showWordmark = true }: LogoProps) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            {/* Modal-style crisp geometric badge */}
            <div className="relative flex items-center justify-center shrink-0">
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transform transition-transform hover:scale-105 duration-200"
                >

                    {/* Dark backing tile — the mark stays dark in both themes */}
                    <rect width="32" height="32" rx="7" fill="#141C16" stroke="#253529" strokeWidth="1.2" />

                    {/* Interlocking geometric E-F / Neuro-Symbolic facets */}
                    {/* Top facet */}
                    <path
                        d="M8 9H24L21 14H11L8 9Z"
                        fill="#34D399"
                    />
                    {/* Middle bar with node */}
                    <path
                        d="M10 16H20L18 20H12L10 16Z"
                        fill="#10B981"
                    />
                    {/* Knowledge Node Anchor */}
                    <circle cx="23" cy="18" r="2" fill="#6EE7B7" />
                    {/* Base foundation line */}
                    <rect x="8" y="22" width="9" height="2.5" rx="1.25" fill="#059669" />
                </svg>
            </div>

            {/* Wordmark */}
            {showWordmark && (
                <div className="flex items-center gap-2 font-mono tracking-tight leading-none">
                    <span className="text-base font-semibold tracking-[-0.03em] text-fg">
                        edu<span className="text-accent">forge</span>
                    </span>
                    <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                        v2.0
                    </span>
                </div>
            )}
        </div>
    );
}
