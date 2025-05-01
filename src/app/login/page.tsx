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
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

   // Google Sign-In is removed as it's not directly supported by the basic FastAPI setup

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login to Imacall</CardTitle>
          <CardDescription>Access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
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
              {/* Basic validation done by type="email" and required */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password" // Add name attribute for FormData
                type="password"
                placeholder="••••••••"
                required
                minLength={6} // Basic length check
                disabled={loading}
                autoComplete="current-password"
              />
               {/* Basic validation done by type="password", required and minLength */}
            </div>
            <div className="text-sm text-right">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          {/* Remove Google Sign-In button */}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          Don't have an account?&nbsp;
          <Link href="/register" className="text-primary hover:underline flex items-center">
            <UserPlus className="mr-1 h-4 w-4" /> Register
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
