'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Import the new AuthContext
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, AlertCircle, UserPlus, Loader2 } from 'lucide-react'; // Added Loader2

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth(); // Use login function and loading state from context
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine redirect path, default to '/'
  const redirectPath = searchParams.get('redirect') || '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    // Add grant_type required by FastAPI OAuth2PasswordRequestForm
    formData.append('grant_type', 'password');
    // 'username' is used by default in OAuth2PasswordRequestForm, map email to it
    formData.set('username', formData.get('email') as string);


    try {
      await login(formData); // Call the login function from context
      router.push(redirectPath); // Use the redirect path
    } catch (err: any) {
      console.error('Login Error:', err);
      // Use the error message thrown from AuthContext
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    // Use flex to center content vertically and horizontally within the main content area
    <div className="flex flex-1 items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl transition-shadow hover:shadow-2xl"> {/* Increased shadow */}
        <CardHeader className="text-center space-y-1"> {/* Added space-y-1 */}
          <CardTitle className="text-2xl font-bold">Login to Imacall</CardTitle>
          <CardDescription>Access your account or create a new one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"> {/* Added space-y-4 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email" // Add name attribute for FormData
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <Label htmlFor="password">Password</Label>
                 <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot Password?
                 </Link>
              </div>
              <Input
                id="password"
                name="password" // Add name attribute for FormData
                type="password"
                placeholder="••••••••"
                required
                minLength={8} // Match API schema min length
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm"> {/* Changed flex direction */}
           <span>Don't have an account?</span>
          <Button variant="outline" asChild className="w-full">
             <Link href="/register">
                <UserPlus className="mr-2 h-4 w-4" /> Register Now
             </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
