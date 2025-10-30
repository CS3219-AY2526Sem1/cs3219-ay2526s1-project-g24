import { ProficiencyLevel, ProgrammingLanguage } from "@/lib/types";

export const TIMER_INTERVAL_MS = 1000;

export const EDITOR_CONFIG = {
    FONT_SIZE: 14,
    TAB_SIZE: 4,
    LINE_DECORATIONS_WIDTH: 10,
    LINE_NUMBERS_MIN_CHARS: 3,
} as const;

export const LAYOUT_DEFAULTS = {
    LEFT_PANEL_WIDTH_PERCENT: 40,
    CODE_HEIGHT_PERCENT: 60,
    MIN_PANEL_WIDTH_PERCENT: 20,
    MAX_PANEL_WIDTH_PERCENT: 80,
    MIN_PANEL_HEIGHT_PERCENT: 30,
    MAX_PANEL_HEIGHT_PERCENT: 80,
} as const;

export const TIME_FORMAT = {
    SECONDS_PER_MINUTE: 60,
    PAD_LENGTH: 2,
    PAD_CHAR: '0',
} as const;

export const ALL_PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
    ProgrammingLanguage.CPP,
    ProgrammingLanguage.JAVA,
    ProgrammingLanguage.PYTHON,
    ProgrammingLanguage.JAVASCRIPT,
]

export const ALL_PROFICIENCY_LEVELS: ProficiencyLevel[] = [
    ProficiencyLevel.BEGINNER,
    ProficiencyLevel.INTERMEDIATE,
    ProficiencyLevel.ADVANCED,
];

export const DIFFICULTY_OPTIONS = [
    {
        level: ProficiencyLevel.BEGINNER,
        tag: 'EASY',
        description: 'Perfect for getting started with fundamentals',
        display: 'Beginner\nLevel',
    },
    {
        level: ProficiencyLevel.INTERMEDIATE,
        tag: 'MEDIUM',
        description: 'Build deeper understanding and skills',
        display: 'Intermediate\nLevel',
    },
    {
        level: ProficiencyLevel.ADVANCED,
        tag: 'HARD',
        description: 'Master the most challenging problems',
        display: 'Expert\nLevel',
    },
] as const;

export const LANGUAGE_OPTIONS = [
    {
        name: ProgrammingLanguage.CPP,
        display: 'C++',
        icon: '/c-.png',
    },
    {
        name: ProgrammingLanguage.JAVA,
        display: 'Java',
        icon: '/java.png',
    },
    {
        name: ProgrammingLanguage.PYTHON,
        display: 'Python',
        icon: '/python.png',
    },
    {
        name: ProgrammingLanguage.JAVASCRIPT,
        display: 'JavaScript',
        icon: '/js.png',
    },
] as const;