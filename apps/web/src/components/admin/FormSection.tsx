import React from "react";

interface FormSectionProps {
    children: React.ReactNode;
    className?: string;
}

export default function FormSection({ children, className = "" }: FormSectionProps) {
    return (
        <div className={`bg-gray-50 border border-gray-200 rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    );
}
