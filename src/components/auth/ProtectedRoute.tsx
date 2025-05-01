'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user is authenticated, redirect to login
    if (!loading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, loading, router]);

  // If loading, show a loading indicator (e.g., skeleton)
  if (loading) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
             <div className="flex space-x-4 mt-4">
               <Skeleton className="h-10 w-24" />
               <Skeleton className="h-10 w-24" />
             </div>
        </div>
    );
  }

  // If user is authenticated, render the children components
  if (user) {
    return <>{children}</>;
  }

  // If not loading and no user (should be redirecting, but return null as fallback)
  return null;
};

export default ProtectedRoute;
