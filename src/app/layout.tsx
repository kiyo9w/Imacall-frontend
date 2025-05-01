import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider

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
    // suppressHydrationWarning is needed for next-themes
    <html lang="en" className={inter.variable} suppressHydrationWarning>
       <body className={`font-sans flex flex-col min-h-screen antialiased bg-gradient-body text-foreground`}> {/* Use body gradient */}
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
         >
             <AuthProvider> {/* Wrap with AuthProvider */}
               <Header />
               {/* flex-1 ensures main content pushes footer down */}
               <main className="flex-grow flex flex-col container mx-auto px-4 py-8">
                 {children}
               </main>
               {/* Optional: Add a simple footer */}
               <footer className="py-6 text-center text-xs text-muted-foreground border-t bg-card/80 backdrop-blur-sm"> {/* Slightly styled footer */}
                 © {new Date().getFullYear()} Imacall. All rights reserved.
               </footer>
               <Toaster />
             </AuthProvider>
         </ThemeProvider>
       </body>
    </html>
  );
}
