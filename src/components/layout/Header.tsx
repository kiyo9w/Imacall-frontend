'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, User, Settings, Bot, History, Loader2, Sun, Moon } from 'lucide-react'; // Added Sun, Moon
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes'; // Import useTheme

// ThemeToggle component (can be moved to its own file later)
function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
      className="text-muted-foreground hover:text-foreground"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}


export function Header() {
  const { user, loading, logout } = useAuth(); // Use logout from new AuthContext
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    // Redirect is handled within logout function in AuthContext
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    // Enhanced Header Styling
    <header className="bg-card/80 backdrop-blur-lg border-b sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
           <Bot className="h-7 w-7" />
          Imacall
        </Link>
        <nav className="flex items-center gap-2 md:gap-3"> {/* Adjusted gap */}
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground hover:bg-accent/50">
            <Link href="/characters">Characters</Link>
          </Button>
           <ThemeToggle /> {/* Add Theme Toggle Button */}
          {loading ? (
             <Skeleton className="h-9 w-9 rounded-full" /> // Slightly smaller skeleton
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0"> {/* Smaller trigger */}
                  <Avatar className="h-9 w-9 border border-transparent group-hover:border-primary/30 transition-colors">
                    {/* Assuming user object doesn't have photoURL yet */}
                    {/* <AvatarImage src={user.photoURL ?? undefined} alt={user.full_name ?? 'User'} /> */}
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-medium"> {/* Adjusted fallback style */}
                      {user.full_name ? getInitials(user.full_name) : <User size={16} />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name || 'User'} {/* Use full_name */}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link href="/account/characters">
                     <Bot className="mr-2 h-4 w-4" />
                     <span>My Characters</span>
                   </Link>
                 </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link href="/account/history">
                     <History className="mr-2 h-4 w-4"/>
                     <span>History</span>
                   </Link>
                 </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={loading} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                   {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm"> {/* Smaller login button */}
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
