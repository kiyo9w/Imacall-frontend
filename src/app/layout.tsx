import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider
import { cn } from '@/lib/utils';

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
    // Apply font variable directly to html tag for global access
    <html lang="en" className={cn(inter.variable, "h-full")} suppressHydrationWarning>
       {/* Apply base styles, gradient, font, and flex settings to body */}
      <body className={cn(
          "font-sans flex flex-col min-h-full antialiased bg-gradient-body text-foreground animate-gradient-bg" // Ensure min-h-full, apply gradient/animation
        )}>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
         >
             <AuthProvider> {/* Wrap with AuthProvider */}
               <Header />
               {/* flex-grow allows main to take available space, container handles width/padding */}
               <main className="flex-grow flex flex-col container mx-auto px-4 py-8 md:py-12"> {/* Adjust py as needed */}
                 {children}
               </main>
               {/* Basic Footer */}
                <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/20 bg-background/50 backdrop-blur-sm"> {/* Slightly transparent footer */}
                  © {new Date().getFullYear()} Imacall. All rights reserved.
                </footer>
               <Toaster />
             </AuthProvider>
         </ThemeProvider>
       </body>
    </html>
  );
}
