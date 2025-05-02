'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Lock, AlertCircle, CheckCircle, Trash2, ShieldAlert, Cpu, Settings as SettingsIcon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// --- Password Change ---
const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});
type PasswordChangeInputs = z.infer<typeof passwordChangeSchema>;

// --- Main Component ---
export default function SettingsPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const { toast } = useToast();

    // Password Change State
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [errorPassword, setErrorPassword] = useState<string | null>(null);
    const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPasswordForm, formState: { errors: errorsPassword } } = useForm<PasswordChangeInputs>({
        resolver: zodResolver(passwordChangeSchema),
    });

    // AI Provider State (for superusers)
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);
    const [activeProvider, setActiveProvider] = useState<string | null>(null);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [errorProviders, setErrorProviders] = useState<string | null>(null);
    const [updatingProvider, setUpdatingProvider] = useState(false);

    // Delete Account State
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [errorDelete, setErrorDelete] = useState<string | null>(null);

    // Fetch AI Provider Config (if superuser)
    const fetchProviderConfig = useCallback(async () => {
        if (!user?.is_superuser) return;
        setLoadingProviders(true);
        setErrorProviders(null);
        try {
            const [availableRes, activeRes] = await Promise.all([
                apiClient.get<string[]>('/config/ai/providers/available'),
                apiClient.get<string>('/config/ai/providers/active'),
            ]);
            setAvailableProviders(availableRes.data);
            // The active provider response might be just the string name directly
            setActiveProvider(activeRes.data);
        } catch (err) {
            console.error("Error fetching AI provider config:", err);
            setErrorProviders("Failed to load AI provider settings.");
            if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                setErrorProviders("Unauthorized to fetch AI provider settings.");
            }
        } finally {
            setLoadingProviders(false);
        }
    }, [user?.is_superuser]);

    useEffect(() => {
        if (user?.is_superuser && !authLoading) {
            fetchProviderConfig();
        }
    }, [user, authLoading, fetchProviderConfig]);

    // --- Handlers ---
    const handlePasswordChange: SubmitHandler<PasswordChangeInputs> = async (data) => {
        if (!user) return;
        setLoadingPassword(true);
        setErrorPassword(null);
        try {
            await apiClient.patch('/users/me/password', {
                current_password: data.current_password,
                new_password: data.new_password,
            });
            toast({
                title: "Password Updated",
                description: "Your password has been successfully changed.",
                action: <CheckCircle className="text-green-500"/>
            });
            resetPasswordForm();
        } catch (err: any) {
            console.error("Error changing password:", err);
            let errorMessage = "Failed to change password. Please try again.";
            if (axios.isAxiosError(err) && err.response) {
                 if (err.response.status === 400) {
                     if (err.response.data?.detail?.includes("Incorrect password")) {
                         errorMessage = "Incorrect current password.";
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
            toast({ title: "Password Update Failed", description: errorMessage, variant: "destructive"});
        } finally {
            setLoadingPassword(false);
        }
    };

     const handleProviderChange = async (newProvider: string) => {
        if (!user?.is_superuser || newProvider === activeProvider) return;
        setUpdatingProvider(true);
        setErrorProviders(null);
        try {
            const response = await apiClient.put<{ message: string }>(`/config/ai/providers/active?provider_name=${encodeURIComponent(newProvider)}`);
            setActiveProvider(newProvider); // Update local state on success
            toast({
                title: "AI Provider Updated",
                description: response.data.message || `Active AI provider set to '${newProvider}'.`,
                action: <CheckCircle className="text-green-500"/>
            });
        } catch (err) {
            console.error("Error setting active AI provider:", err);
            let errorMsg = "Failed to update AI provider.";
             if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 400) {
                     errorMsg = err.response.data?.detail || `Provider '${newProvider}' is not available or failed to activate.`;
                 } else if (err.response.status === 401 || err.response.status === 403) {
                    errorMsg = "Unauthorized to change AI provider.";
                }
             }
            setErrorProviders(errorMsg);
            toast({ title: "Update Failed", description: errorMsg, variant: "destructive" });
        } finally {
            setUpdatingProvider(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setLoadingDelete(true);
        setErrorDelete(null);
        try {
            await apiClient.delete('/users/me');
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted. You have been logged out.",
                variant: "destructive",
            });
            await logout();
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
            toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setLoadingDelete(false);
        }
    };

    // --- Render Logic ---
     if (authLoading) {
         return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
     }

     if (!user) {
         return <p className="text-center py-16 text-muted-foreground">Please log in to manage your settings.</p>;
     }

    return (
         <div className="space-y-12 max-w-2xl mx-auto">
             <h1 className="text-3xl font-bold flex items-center gap-3 mb-10">
                <SettingsIcon className="h-8 w-8 text-primary" />
                Account Settings
            </h1>

            {/* Password Card */}
            <Card className="shadow-lg border border-border/40 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <CardHeader className="bg-muted/30 border-b border-border/40">
                    <CardTitle className="text-xl flex items-center gap-2"><Lock className="h-5 w-5 text-primary"/> Change Password</CardTitle>
                    <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {errorPassword && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Password Error</AlertTitle>
                            <AlertDescription>{errorPassword}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmitPassword(handlePasswordChange)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                {...registerPassword('current_password')}
                                className={errorsPassword.current_password ? 'border-destructive' : ''}
                                disabled={loadingPassword}
                                autoComplete="current-password"
                            />
                            {errorsPassword.current_password && <p className="text-sm text-destructive">{errorsPassword.current_password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                {...registerPassword('new_password')}
                                className={errorsPassword.new_password ? 'border-destructive' : ''}
                                disabled={loadingPassword}
                                autoComplete="new-password"
                            />
                            {errorsPassword.new_password && <p className="text-sm text-destructive">{errorsPassword.new_password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...registerPassword('confirmPassword')}
                                className={errorsPassword.confirmPassword ? 'border-destructive' : ''}
                                disabled={loadingPassword}
                                autoComplete="new-password"
                            />
                            {errorsPassword.confirmPassword && <p className="text-sm text-destructive">{errorsPassword.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" disabled={loadingPassword} className="w-full sm:w-auto">
                            {loadingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Change Password</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* AI Provider Settings (Superuser Only) */}
             {user.is_superuser && (
                <Card className="shadow-lg border border-border/40 rounded-xl overflow-hidden animate-in fade-in duration-500 delay-100">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle className="text-xl flex items-center gap-2"><Cpu className="h-5 w-5 text-primary"/> AI Provider Settings</CardTitle>
                        <CardDescription>Configure the AI model provider used for generating responses.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {errorProviders && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Provider Error</AlertTitle>
                                <AlertDescription>{errorProviders}</AlertDescription>
                            </Alert>
                        )}
                         {loadingProviders ? (
                             <div className="space-y-4">
                                <Skeleton className="h-5 w-32 bg-muted" />
                                <Skeleton className="h-10 w-full bg-muted" />
                                <Skeleton className="h-9 w-36 bg-muted" />
                            </div>
                         ) : (
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <Label htmlFor="aiProvider">Active AI Provider</Label>
                                     <Select
                                         value={activeProvider || ''}
                                         onValueChange={handleProviderChange}
                                         disabled={loadingProviders || updatingProvider || availableProviders.length === 0}
                                     >
                                         <SelectTrigger id="aiProvider" className="w-full md:w-[250px]">
                                             <SelectValue placeholder="Select Provider" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {availableProviders.length > 0 ? (
                                                 availableProviders.map(provider => (
                                                     <SelectItem key={provider} value={provider}>
                                                         {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                                     </SelectItem>
                                                 ))
                                             ) : (
                                                 <SelectItem value="none" disabled>No providers available</SelectItem>
                                             )}
                                         </SelectContent>
                                     </Select>
                                      {updatingProvider && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
                                 </div>
                                 <p className="text-xs text-muted-foreground">
                                     Available providers: {availableProviders.length > 0 ? availableProviders.join(', ') : 'None configured or API keys missing.'}
                                 </p>
                             </div>
                         )}
                    </CardContent>
                </Card>
            )}

            {/* Notification Settings (Placeholder) */}
             <Card className="shadow-lg border border-border/40 rounded-xl overflow-hidden animate-in fade-in duration-500 delay-200">
                 <CardHeader className="bg-muted/30 border-b border-border/40">
                    <CardTitle className="text-xl">Notification Settings</CardTitle>
                    <CardDescription>Manage how you receive notifications (feature coming soon).</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6">
                     <div className="text-center py-6 text-muted-foreground italic">
                         Notification settings are not yet implemented.
                     </div>
                 </CardContent>
             </Card>

            {/* Danger Zone Card */}
            <Card className="shadow-lg border border-destructive/60 rounded-xl overflow-hidden bg-destructive/5 animate-in fade-in duration-500 delay-300">
                <CardHeader className="border-b border-destructive/40">
                    <CardTitle className="text-xl flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5"/> Danger Zone</CardTitle>
                    <CardDescription className="text-destructive/90">Irreversible actions for your account.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {errorDelete && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Deletion Error</AlertTitle>
                            <AlertDescription>{errorDelete}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                             <h4 className="font-semibold text-destructive-foreground">Delete Account</h4>
                             <p className="text-sm text-destructive/80 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
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

    