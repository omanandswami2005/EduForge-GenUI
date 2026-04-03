"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MathTextProps {
    children: string;
    className?: string;
    inline?: boolean;
}

/**
 * Renders a string that may contain Markdown and LaTeX math expressions.
 * Inline math: $...$   Display math: $$...$$
 */
export function MathText({ children, className, inline = false }: MathTextProps) {
    const content = children ?? "";

    if (inline) {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Render the whole thing inline — unwrap the surrounding <p>
                    p: ({ children: c }) => <span className={className}>{c}</span>,
                }}
            >
                {content}
            </ReactMarkdown>
        );
    }

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children: c }) => <p className="mb-2 last:mb-0">{c}</p>,
                    strong: ({ children: c }) => <strong className="font-semibold">{c}</strong>,
                    em: ({ children: c }) => <em className="italic">{c}</em>,
                    code: ({ children: c }) => (
                        <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                            {c}
                        </code>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
