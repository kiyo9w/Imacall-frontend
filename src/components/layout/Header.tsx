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
import { LogIn, LogOut, User, Settings, Bot, History, Loader2, Sun, Moon, LayoutGrid, UserCog, ShieldCheck } from 'lucide-react'; // Added LayoutGrid, UserCog, ShieldCheck
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils'; // Import cn

// ThemeToggle component
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
  const { user, loading, logout } = useAuth();
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
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "shadow-md" // Slightly more pronounced shadow
    )}>
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group mr-6"> {/* Added margin */}
          <Bot className="h-7 w-7 text-primary group-hover:animate-pulse" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary via-teal-400 to-accent bg-clip-text text-transparent group-hover:brightness-110 transition-all">
            Imacall
          </span>
        </Link>

        {/* Navigation Links - Removed Characters Link */}
        <nav className="hidden md:flex items-center gap-4">
           {/* Removed Characters Button */}
          {/* Add more navigation links here if needed */}
        </nav>

        {/* Right side: Theme Toggle & Auth */}
        <div className="flex items-center gap-3 ml-auto"> {/* Use ml-auto to push to the right */}
          <ThemeToggle />

          {loading ? (
             <Skeleton className="h-9 w-9 rounded-full bg-muted-foreground/20" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 group">
                  <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary/40 transition-colors duration-300">
                    {/* <AvatarImage src={user.photoURL ?? undefined} alt={user.full_name ?? 'User'} /> */}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-medium group-hover:border-primary/30">
                      {user.full_name ? getInitials(user.full_name) : <User size={16} />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 rounded-xl shadow-lg border-border/60" align="end" forceMount> {/* Use border/60 */}
                <DropdownMenuLabel className="font-normal py-2 px-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60" />
                {/* Use DropdownMenuItem with Link directly */}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/account/profile">
                    <UserCog className="mr-2 h-4 w-4 text-muted-foreground" /> {/* Changed Icon */}
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/account/characters">
                    <LayoutGrid className="mr-2 h-4 w-4 text-muted-foreground" /> {/* Changed Icon */}
                    <span>My Characters</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                   <Link href="/account/history">
                     <History className="mr-2 h-4 w-4 text-muted-foreground"/>
                     <span>History</span>
                   </Link>
                 </DropdownMenuItem>
                 {/* Separator */}
                 <DropdownMenuSeparator className="bg-border/60" />
                 {/* Admin Links - Conditionally Render */}
                 {user.is_superuser && (
                    <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 pt-2">Admin</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href="/admin/users">
                             <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                             <span>Manage Users</span>
                          </Link>
                         </DropdownMenuItem>
                         <DropdownMenuItem asChild className="cursor-pointer">
                             <Link href="/admin/characters">
                                 <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground"/>
                                 <span>Manage Characters</span>
                              </Link>
                         </DropdownMenuItem>
                         <DropdownMenuSeparator className="bg-border/60" />
                    </>
                 )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/account/settings">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem onClick={handleSignOut} disabled={loading} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                   {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full shadow-sm hover:shadow-md transition-shadow">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
