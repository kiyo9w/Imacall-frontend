'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { app } from '@/lib/firebase';
import { UserPlus, AlertCircle, LogIn } from 'lucide-react';

const registerSchema = z.object({
  displayName: z.string().min(3, { message: 'Display name must be at least 3 characters' }).max(50, { message: 'Display name cannot exceed 50 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

   // Determine redirect path, default to '/'
   const redirectPath = searchParams.get('redirect') || '/';

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // Update the user's profile with the display name
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });
      router.push(redirectPath); // Redirect to originally intended page or homepage
    } catch (err: any) {
      console.error('Registration Error:', err);
        let errorMessage = 'Failed to register. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already registered. Try logging in instead.';
        } else if (err.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else if (err.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. It must be at least 6 characters long.';
        }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

   const handleGoogleSignIn = async () => {
     setError(null);
     setLoading(true);
     try {
       await signInWithPopup(auth, googleProvider);
       // Check if user is new or existing - Firebase handles this automatically.
       // If new, their Google name is used. Profile can be edited later.
       router.push(redirectPath); // Redirect to originally intended page or homepage
     } catch (err: any) {
       console.error('Google Sign-In Error:', err);
       let errorMessage = 'Failed to sign in with Google.';
       if (err.code === 'auth/popup-closed-by-user') {
           errorMessage = 'Google Sign-In cancelled.';
       } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-blocked') {
            errorMessage = 'Google Sign-In popup was blocked or cancelled. Please allow popups for this site.';
        }
       setError(errorMessage);
     } finally {
       setLoading(false);
     }
   };


  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join Imacall today!</CardDescription> {/* Updated App Name */}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name"
                {...register('displayName')}
                className={errors.displayName ? 'border-destructive' : ''}
                disabled={loading}
                autoComplete="name" // Add autocomplete
              />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
                 disabled={loading}
                 autoComplete="email" // Add autocomplete
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 6 characters)"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
                 disabled={loading}
                 autoComplete="new-password" // Add autocomplete
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : <> <UserPlus className="mr-2 h-4 w-4" /> Register</>}
            </Button>
          </form>
           <div className="relative my-6">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t" />
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-background px-2 text-muted-foreground">
                 Or sign up with
               </span>
             </div>
           </div>
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              {/* Basic Google Icon */}
             <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C39.704,34.423,44,28.718,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
             {loading ? 'Signing up...' : 'Sign up with Google'}
           </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          Already have an account?&nbsp;
          <Link href="/login" className="text-primary hover:underline flex items-center">
             <LogIn className="mr-1 h-4 w-4" /> Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
