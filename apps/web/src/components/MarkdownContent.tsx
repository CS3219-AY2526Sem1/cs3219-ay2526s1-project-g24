import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type MarkdownContentProps = {
    content: string;
    className?: string;
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className }) => {
    if (!content) {
        return null;
    }

    const baseClass = "markdown-content text-gray-300 text-sm leading-relaxed space-y-4";

    type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
        inline?: boolean;
        children?: ReactNode;
        node?: unknown;
    };

    const CodeRenderer = ({ inline, className: codeClassName, children, ...props }: MarkdownCodeProps) => {
        const combinedClassName = codeClassName ? `${codeClassName}` : "";
        const textContent = React.Children.toArray(children)
            .map((child) => (typeof child === "string" ? child : ""))
            .join("")
            .trim();
        const shouldRenderInline = inline || (!textContent.includes("\n") && textContent.length <= 80);

        if (shouldRenderInline) {
            return (
                <code
                    className={`bg-[#1e1e1e] border border-[#3e3e3e] rounded px-1.5 py-0.5 text-xs font-mono inline-block align-middle ${combinedClassName}`.trim()}
                    {...props}
                >
                    {children}
                </code>
            );
        }

        return (
            <pre className="bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg p-4 overflow-x-auto">
                <code className={`font-mono text-xs ${combinedClassName}`.trim()} {...props}>
                    {children}
                </code>
            </pre>
        );
    };

    const components: Components = {
        strong: ({ node, ...props }) => (
            <strong className="text-white font-semibold" {...props} />
        ),
        em: ({ node, ...props }) => (
            <em className="italic text-gray-300" {...props} />
        ),
        a: ({ node, ...props }) => (
            <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
        ),
        ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-2" {...props} />
        ),
        ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2" {...props} />
        ),
        li: ({ node, ...props }) => (
            <li className="ml-4" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-white/20 pl-4 italic text-gray-300" {...props} />
        ),
        code: CodeRenderer,
    };

    return (
        <div className={`${baseClass}${className ? ` ${className}` : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownContent;
