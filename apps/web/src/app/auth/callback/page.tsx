// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated OAuth callback page:
//   - Handle OAuth redirect after Google authentication
//   - Check for user onboarding completion
//   - Redirect new users to onboarding
//   - Redirect returning users to intended destination
//   - Post-login redirect with sessionStorage
//   - Loading state during authentication check
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added proficiency check for onboarding flow
//   - Enhanced redirect logic

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/signin");
      return;
    }

    // If user has not set proficiency, redirect to onboarding
    if (!user.programming_proficiency) {
      router.replace("/onboarding");
      return;
    }

    // Check for post-login redirect for returning users
    const redirect =
      typeof window !== "undefined"
        ? sessionStorage.getItem("postLoginRedirect")
        : null;

    // Redirect accordingly
    if (redirect) {
      // Clear the stored redirect after using it
      sessionStorage.removeItem("postLoginRedirect");
      router.replace(redirect);
    } else {
      router.replace("/home");
    }
  }, [user, loading, router]);

  return <LoadingSpinner message="Signing you in..." />;
}