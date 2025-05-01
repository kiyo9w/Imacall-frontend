'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, AlertCircle, CheckCircle, LogIn, Loader2, ShieldAlert } from 'lucide-react'; // Added ShieldAlert
import axios from 'axios';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'), // Hidden field, populated from URL
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Set error on confirmPassword field
});

type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null); // Check token validity display
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
        token: tokenFromUrl || '',
    }
  });

   // Update token field if URL changes after initial render
   useEffect(() => {
     if (tokenFromUrl) {
       setValue('token', tokenFromUrl);
       setIsTokenValid(true); // Assume valid initially if present
       setError(null); // Clear potential initial error
     } else {
        setIsTokenValid(false);
        setError("Invalid or missing password reset token in URL.");
     }
   }, [tokenFromUrl, setValue]);

  const onSubmit: SubmitHandler<ResetPasswordInputs> = async (data) => {
    setError(null);
    setSuccess(null);

    if (!data.token) {
        setError("Invalid or missing password reset token.");
        return;
    }

    setLoading(true);
    try {
       // Call the FastAPI endpoint for resetting password
       await apiClient.post('/reset-password/', {
         token: data.token,
         new_password: data.new_password,
       });
      setSuccess('Password has been successfully reset! You can now log in with your new password.');
      // Optionally redirect to login after a delay
       setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      let errorMessage = 'Failed to reset password. The token might be invalid or expired.';
       if (axios.isAxiosError(err) && err.response?.status === 400) {
           // More specific error based on backend response if available
           if (err.response.data?.detail?.includes("invalid token")) {
               errorMessage = "Invalid or expired password reset token.";
           } else if (err.response.data?.detail?.includes("User not found")) {
                errorMessage = "User associated with this token not found.";
           }
       } else if (axios.isAxiosError(err) && err.response?.status === 422) {
          errorMessage = err.response.data?.detail?.[0]?.msg || "Validation failed (e.g., password too short).";
       }
      setError(errorMessage);
      setIsTokenValid(false); // Mark token as invalid on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl transition-shadow hover:shadow-2xl"> {/* Increased shadow */}
        <CardHeader className="text-center space-y-1"> {/* Added space-y-1 */}
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>
             {isTokenValid === false ? "Cannot reset password." : (success ? "Password successfully reset!" : "Enter your new password below.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"> {/* Added space-y-4 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
           {success && (
            <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-300">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Show form only if token seems initially valid and not yet successful */}
          {isTokenValid && !success && (
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
               {/* Hidden token field */}
               <input type="hidden" {...register('token')} />

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="•••••••• (min. 8 characters)"
                    {...register('new_password')}
                    className={errors.new_password ? 'border-destructive' : ''}
                    disabled={loading || !!success}
                    autoComplete="new-password"
                  />
                  {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...register('confirmPassword')}
                        className={errors.confirmPassword ? 'border-destructive' : ''}
                        disabled={loading || !!success}
                        autoComplete="new-password"
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading || !!success || !tokenFromUrl}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {loading ? 'Resetting...' : 'Set New Password'}
                </Button>
              </form>
          )}

           {/* Message if token was invalid from the start */}
           {isTokenValid === false && !error && (
             <Alert variant="destructive">
               <ShieldAlert className="h-4 w-4"/>
               <AlertTitle>Invalid Link</AlertTitle>
               <AlertDescription>The password reset link is invalid or missing. Please request a new one.</AlertDescription>
             </Alert>
           )}

        </CardContent>
         <CardFooter className="flex justify-center">
             {success ? (
                 <Button asChild variant="outline">
                     <Link href="/login">
                         <LogIn className="mr-2 h-4 w-4" /> Go to Login
                     </Link>
                 </Button>
             ) : isTokenValid === false || (error && error.includes("token")) ? (
                 <Button variant="outline" asChild>
                     <Link href="/forgot-password">
                         Request New Reset Link
                     </Link>
                 </Button>
             ) : null}
         </CardFooter>
      </Card>
    </div>
  );
}
