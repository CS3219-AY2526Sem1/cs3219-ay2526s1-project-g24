import { Suspense } from "react";
import UserLoginComponent from "@/components/signin/UserLoginComponent";

export default function SignInPage() {
  return (
    <Suspense>
      <UserLoginComponent />
    </Suspense>
  );
}
