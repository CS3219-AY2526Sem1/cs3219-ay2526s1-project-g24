import React from "react";

interface DifficultySelectorProps {
    value: "EASY" | "MEDIUM" | "HARD";
    onChange: (difficulty: "EASY" | "MEDIUM" | "HARD") => void;
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
    const difficulties: ("EASY" | "MEDIUM" | "HARD")[] = ["EASY", "MEDIUM", "HARD"];

    return (
        <div className="flex gap-3">
            {difficulties.map((level) => (
                <button
                    key={level}
                    type="button"
                    onClick={() => onChange(level)}
                    className={`px-6 py-2 font-montserrat text-sm rounded-full transition-colors ${value === level
                            ? "bg-[#DCC8FE] text-black"
                            : "bg-white text-black hover:bg-gray-200"
                        }`}
                >
                    {level}
                </button>
            ))}
        </div>
    );
}
