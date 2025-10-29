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
