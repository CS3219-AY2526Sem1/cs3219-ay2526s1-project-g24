export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export function getDifficultyStyles(difficulty: Difficulty | string): string {
    switch (difficulty) {
        case 'EASY':
            return 'bg-[#4a5a3a] text-[#a8d08d]';
        case 'MEDIUM':
            return 'bg-[#5a4a3a] text-[#f4b942]';
        case 'HARD':
            return 'bg-[#5a3a3a] text-[#f4a2a2]';
        default:
            return 'bg-gray-700 text-gray-400';
    }
}
