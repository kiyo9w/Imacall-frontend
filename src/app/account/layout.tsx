import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ReactNode } from 'react';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Optionally add account-specific navigation/sidebar here */}
        {children}
      </div>
    </ProtectedRoute>
  );
}
