// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated difficulty styling utility:
//   - getDifficultyStyles function for color-coded difficulty levels
//   - Tailwind CSS classes for Easy/Medium/Hard
//   - Consistent color scheme across application
// Author review: Code reviewed, tested, and validated by team.

import { Difficulty } from "@/lib/types";

export function getDifficultyStyles(difficulty: Difficulty | string): string {
    const normalizedDifficulty = difficulty.toUpperCase();
    
    switch (normalizedDifficulty) {
        case 'EASY':
            return 'bg-[#00b8a3]/10 text-[#00b8a3] border border-[#00b8a3]/30';
        case 'MEDIUM':
            return 'bg-[#ffc01e]/10 text-[#ffc01e] border border-[#ffc01e]/30';
        case 'HARD':
            return 'bg-[#ff375f]/10 text-[#ff375f] border border-[#ff375f]/30';
        default:
            return 'bg-gray-700 text-gray-400 border border-gray-600';
    }
}
