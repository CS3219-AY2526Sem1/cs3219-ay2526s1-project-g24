"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return <Spinner text="Signing you in..." />;
}
