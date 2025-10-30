import { Suspense } from "react";
import AdminLoginComponent from "@/components/admin/AdminLoginComponent";

export default function AdminLogin() {
  return (
    <Suspense>
      <AdminLoginComponent />
    </Suspense>
  );
}
