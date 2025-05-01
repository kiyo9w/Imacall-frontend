import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';
// FirebaseProvider is no longer used
// import { FirebaseProvider } from '@/contexts/FirebaseContext'; // Import FirebaseProvider

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Configure Inter font

export const metadata: Metadata = {
  title: 'Imacall', // Updated App Name
  description: 'Create, discover, and interact with AI characters.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is often needed when using themes/dark mode
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`font-sans flex flex-col min-h-screen antialiased`}> {/* Simplified classes */}
        {/* Remove FirebaseProvider wrapper */}
        <AuthProvider> {/* Wrap with AuthProvider */}
          <Header />
          {/* flex-1 ensures main content pushes footer down */}
          <main className="flex-grow flex flex-col container mx-auto px-4 py-8">
            {children}
          </main>
          {/* Optional: Add a simple footer */}
          <footer className="py-4 text-center text-xs text-muted-foreground border-t bg-card">
            © {new Date().getFullYear()} Imacall. All rights reserved.
          </footer>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
