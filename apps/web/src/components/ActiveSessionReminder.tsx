// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated active session reminder component:
//   - Persistent reminder for active collaboration sessions
//   - Rejoin session functionality
//   - Dismiss and clear session actions
//   - Session state hydration from localStorage
//   - Integration with useActiveSessionReminder hook
//   - Responsive design with glassmorphism UI
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced UX with visual feedback
//   - Added session expiration handling
//   - Optimized storage operations

"use client";

import { useRouter } from "next/navigation";
import { hydrateSessionStorageFromLocal } from "@/components/session/activeSession";
import { useActiveSessionReminder } from "@/hooks/useActiveSessionReminder";

/**
 * Displays a global reminder prompting the user to rejoin an active collaboration session.
 * This component is responsible for rendering the UI of the reminder, while the logic
 * for session detection and state management is handled by the `useActiveSessionReminder` hook.
 */
export default function ActiveSessionReminder() {
  const router = useRouter();
  const { shouldShow, handleDismiss, handleClear } = useActiveSessionReminder();

  const handleReconnect = () => {
    hydrateSessionStorageFromLocal();
    router.push("/collaborative-coding");
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3">
      <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#1f1f1f]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.553.894l3 1.5a1 1 0 10.894-1.788L11 9.382V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Resume your collaboration session
            </p>
            <p className="mt-1 text-xs text-gray-300">
              You still have an ongoing collaboration room. Rejoin to continue
              where you left off.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleReconnect}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] transition-transform hover:scale-105 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Rejoin session
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Remind me later
              </button>
              <button
                onClick={handleClear}
                className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-red-300 focus:outline-none"
              >
                Clear session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
