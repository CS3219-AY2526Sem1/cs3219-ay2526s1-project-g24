// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated difficulty tag component:
//   - Styled tag for question difficulty levels
//   - Dynamic color coding (Easy/Medium/Hard)
//   - Responsive design with Tailwind CSS
//   - Reusable across question displays
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added accessibility attributes
//   - Enhanced visual consistency

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
