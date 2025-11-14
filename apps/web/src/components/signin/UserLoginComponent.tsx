// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated user login component:
//   - Google OAuth sign-in button
//   - Gradient background with animated image
//   - Post-login redirect handling with sessionStorage
//   - Integration with User Service for OAuth URL
//   - Responsive design for mobile and desktop
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced visual design with animations
//   - Added redirect parameter support

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getGoogleSignInUrl } from "@/lib/api/userService";

export default function UserLoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleGoogleSignIn = async () => {
    try {
      const url = await getGoogleSignInUrl();
      // Always store a redirect, default to /home
      const redirectTarget = redirect || "/home";
      sessionStorage.setItem("postLoginRedirect", redirectTarget);
      router.push(url);
    } catch (error) {
      console.error("Failed to get Google Sign-In URL", error);
      // Handle error
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 h-64 md:h-auto relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f4f4a8] via-[#c9b4f4] to-[#8a9ef4]"></div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/liquid_green_purple.png"
              alt="Liquid green purple background"
              fill
              className="object-cover object-top-left scale-[1.65] origin-top-left hover:scale-[1.68] transition-transform duration-700 ease-in-out"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-2/3 bg-[#3d3d3d] flex items-center justify-center relative min-h-screen md:min-h-0">
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <Link href="/landing">
            <h1 className="font-mclaren text-[#9e9e9e] text-2xl cursor-pointer hover:text-white transition-colors text-center">
              PeerPrep
            </h1>
          </Link>
        </div>

        <div className="max-w-md w-full px-6 md:px-8">
          <div className="text-center mb-6">
            <h1 className="font-montserrat text-3xl md:text-5xl font-semibold text-white mb-4 leading-tight">
              Achieve goal, together ✦
            </h1>
          </div>

          <div className="text-center mb-12">
            <p className="font-montserrat text-white text-base">
              Sign in to start your practice sessions
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="glow-button secondary-glow w-full bg-[#2d2d2d] hover:bg-[#404040] text-white font-montserrat font-medium text-sm py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all border border-white/10 hover:scale-[1.02] hover:shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
