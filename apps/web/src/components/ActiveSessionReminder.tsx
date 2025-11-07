"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  collaborationService,
  type CollaborationSessionStatus,
} from "@/lib/api/collaborationService";
import {
  type ActiveSessionState,
  clearActiveSession,
  getActiveSessionFromLocalStorage,
  hydrateSessionStorageFromLocal,
  persistActiveSession,
} from "@/components/session/activeSession";

const STORAGE_KEY = "peerprep.activeSession";

type ReminderStatus = CollaborationSessionStatus | "UNKNOWN" | "UNAVAILABLE";

interface ReminderState extends ActiveSessionState {
  questionId?: string;
  status: ReminderStatus;
}

/**
 * Displays a global reminder prompting the user to rejoin an active collaboration session.
 * The reminder checks localStorage for a stored session ID, verifies it with the collaboration
 * service, and renders a CTA to rejoin from anywhere in the app.
 */
export default function ActiveSessionReminder() {
  const router = useRouter();
  const pathname = usePathname();
  const [reminder, setReminder] = useState<ReminderState | null>(null);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(
    null,
  );
  const isCheckingRef = useRef(false);

  const shouldSkipForPath = pathname?.startsWith("/collaborative-coding") ?? false;

  const evaluateActiveSession = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (shouldSkipForPath) {
      setReminder(null);
      return;
    }

    const stored = getActiveSessionFromLocalStorage();
    if (!stored?.sessionId) {
      setReminder(null);
      return;
    }

    if (dismissedSessionId === stored.sessionId) {
      setReminder(null);
      return;
    }

    if (isCheckingRef.current) {
      return;
    }
    isCheckingRef.current = true;

    try {
      const session = await collaborationService.rejoinSession(stored.sessionId);
      // Ensure we keep the latest question ID in storage for reconnect flow.
      const questionId = stored.questionId ?? session.questionId;
      persistActiveSession(stored.sessionId, questionId);
      setReminder({
        sessionId: stored.sessionId,
        questionId,
        storedAt: stored.storedAt,
        status: session.status,
      });
    } catch (error: any) {
      const status = error?.status as number | undefined;
      console.warn(
        "[ActiveSessionReminder] Failed to verify session",
        stored.sessionId,
        { status, error },
      );
      setReminder(null);
    } finally {
      isCheckingRef.current = false;
    }
  }, [dismissedSessionId, shouldSkipForPath]);

  useEffect(() => {
    evaluateActiveSession();
  }, [evaluateActiveSession]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        evaluateActiveSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [evaluateActiveSession]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        evaluateActiveSession();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [evaluateActiveSession]);

  if (
    !reminder ||
    reminder.sessionId === dismissedSessionId ||
    reminder.status !== "ACTIVE"
  ) {
    return null;
  }

  const handleReconnect = () => {
    hydrateSessionStorageFromLocal();
    router.push("/collaborative-coding");
  };

  const handleDismiss = () => {
    setDismissedSessionId(reminder.sessionId);
  };

  const handleClear = () => {
    clearActiveSession();
    setReminder(null);
  };

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
