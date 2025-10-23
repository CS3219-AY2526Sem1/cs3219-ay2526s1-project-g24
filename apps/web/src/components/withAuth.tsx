"use client";

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from './spinner';

export function withAdminAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  function WithAdminAuth(props: P) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || !isAdmin)) {
        router.replace("/signin");
      }
    }, [user, loading, isAdmin, router]);

    if (loading) {
      return <Spinner />;
    }
    return user && isAdmin ? <WrappedComponent {...props} /> : null;
  }
  return WithAdminAuth;
}

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  function WithAuth(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/signin');
      }
    }, [user, loading, router]);

    if (loading) {
      return <Spinner />;
    }

    return user ? <WrappedComponent {...props} /> : null;
  }

  return WithAuth;
}
