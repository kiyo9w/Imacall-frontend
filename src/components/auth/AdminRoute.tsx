'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not loading and no user or user is not superuser, redirect
    if (!loading && (!user || !user.is_superuser)) {
      console.log("AdminRoute: Access denied. Redirecting.");
      // Redirect non-admins, potentially to home or a 'not authorized' page
      router.replace('/'); // Redirect to home for simplicity
    }
  }, [user, loading, router, pathname]);

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated and is a superuser, render the children
  if (user && user.is_superuser) {
    return <>{children}</>;
  }

  // While redirecting or if conditions met before redirect completes, show minimal content or null
  // Or show an explicit "Not Authorized" message if preferred over immediate redirect
  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4">
        <Alert variant="destructive" className="max-w-md mx-auto">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to access this page. Redirecting...
                <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    </div>
  );
};

export default AdminRoute;
