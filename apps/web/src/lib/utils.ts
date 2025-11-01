import { MatchingDifficulty, ProficiencyLevel } from "@/lib/types";

export function capitalizeFirstLetter(str: string): string {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Map display difficulty to API difficulty
export const mapDifficultyToApi = (difficulty: ProficiencyLevel): MatchingDifficulty => {
    if (difficulty === ProficiencyLevel.BEGINNER) return 'easy';
    if (difficulty === ProficiencyLevel.INTERMEDIATE) return 'medium';
    if (difficulty === ProficiencyLevel.ADVANCED) return 'hard';
    return "medium"; // Default
};

// Remove example sections from question description
export const removeExamplesFromDescription = (description: string): string => {
    return description.replace(/\*\*Example \d+:\*\*[\s\S]*?(?=\*\*Example \d+:\*\*|$)/g, '').trim();
};