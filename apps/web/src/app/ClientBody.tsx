"use client";

import { useEffect } from "react";

export default function ClientBody({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.body.className = "antialiased min-h-screen bg-[#333232]";
    }, []);

    return <div className="antialiased min-h-screen bg-[#333232]">{children}</div>;
}
