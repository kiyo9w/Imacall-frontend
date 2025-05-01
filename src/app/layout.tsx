import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { FirebaseProvider } from '@/contexts/FirebaseContext'; // Added FirebaseProvider

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
    <html lang="en" className={inter.variable}> {/* Apply font variable to html tag */}
      {/* Removed whitespace here */}
      <body className={`antialiased font-sans flex flex-col min-h-screen`}> {/* Use font-sans */}
        <FirebaseProvider> {/* Wrap with FirebaseProvider */}
          <AuthProvider> {/* Wrap with AuthProvider */}
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster />
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
