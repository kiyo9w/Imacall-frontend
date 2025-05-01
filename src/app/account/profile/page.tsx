'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient'; // Import the API client
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Save, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { UserPublic } from '@/types/auth'; // Import UserPublic type
import axios from 'axios'; // For error handling
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// Schema for updating user profile (matches UserUpdateMe schema)
const profileSchema = z.object({
  full_name: z.string().min(1, { message: 'Full name cannot be empty' }).max(100).optional().nullable(), // Max length based on potential db constraints
  email: z.string().email({ message: 'Invalid email address' }), // Email might not be editable via this endpoint depending on backend setup
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser } = useAuth(); // Get user and fetchUser function
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
    }
  });

  // Update form default values when user data loads or changes
  useEffect(() => {
    if (user) {
      setValue('full_name', user.full_name || '', { shouldDirty: false });
      setValue('email', user.email || '', { shouldDirty: false });
    }
  }, [user, setValue]);


  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    if (!isDirty) {
      toast({ title: "No Changes", description: "Your profile information is already up to date." });
      return;
    }

    setError(null);
    setLoadingSubmit(true);

    try {
      // Prepare data for PATCH /users/me
      const updateData: Partial<ProfileFormInputs> = {};
      if (data.full_name !== user.full_name) {
         updateData.full_name = data.full_name || null;
      }
       // ** Important: Check if API allows email change via this endpoint **
       // For now, assume email is NOT editable here, as it often requires verification.
       // If it IS editable, uncomment the following lines:
       // if (data.email !== user.email) {
       //   updateData.email = data.email;
       // }

       // Check if there's anything to update
       if (Object.keys(updateData).length === 0) {
          toast({ title: "No Changes", description: "No effective changes to save." });
          setLoadingSubmit(false);
          return;
       }

      // Call the API to update the user profile
      await apiClient.patch<UserPublic>('/users/me', updateData);

      // Refetch user data to update the context and UI
      await fetchUser();

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

       // Reset dirty state after successful submission by re-evaluating defaults
       setValue('full_name', data.full_name || '', { shouldDirty: false });
       // If email were editable: setValue('email', data.email, { shouldDirty: false });

    } catch (err: any) {
      console.error('Profile Update Error:', err);
      let errorMessage = 'Failed to update profile. Please try again.';
      if (axios.isAxiosError(err) && err.response) {
            if (err.response.status === 422) {
                const detail = err.response.data?.detail?.[0];
                errorMessage = detail ? `Validation failed: ${detail.msg} (${detail.loc.join('.')})` : "Validation failed.";
            } else if (err.response.status === 400 && err.response.data?.detail?.includes("already exists")){
                errorMessage = "Email already in use by another account.";
            } else if (err.response.status === 401) {
                 errorMessage = "Authentication error. Please log in again.";
             }
      }
      setError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const getInitials = (name?: string | null): string => {
        if (!name) return 'U'; // Default fallback
        const names = name.trim().split(' ');
        if (names.length === 1 && names[0]) return names[0].charAt(0).toUpperCase();
        if (names.length > 1 && names[0] && names[names.length - 1]) {
          return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
        }
        return 'U';
   };

   const isLoading = authLoading || isSubmitting || loadingSubmit;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-border/60"> {/* Use border/60 */}
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
             <UserIcon className="h-6 w-6 text-primary"/>
             Your Profile
         </CardTitle>
        <CardDescription>View and update your account details.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
         {authLoading ? (
             <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-20 w-20 rounded-full bg-muted"/>
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-4 w-1/2 bg-muted"/>
                         <Skeleton className="h-4 w-3/4 bg-muted"/>
                    </div>
                </div>
                <Skeleton className="h-10 w-full bg-muted"/>
                <Skeleton className="h-10 w-full bg-muted"/>
             </div>
         ) : !user ? (
            <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Logged In</AlertTitle>
                <AlertDescription>
                    Please <Link href="/login" className="underline text-primary">log in</Link> to view your profile.
                 </AlertDescription>
             </Alert>
         ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar and basic info display */}
              <div className="flex items-center space-x-6 p-4 bg-gradient-to-r from-card to-secondary/10 dark:to-secondary/5 rounded-lg border border-border/60"> {/* Added space */}
                <Avatar className="h-20 w-20 border-2 border-background shadow-md">
                   {/* Assuming no user avatar URL from API */}
                  {/* <AvatarImage src={user.avatarUrl} alt={user.full_name ?? 'User'} /> */}
                  <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-xl font-semibold">{user.full_name || 'Unnamed User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground font-mono pt-1">ID: {user.id}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className={cn("transition-colors duration-200", errors.full_name ? 'border-destructive focus-visible:ring-destructive/50' : 'focus-visible:ring-primary/50')}
                  disabled={isLoading}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
                {errors.full_name && <p className="text-sm font-medium text-destructive">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  // Email is likely not editable - make it read-only
                  readOnly
                  disabled={isLoading} // Still disable appearance if form is submitting
                  className={cn(
                      "bg-muted/50 cursor-not-allowed border-dashed border-border/50", // Style to indicate read-only
                      errors.email ? 'border-destructive' : ''
                  )}
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                <p className="text-xs text-muted-foreground">
                     Email address cannot be changed here.
                </p>
              </div>

               <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !isDirty}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isLoading ? 'Saving...' : 'Save Changes'}
               </Button>
            </form>
         )}
      </CardContent>
       {!authLoading && user && (
           <CardFooter className="border-t pt-6 flex justify-end border-border/60"> {/* Use border/60 */}
                 <Button variant="outline" asChild size="sm">
                    <Link href="/account/settings">
                        Change Password or Settings
                        <ExternalLink className="ml-2 h-4 w-4"/>
                    </Link>
                 </Button>
           </CardFooter>
       )}
    </Card>
  );
}
