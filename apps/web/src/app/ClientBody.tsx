// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated client-side body wrapper:
//   - Client component for global UI setup
//   - Dark mode enforcement
//   - ServerErrorHandler integration
//   - Global background color application
// Author review: Code reviewed, tested, and validated by team.

"use client";

import { useEffect } from "react";
import { ServerErrorHandler } from "@/components/ServerErrorHandler";

export default function ClientBody({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.body.className = "antialiased min-h-screen bg-[#333232]";
    }, []);

    return (
        <div className="antialiased min-h-screen bg-[#333232]">
            {children}
            <ServerErrorHandler />
        </div>
    );
}
