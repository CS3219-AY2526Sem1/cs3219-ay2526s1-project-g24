import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  getGoogleSignInUrl,
  logoutUser,
} from "@/lib/api/userService";
import { User } from "@/lib/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session?.user) {
        const derivedRole = session.isAdmin ? "admin" : "user";
        const userWithRole: User = {
          ...session.user,
          role: session.user.role ?? derivedRole,
        };
        setUser(userWithRole);
        setIsAdmin(session.isAdmin || userWithRole.role === "admin");
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    try {
      const url = await getGoogleSignInUrl();
      router.push(url);
    } catch (error) {
      console.error("Failed to get Google Sign-In URL", error);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push("/signin");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return { user, loading, isAdmin, login, logout, checkSession };
};
