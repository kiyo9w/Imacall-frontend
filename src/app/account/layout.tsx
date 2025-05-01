import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ReactNode } from 'react';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      {/* Use flex-1 to ensure it takes available space if needed */}
      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {children}
      </div>
    </ProtectedRoute>
  );
}
