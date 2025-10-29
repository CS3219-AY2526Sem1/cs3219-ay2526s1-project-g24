"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getGoogleSignInUrl } from "../../lib/api/userService";

export default function AdminLoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleGoogleSignIn = async () => {
    try {
      const url = await getGoogleSignInUrl();
      // Always store a redirect, default to /admin
      const redirectTarget = redirect || "/admin";
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f5] via-[#e8e8e8] to-[#d4d4d4]"></div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/liquid_green_purple.png"
              alt="Liquid green purple background"
              fill
              className="object-cover object-top-left scale-[1.65] origin-top-left hover:scale-[1.68] transition-transform duration-700 ease-in-out opacity-20"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-2/3 bg-white flex items-center justify-center relative min-h-screen md:min-h-0">
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <h1 className="font-mclaren text-gray-400 text-2xl text-center">
            PeerPrep Admin
          </h1>
        </div>

        <div className="max-w-md w-full px-6 md:px-8">
          <div className="text-center mb-6">
            <h1 className="font-montserrat text-3xl md:text-5xl font-semibold text-black mb-4 leading-tight">
              Admin Portal
            </h1>
          </div>

          <div className="text-center mb-12">
            <p className="font-montserrat text-black text-base">
              Administrator access only
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-black hover:bg-gray-800 text-white font-montserrat font-medium text-sm py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-lg"
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

          <div className="text-center">
            <Link
              href="/signin"
              className="font-montserrat text-sm text-gray-500 hover:text-black transition-colors"
            >
              Return to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
