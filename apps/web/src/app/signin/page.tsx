import { Suspense } from "react";
import SignIn from "@/components/signin/signIn";

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
