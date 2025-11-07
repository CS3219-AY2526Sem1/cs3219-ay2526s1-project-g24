"use client";

/**
 * Utilities for persisting active collaboration session metadata.
 * Stores the session info in both sessionStorage (for immediate flows) and
 * localStorage (to survive tab closures and browser restarts).
 */

const ACTIVE_SESSION_STORAGE_KEY = "peerprep.activeSession";
const SESSION_STORAGE_SESSION_ID_KEY = "sessionId";
const SESSION_STORAGE_QUESTION_ID_KEY = "questionId";

export interface ActiveSessionState {
  sessionId: string;
  questionId?: string;
  storedAt: number;
}

const isBrowser = typeof window !== "undefined";

const safeParse = (value: string | null): ActiveSessionState | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as ActiveSessionState | null;
    if (parsed && typeof parsed.sessionId === "string") {
      return {
        sessionId: parsed.sessionId,
        questionId: parsed.questionId,
        storedAt: parsed.storedAt ?? Date.now(),
      };
    }
  } catch (error) {
    console.warn("[ActiveSession] Failed to parse stored session payload:", error);
  }

  return null;
};

const writeSessionStorage = (sessionId: string, questionId?: string) => {
  if (!isBrowser) {
    return;
  }

  sessionStorage.setItem(SESSION_STORAGE_SESSION_ID_KEY, sessionId);
  if (questionId) {
    sessionStorage.setItem(SESSION_STORAGE_QUESTION_ID_KEY, questionId);
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_QUESTION_ID_KEY);
  }
};

/**
 * Persist the active collaboration session to both localStorage and sessionStorage.
 */
export const persistActiveSession = (
  sessionId: string,
  questionId?: string | number | null,
) => {
  if (!isBrowser) {
    return;
  }

  const normalizedQuestionId =
    typeof questionId === "number"
      ? String(questionId)
      : questionId ?? undefined;

  const existing = getActiveSessionFromLocalStorage();
  const resolvedQuestionId =
    normalizedQuestionId ??
    (existing?.sessionId === sessionId ? existing.questionId : undefined);

  const payload: ActiveSessionState = {
    sessionId,
    ...(resolvedQuestionId ? { questionId: resolvedQuestionId } : {}),
    storedAt: Date.now(),
  };

  try {
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[ActiveSession] Failed to persist session to localStorage:", error);
  }

  writeSessionStorage(sessionId, resolvedQuestionId);
};

/**
 * Remove any persisted active session information.
 */
export const clearActiveSession = () => {
  if (!isBrowser) {
    return;
  }

  localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_SESSION_ID_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_QUESTION_ID_KEY);
};

/**
 * Read the active session information from localStorage.
 */
export function getActiveSessionFromLocalStorage(): ActiveSessionState | null {
  if (!isBrowser) {
    return null;
  }

  const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
  return safeParse(raw);
}

/**
 * Ensure sessionStorage is populated with the session information stored in localStorage.
 * Useful before navigating to pages that expect sessionStorage values.
 */
export const hydrateSessionStorageFromLocal = () => {
  if (!isBrowser) {
    return;
  }

  const activeSession = getActiveSessionFromLocalStorage();
  if (!activeSession) {
    return;
  }

  writeSessionStorage(activeSession.sessionId, activeSession.questionId);
};

/**
 * Retrieve the active session ID from either sessionStorage (preferred) or localStorage.
 */
export const getActiveSessionId = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  const sessionId = sessionStorage.getItem(SESSION_STORAGE_SESSION_ID_KEY);
  if (sessionId) {
    return sessionId;
  }

  const local = getActiveSessionFromLocalStorage();
  return local?.sessionId ?? null;
};

/**
 * Retrieve the active question ID from either sessionStorage or localStorage.
 */
export const getActiveQuestionId = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  const questionId = sessionStorage.getItem(SESSION_STORAGE_QUESTION_ID_KEY);
  if (questionId) {
    return questionId;
  }

  const local = getActiveSessionFromLocalStorage();
  return local?.questionId ?? null;
};
