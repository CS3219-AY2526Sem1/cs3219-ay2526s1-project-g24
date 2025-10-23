import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export default function TextArea({ label, className = "", ...props }: TextAreaProps) {
    return (
        <div>
            {label && (
                <label className="block font-montserrat text-black text-sm font-medium mb-3">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors resize-none ${className}`}
                {...props}
            />
        </div>
    );
}
