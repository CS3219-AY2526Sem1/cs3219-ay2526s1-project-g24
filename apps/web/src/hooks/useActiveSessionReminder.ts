"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
    collaborationService,
    type CollaborationSessionStatus,
} from "@/lib/api/collaborationService";
import {
    type ActiveSessionState,
    clearActiveSession,
    getActiveSessionFromLocalStorage,
    persistActiveSession,
} from "@/components/session/activeSession";

const STORAGE_KEY = "peerprep.activeSession";
const REPEAT_INTERVAL_MS = 5 * 1000; // 5 seconds

type ReminderStatus = CollaborationSessionStatus | "UNKNOWN" | "UNAVAILABLE";

interface ReminderState extends ActiveSessionState {
    questionId?: string;
    status: ReminderStatus;
}

/**
 * Hook to manage the logic for the active session reminder.
 *
 * It checks for an active session, verifies its status, and provides state and handlers
 * for displaying a reminder to the user. It polls periodically and also reacts to
 * browser visibility and storage events.
 */
export function useActiveSessionReminder() {
    const pathname = usePathname();
    const [reminder, setReminder] = useState<ReminderState | null>(null);
    const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(
        null,
    );
    const isCheckingRef = useRef(false);

    const shouldSkipForPath =
        pathname?.startsWith("/collaborative-coding") ?? false;

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

            // Clear stale session data for non-recoverable errors
            if (status === 404 || status === 403 || status === 400) {
                console.log(
                    "[ActiveSessionReminder] Session no longer valid, clearing storage",
                    { status }
                );
                clearActiveSession();
            }

            setReminder(null);
        } finally {
            isCheckingRef.current = false;
        }
    }, [dismissedSessionId, shouldSkipForPath]);

    // Periodically check for the session status
    useEffect(() => {
        evaluateActiveSession();
        const interval = setInterval(evaluateActiveSession, REPEAT_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [evaluateActiveSession]);

    // Re-evaluate when the page becomes visible
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
        return () =>
            document.removeEventListener("visibilitychange", handleVisibility);
    }, [evaluateActiveSession]);

    // Re-evaluate when storage changes (e.g., in another tab)
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

    const handleDismiss = () => {
        if (reminder) {
            setDismissedSessionId(reminder.sessionId);
        }
    };

    const handleClear = () => {
        clearActiveSession();
        setReminder(null);
    };

    const shouldShow =
        reminder?.status === "ACTIVE" && reminder.sessionId !== dismissedSessionId;

    return {
        shouldShow,
        handleDismiss,
        handleClear,
    };
}