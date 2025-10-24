"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TIMER_INTERVAL_MS, TIME_FORMAT } from "@/lib/constants";
import { matchingService } from "@/lib/api/matchingService";
import withAuth from "@/components/withAuth";

function Wait() {
    const router = useRouter();
    const [seconds, setSeconds] = useState(0);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get the match request ID from sessionStorage
        const reqId = sessionStorage.getItem("matchRequestId");
        if (!reqId) {
            // No match request found, redirect back to match page
            router.push("/match");
            return;
        }
        setRequestId(reqId);

        // Subscribe to real-time match updates via SSE
        const cleanup = matchingService.subscribeToMatchEvents(
            reqId,
            (event) => {
                console.log("Match event received:", event);

                if (typeof event.elapsed === "number") {
                    setSeconds(event.elapsed);
                }

                if (event.status === "matched" && event.sessionId) {
                    // Store session ID and redirect to collaborative coding
                    sessionStorage.setItem("sessionId", event.sessionId);
                    router.push("/collaborative-coding");
                } else if (event.status === "timeout") {
                    setError("Match timeout - no partner found");
                    setTimeout(() => router.push("/match"), 3000);
                } else if (event.status === "cancelled") {
                    router.push("/match");
                }
            },
            (error) => {
                console.error("SSE error:", error);
                setError("Connection error - please try again");
            },
        );

        return () => {
            cleanup();
        };
    }, [router]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, TIMER_INTERVAL_MS);

        return () => clearInterval(timer);
    }, []);

    const handleCancel = async () => {
        if (requestId) {
            try {
                const result = await matchingService.cancelMatchRequest(requestId);

                if (result.alreadyMatched) {
                    // Race condition: User was matched right when they clicked cancel
                    console.log("Already matched - redirecting to session");

                    if (result.sessionId) {
                        // Store session ID and redirect to collaborative coding
                        sessionStorage.setItem("sessionId", result.sessionId);
                        sessionStorage.removeItem("matchRequestId");
                        sessionStorage.removeItem("matchUserId");
                        router.push("/collaborative-coding");
                        return;
                    }

                    // If no session ID available, show message and wait for SSE event
                    setError("Match found! Redirecting...");
                    // SSE event handler will redirect when it receives the matched event
                    return;
                }

                // Successfully cancelled
                sessionStorage.removeItem("matchRequestId");
                sessionStorage.removeItem("matchUserId");
                router.push("/match");
            } catch (err) {
                console.error("Failed to cancel match:", err);
                setError("Failed to cancel - please try again");
                // Still redirect after showing error briefly
                setTimeout(() => router.push("/match"), 2000);
            }
        } else {
            router.push("/match");
        }
    };

    return (
        <div className="min-h-screen bg-[#333232] flex flex-col items-center justify-center relative">
            <Link href="/home">
                <h1 className="font-mclaren text-2xl text-[#9e9e9e] absolute top-8 left-1/2 transform -translate-x-1/2 cursor-pointer hover:text-white transition-colors">
                    PeerPrep
                </h1>
            </Link>

            <div className="mb-8">
                <div className="w-24 h-24 border-8 border-[#555555] border-t-[#9e9e9e] rounded-full animate-spin"></div>
            </div>

            {error ? (
                <h2 className="font-montserrat text-3xl font-semibold text-red-400 mb-4">
                    {error}
                </h2>
            ) : (
                <>
                    <h2 className="font-montserrat text-4xl font-semibold text-white mb-4">
                        Finding your coding partner...
                    </h2>

                    <p className="font-montserrat text-white text-lg mb-8">
                        We're matching you with someone at your skill level
                    </p>
                </>
            )}

            <button
                onClick={handleCancel}
                className="glow-button primary-glow bg-white text-[#1e1e1e] px-10 py-3 rounded-full font-montserrat font-medium text-base hover:scale-105 transition-all mb-6"
            >
                Cancel
            </button>

            <p className="font-montserrat text-[#9e9e9e] text-sm">
                wait time {Math.floor(seconds / TIME_FORMAT.SECONDS_PER_MINUTE)}:
                {(seconds % TIME_FORMAT.SECONDS_PER_MINUTE)
                    .toString()
                    .padStart(TIME_FORMAT.PAD_LENGTH, TIME_FORMAT.PAD_CHAR)}
            </p>
        </div>
    );
}

export default withAuth(Wait);
