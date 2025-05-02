'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Import the new AuthContext
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, AlertCircle, LogIn, Loader2 } from 'lucide-react'; // Added Loader2

// Matches UserRegister schema from FastAPI
const registerSchema = z.object({
  full_name: z.string().min(3, { message: 'Full name must be at least 3 characters' }).max(50).optional().nullable(), // Match API schema (can be optional/null)
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }), // Match API schema min length
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

// Extracted content into a new component
function RegisterContent() {
  const [error, setError] = useState<string | null>(null);
  const { register: registerUser, loading } = useAuth(); // Use register function and loading state from context
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        full_name: '', // Default to empty string
        email: '',
        password: '',
    },
  });

  // Determine redirect path, default to '/'
  const redirectPath = searchParams.get('redirect') || '/';

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setError(null);
     // Prepare data matching the API schema (UserRegister)
    const registrationData = {
        email: data.email,
        password: data.password,
        full_name: data.full_name || null // Send null if empty, matching backend expectations
    };

    try {
      await registerUser(registrationData); // Call the register function from context
      // AuthContext handles redirect on successful login after registration
      // router.push(redirectPath); // No longer needed here
    } catch (err: any) {
      console.error('Registration Error:', err);
       // Use the error message thrown from AuthContext
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl transition-shadow hover:shadow-2xl"> {/* Increased shadow */}
        <CardHeader className="text-center space-y-1"> {/* Added space-y-1 */}
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Join Imacall today!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"> {/* Added space-y-4 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name (Optional)</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Your Name"
                {...register('full_name')}
                className={errors.full_name ? 'border-destructive' : ''}
                disabled={loading}
                autoComplete="name"
              />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
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
                autoComplete="email"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 8 characters)"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm"> {/* Changed flex direction */}
           <span>Already have an account?</span>
           <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">
                 <LogIn className="mr-1 h-4 w-4" /> Login Instead
              </Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// The main page component now wraps the content in Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}> {/* Or a more sophisticated loader */}
      <RegisterContent />
    </Suspense>
  );
}
