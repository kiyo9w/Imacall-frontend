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
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Lock, AlertCircle, CheckCircle, Trash2, ShieldAlert } from 'lucide-react'; // Use Lock icon, add Trash2, ShieldAlert
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Import AlertDialog components
import axios from 'axios'; // For error handling
import { Separator } from '@/components/ui/separator'; // Import Separator

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
    const { user, loading: authLoading, logout } = useAuth(); // Add logout
    const { toast } = useToast();
    const [loadingPassword, setLoadingPassword] = useState(false); // Specific state for password save button
    const [errorPassword, setErrorPassword] = useState<string | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false); // Specific state for delete button
    const [errorDelete, setErrorDelete] = useState<string | null>(null);

     const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordChangeInputs>({
        resolver: zodResolver(passwordChangeSchema),
     });

    const handlePasswordChange: SubmitHandler<PasswordChangeInputs> = async (data) => {
        if (!user) return; // Should be handled by ProtectedRoute

        setLoadingPassword(true);
        setErrorPassword(null);

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
                 } else if (err.response.status === 401) {
                     errorMessage = "Authentication error. Please log in again.";
                 }
            }
            setErrorPassword(errorMessage);
            toast({
                title: "Password Update Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        setLoadingDelete(true);
        setErrorDelete(null);

        try {
            // Call the API to delete the current user's account
            await apiClient.delete('/users/me');

            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted. You have been logged out.",
                variant: "destructive",
            });

            await logout(); // Logout the user after successful deletion

        } catch (err: any) {
            console.error("Error deleting account:", err);
            let errorMessage = "Failed to delete your account. Please try again.";
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.status === 401) {
                     errorMessage = "Authentication error. Please log in again.";
                 } else if (err.response.status === 403) {
                     errorMessage = "You do not have permission to perform this action.";
                 }
            }
            setErrorDelete(errorMessage);
            toast({
                title: "Deletion Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoadingDelete(false);
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
        <div className="space-y-12 max-w-2xl mx-auto">
            {/* Password Card */}
            <Card className="w-full shadow-lg border-border/60">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2"><Lock className="h-6 w-6 text-primary"/> Change Password</CardTitle>
                    <CardDescription>Manage your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                    {errorPassword && (
                        <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Password Error</AlertTitle>
                        <AlertDescription>{errorPassword}</AlertDescription>
                        </Alert>
                    )}

                    {/* --- Password Change Form --- */}
                    <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                {...register('current_password')}
                                className={errors.current_password ? 'border-destructive' : ''}
                                disabled={loadingPassword}
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
                                disabled={loadingPassword}
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
                                disabled={loadingPassword}
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                        </div>
                        <Button
                            type="submit"
                            disabled={loadingPassword}
                            className="w-full sm:w-auto" // Adjust width on small screens
                        >
                            {loadingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Change Password</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* --- Notification Settings (Placeholder/Future) --- */}
             <Card className="w-full shadow-lg border-border/60">
                 <CardHeader>
                    <CardTitle className="text-xl">Notification Settings</CardTitle>
                    <CardDescription>Manage how you receive notifications (feature coming soon).</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <div className="text-center py-6 text-muted-foreground italic">
                         Notification settings are not yet available.
                     </div>
                 </CardContent>
             </Card>


            {/* Danger Zone Card */}
            <Card className="w-full shadow-lg border-destructive/80">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2 text-destructive"><ShieldAlert className="h-6 w-6"/> Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {errorDelete && (
                        <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Deletion Error</AlertTitle>
                        <AlertDescription>{errorDelete}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                        <div>
                             <h4 className="font-semibold text-destructive">Delete Account</h4>
                             <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button
                                    variant="destructive"
                                    disabled={loadingDelete}
                                    className="w-full sm:w-auto flex-shrink-0"
                                 >
                                     {loadingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                     {loadingDelete ? 'Deleting...' : 'Delete My Account'}
                                 </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove all your data, including character submissions and conversation history.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={loadingDelete}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        disabled={loadingDelete}
                                        className={buttonVariants({ variant: "destructive" })}
                                    >
                                         {loadingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        Yes, Delete My Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
