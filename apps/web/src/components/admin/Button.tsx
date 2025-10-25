import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    children: React.ReactNode;
}

export default function Button({
    variant = "primary",
    children,
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles = "px-6 py-3 font-montserrat font-medium text-sm rounded-full transition-all";

    const variantStyles = {
        primary: "bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black",
        secondary: "bg-gray-200 hover:bg-gray-300 text-black",
        danger: "bg-red-500 hover:bg-red-600 text-white",
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
