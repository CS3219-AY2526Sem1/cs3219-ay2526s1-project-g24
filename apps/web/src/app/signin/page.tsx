// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated sign-in page:
//   - React Suspense wrapper for async authentication
//   - UserLoginComponent integration
// Author review: Code reviewed, tested, and validated by team.

import { Suspense } from "react";
import UserLoginComponent from "@/components/signin/UserLoginComponent";

export default function SignInPage() {
  return (
    <Suspense>
      <UserLoginComponent />
    </Suspense>
  );
}
