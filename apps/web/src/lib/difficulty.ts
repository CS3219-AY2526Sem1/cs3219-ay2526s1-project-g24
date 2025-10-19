export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export function getDifficultyStyles(difficulty: Difficulty | string): string {
    switch (difficulty) {
        case 'EASY':
            return 'bg-difficulty-easy-bg text-difficulty-easy-text';
        case 'MEDIUM':
            return 'bg-difficulty-medium-bg text-difficulty-medium-text';
        case 'HARD':
            return 'bg-difficulty-hard-bg text-difficulty-hard-text';
        default:
            return 'bg-gray-700 text-gray-400';
    }
}
