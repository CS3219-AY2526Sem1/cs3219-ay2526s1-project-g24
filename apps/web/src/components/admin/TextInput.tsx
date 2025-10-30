import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function TextInput({ label, className = "", ...props }: TextInputProps) {
    return (
        <div>
            {label && (
                <label className="block font-montserrat text-black text-sm font-medium mb-3">
                    {label}
                </label>
            )}
            <input
                type="text"
                className={`w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors ${className}`}
                {...props}
            />
        </div>
    );
}
