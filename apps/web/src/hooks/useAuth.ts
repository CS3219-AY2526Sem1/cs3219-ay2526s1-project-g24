
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getGoogleSignInUrl, logoutUser, User } from '../lib/user.service';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkSession = useCallback(async () => {
        setLoading(true);
        try {
            const session = await getSession();
            setUser(session);
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
            router.push('/signin');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return { user, loading, login, logout, checkSession };
};
