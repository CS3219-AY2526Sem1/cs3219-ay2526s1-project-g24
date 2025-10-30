import React from "react";

interface StatCardProps {
    label: string;
    value: number | string;
    className?: string;
}

export default function StatCard({ label, value, className = "" }: StatCardProps) {
    return (
        <div className={`bg-gray-50 border border-gray-200 rounded-2xl p-6 ${className}`}>
            <h3 className="font-montserrat text-gray-500 text-sm mb-2">{label}</h3>
            <p className="font-montserrat text-black text-4xl font-semibold">{value}</p>
        </div>
    );
}
