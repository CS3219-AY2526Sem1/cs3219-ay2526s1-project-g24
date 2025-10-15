"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Wait() {
    const router = useRouter();
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (seconds >= 5) {
            router.push("/collaborative-coding");
        }
    }, [seconds, router]);

    const handleCancel = () => {
        router.push("/match");
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

            <h2 className="font-montserrat text-4xl font-semibold text-white mb-4">
                Finding your coding partner...
            </h2>

            <p className="font-montserrat text-white text-lg mb-8">
                We're matching you with someone at your skill level
            </p>

            <button
                onClick={handleCancel}
                className="glow-button primary-glow bg-white text-[#1e1e1e] px-10 py-3 rounded-full font-montserrat font-medium text-base hover:scale-105 transition-all mb-6"
            >
                Cancel
            </button>

            <p className="font-montserrat text-[#9e9e9e] text-sm">
                wait time {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
            </p>
        </div>
    );
}
