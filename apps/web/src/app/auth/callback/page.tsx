"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
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

  return <Spinner text="Signing you in..." />;
}