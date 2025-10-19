import React from "react";

interface TopicSelectorProps {
    selectedTopics: string[];
    onChange: (topics: string[]) => void;
    availableTopics?: string[];
}

const DEFAULT_TOPICS = [
    "Arrays",
    "Strings",
    "Hash Table",
    "Dynamic Programming",
    "Binary Search",
    "DFS",
    "BFS",
    "Tree",
    "Graph",
    "Sorting",
    "Greedy",
    "Recursion",
    "Backtracking",
    "Linked List",
    "Stack",
    "Queue",
];

export default function TopicSelector({
    selectedTopics,
    onChange,
    availableTopics = DEFAULT_TOPICS,
}: TopicSelectorProps) {
    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            onChange(selectedTopics.filter((t) => t !== topic));
        } else {
            onChange([...selectedTopics, topic]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {availableTopics.map((topic) => (
                <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-4 py-2 font-montserrat text-xs rounded-full transition-colors ${selectedTopics.includes(topic)
                            ? "bg-[#DCC8FE] text-black"
                            : "bg-white text-gray-500 hover:bg-gray-200"
                        }`}
                >
                    {topic}
                </button>
            ))}
        </div>
    );
}
