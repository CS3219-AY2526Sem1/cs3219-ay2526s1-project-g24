import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  getGoogleSignInUrl,
  logoutUser,
} from "@/lib/api/userService";
import { User } from "@/lib/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setUser(null);
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

  const isAdmin = useMemo(() => {
    return (
      user?.roles?.some((role) => role.name?.toLowerCase() === "admin") ?? false
    );
  }, [user]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return { user, loading, isAdmin, login, logout, checkSession };
};
