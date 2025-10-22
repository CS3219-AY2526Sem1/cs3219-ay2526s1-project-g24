"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Check for post-login redirect
    const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('postLoginRedirect') : null;

    // Redirect accordingly
    if (redirect) {
      // Clear the stored redirect after using it
      sessionStorage.removeItem('postLoginRedirect');
      router.replace(redirect);
    } else {
      router.replace("/home");
    }
  }, [router]);

  return <Spinner text="Signing you in..." />;
}
