'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient'; // Import the API client
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, AlertCircle, CheckCircle, LogIn, Loader2 } from 'lucide-react'; // Added Loader2
import axios from 'axios'; // Import axios for error handling

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordInputs> = async (data) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // Call the FastAPI endpoint for password recovery
      // Use the correct endpoint path from documentation
      await apiClient.post(`/password-recovery/${encodeURIComponent(data.email)}`);
      setSuccess('Password recovery email sent! Please check your inbox (and spam folder).');
    } catch (err: any) {
      console.error('Password Recovery Error:', err);
       let errorMessage = 'Failed to send password recovery email. Please try again.';
        // Corrected error handling check: use 'err' instead of 'error'
        if (axios.isAxiosError(err) && err.response?.status === 404) {
             errorMessage = "User with this email not found.";
         } else if (axios.isAxiosError(err) && err.response?.status === 422) {
              // Handle potential validation errors like invalid email format
              errorMessage = err.response.data?.detail?.[0]?.msg || "Invalid email format.";
         }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl transition-shadow hover:shadow-2xl"> {/* Increased shadow */}
        <CardHeader className="text-center space-y-1"> {/* Added space-y-1 */}
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>Enter your email to receive recovery instructions.</CardDescription>
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
          {!success && ( // Only show form if not successful
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                    disabled={loading || !!success} // Disable if loading or successful
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading || !!success}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {loading ? 'Sending...' : 'Send Recovery Email'}
                </Button>
              </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          {!success && ( // Show login link if not successful
             <>
             Remember your password?&nbsp;
             <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/login">
                    <LogIn className="mr-1 h-4 w-4" /> Login
                </Link>
             </Button>
             </>
          )}
          {success && ( // Show login link centered if successful
             <Button variant="outline" asChild>
                <Link href="/login">
                    <LogIn className="mr-1 h-4 w-4" /> Back to Login
                </Link>
             </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
