// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated authentication HOC components:
//   - withAuth HOC for protected routes
//   - withAdminAuth HOC for admin-only routes
//   - Authentication state checking with useAuth
//   - Automatic redirect to sign-in for unauthenticated users
//   - Loading state handling
//   - Active session reminder integration
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced security with role-based access control
//   - Optimized redirect logic

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import ActiveSessionReminder from './ActiveSessionReminder';

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

    return user ? (
      <>
        <ActiveSessionReminder />
        <WrappedComponent {...props} />
      </>
    ) : null;
  }

  return WithAuth;
}
