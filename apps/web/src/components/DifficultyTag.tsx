import { ReactNode } from "react";

import { getDifficultyStyles } from "@/lib/difficulty";

type DifficultyTagProps = {
    difficulty: string;
    className?: string;
    children?: ReactNode;
};

const BASE_CLASSES =
    "font-montserrat text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-[0.08em]";

export default function DifficultyTag({
    difficulty,
    className = "",
    children,
}: DifficultyTagProps) {
    return (
        <span className={`${BASE_CLASSES} ${getDifficultyStyles(difficulty)} ${className}`.trim()}>
            {children ?? difficulty}
        </span>
    );
}
