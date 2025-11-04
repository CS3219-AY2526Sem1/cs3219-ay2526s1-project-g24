'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

export function withAdminAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  function WithAdminAuth(props: P) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || !isAdmin)) {
        router.replace('/signin');
      }
    }, [user, loading, isAdmin, router]);

    if (loading) {
      return <LoadingSpinner message="Loading..." />;
    }
    return user && isAdmin ? <WrappedComponent {...props} /> : null;
  }
  return WithAdminAuth;
}

export default function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  function WithAuth(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/signin');
      }
    }, [user, loading, router]);

    if (loading) {
      return <LoadingSpinner message="Loading..." />;
    }

    return user ? <WrappedComponent {...props} /> : null;
  }

  return WithAuth;
}
