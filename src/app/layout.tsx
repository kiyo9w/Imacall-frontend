import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Using Geist Sans as the modern font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { FirebaseProvider } from '@/contexts/FirebaseContext'; // Added FirebaseProvider

export const metadata: Metadata = {
  title: 'EchoVerse',
  description: 'Create, discover, and interact with AI characters.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.variable}> {/* Apply font variable to html tag */}
      <body className={`antialiased font-sans flex flex-col min-h-screen`}> {/* Remove font variable class from body, font-sans uses it */}
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
