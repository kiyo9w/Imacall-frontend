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
import { LogIn, LogOut, User, Settings, Bot, History, Loader2 } from 'lucide-react'; // Added Loader2
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

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
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm"> {/* Added shadow-sm */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center gap-2 hover:opacity-90 transition-opacity">
           <Bot className="h-7 w-7" /> {/* Slightly larger icon */}
          Imacall
        </Link>
        <nav className="flex items-center gap-2 md:gap-4"> {/* Adjusted gap */}
          <Button variant="ghost" asChild>
            <Link href="/characters">Characters</Link>
          </Button>
          {loading ? (
             <Skeleton className="h-10 w-10 rounded-full" /> // Skeleton for avatar
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    {/* Assuming user object doesn't have photoURL yet */}
                    {/* <AvatarImage src={user.photoURL ?? undefined} alt={user.full_name ?? 'User'} /> */}
                    <AvatarFallback className="bg-primary/10 text-primary"> {/* Added subtle background */}
                      {user.full_name ? getInitials(user.full_name) : <User size={18} />}
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
            <Button asChild>
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
