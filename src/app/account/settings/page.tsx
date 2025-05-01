'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Use Input for password
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Lock, AlertCircle, CheckCircle } from 'lucide-react'; // Use Lock icon
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import axios from 'axios'; // For error handling

// Schema for updating password (matches UpdatePassword schema)
const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

type PasswordChangeInputs = z.infer<typeof passwordChangeSchema>;

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false); // Specific state for save button
    const [error, setError] = useState<string | null>(null);

     const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordChangeInputs>({
        resolver: zodResolver(passwordChangeSchema),
     });

    const handlePasswordChange: SubmitHandler<PasswordChangeInputs> = async (data) => {
        if (!user) return; // Should be handled by ProtectedRoute

        setLoading(true);
        setError(null);

        try {
            // Call the API to update password
            await apiClient.patch('/users/me/password', {
                current_password: data.current_password,
                new_password: data.new_password,
            });

            toast({
                title: "Password Updated",
                description: "Your password has been successfully changed.",
                action: <CheckCircle className="text-green-500"/>
            });
            reset(); // Clear form fields after successful update
        } catch (err: any) {
            console.error("Error changing password:", err);
            let errorMessage = "Failed to change password. Please try again.";
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.status === 400) {
                     // Handle specific backend errors like incorrect current password
                     if (err.response.data?.detail?.includes("Incorrect password")) {
                         errorMessage = "Incorrect current password.";
                         // Optionally set error focus on current_password field
                     } else {
                         errorMessage = err.response.data?.detail || "Invalid input.";
                     }
                 } else if (err.response.status === 422) {
                     errorMessage = "Validation failed. Ensure your new password meets the requirements.";
                 }
            }
            setError(errorMessage);
            toast({
                title: "Update Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

     if (authLoading) {
         // Show a simple loading state or skeleton
         return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
     }

     if (!user) {
         // Should be handled by ProtectedRoute
         return <p>Please log in to manage your settings.</p>;
     }


    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Lock className="h-6 w-6 text-primary"/> Account Settings</CardTitle>
                <CardDescription>Manage your account password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                 {/* --- Password Change Form --- */}
                 <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4 border-t pt-6">
                      <h3 className="text-lg font-medium">Change Password</h3>
                     <div className="space-y-2">
                         <Label htmlFor="current_password">Current Password</Label>
                         <Input
                             id="current_password"
                             type="password"
                             {...register('current_password')}
                             className={errors.current_password ? 'border-destructive' : ''}
                             disabled={loading}
                             autoComplete="current-password"
                         />
                         {errors.current_password && <p className="text-sm text-destructive">{errors.current_password.message}</p>}
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="new_password">New Password</Label>
                         <Input
                             id="new_password"
                             type="password"
                             {...register('new_password')}
                             className={errors.new_password ? 'border-destructive' : ''}
                             disabled={loading}
                             autoComplete="new-password"
                         />
                         {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="confirmPassword">Confirm New Password</Label>
                         <Input
                             id="confirmPassword"
                             type="password"
                             {...register('confirmPassword')}
                             className={errors.confirmPassword ? 'border-destructive' : ''}
                             disabled={loading}
                             autoComplete="new-password"
                         />
                         {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                     </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                     >
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Change Password</>}
                    </Button>
                 </form>

                {/* --- Notification Settings Removed --- */}

            </CardContent>
        </Card>
    );
}
