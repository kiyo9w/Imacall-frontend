'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Loader2 } from 'lucide-react'; // More explicit loading indicator

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    // If not loading and no user is authenticated, redirect to login
    // Preserve the intended destination in the redirect query parameter
    if (!loading && !user) {
       console.log("Redirecting to login from:", pathname); // Debug log
       const loginPath = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginPath);
    }
     // Debug log for user state changes
     // console.log("ProtectedRoute Effect:", { loading, user, pathname });
  }, [user, loading, router, pathname]); // Add pathname to dependency array

  // If loading, show a full-page loading indicator
  if (loading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]"> {/* Adjust height as needed */}
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        // <div className="space-y-4 p-4">
        //     <Skeleton className="h-8 w-1/4" />
        //     <Skeleton className="h-4 w-1/2" />
        //     <Skeleton className="h-4 w-1/3" />
        //      <div className="flex space-x-4 mt-4">
        //        <Skeleton className="h-10 w-24" />
        //        <Skeleton className="h-10 w-24" />
        //      </div>
        // </div>
    );
  }

  // If user is authenticated (and not loading), render the children components
  if (user) {
    return <>{children}</>;
  }

  // If not loading and no user (should be redirecting, but return null as fallback)
   // Render nothing while redirecting
  return null;
};

export default ProtectedRoute;
