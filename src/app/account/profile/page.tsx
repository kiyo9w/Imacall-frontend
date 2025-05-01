'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient'; // Import the API client
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Save, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { UserPublic } from '@/types/auth'; // Import UserPublic type
import axios from 'axios'; // For error handling

// Schema for updating user profile (matches UserUpdateMe schema)
const profileSchema = z.object({
  full_name: z.string().min(1, { message: 'Full name cannot be empty' }).max(50).optional().nullable(),
  email: z.string().email({ message: 'Invalid email address' }), // Email might not be editable via this endpoint depending on backend setup
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser } = useAuth(); // Get user and fetchUser function
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Avatar upload functionality is removed as it's not in the provided API spec
  // const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<ProfileFormInputs>({
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
      // setAvatarPreview(user.photoURL || null); // Remove avatar logic
    }
  }, [user, setValue]);

  // Remove avatar change handler
  // const handleAvatarChange = ...

  // Remove avatar upload function
  // const uploadAvatar = ...

  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    // Only proceed if form is dirty
    if (!isDirty) {
      toast({ title: "No changes", description: "No changes were made to your profile." });
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Prepare data for PATCH /users/me
      const updateData: Partial<ProfileFormInputs> = {};
      if (data.full_name !== user.full_name) {
         updateData.full_name = data.full_name || null; // Send null if empty string
      }
      // Only include email if it changed AND if the API supports changing it here.
       // The example UserUpdateMe only shows full_name and email, implying email might be updatable.
       // If email is NOT updatable via this endpoint, remove this line.
       if (data.email !== user.email) {
         updateData.email = data.email;
       }


      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
          toast({ title: "No changes", description: "No effective changes to save." });
          setLoading(false);
          return;
      }


      // Call the API to update the user profile
      await apiClient.patch<UserPublic>('/users/me', updateData);

      // Refetch user data to update the context and UI
      await fetchUser();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        action: <CheckCircle className="text-green-500" />
      });

       // Reset dirty state after successful submission
       // Re-fetching user data via fetchUser should update defaults and potentially reset dirty state implicitly
       // If not, manual reset might be needed, but useForm's reset can be used:
       // reset({}, { keepValues: true }); // Or reset(updatedUserData);

    } catch (err: any) {
      console.error('Profile Update Error:', err);
       let errorMessage = 'Failed to update profile. Please try again.';
        if (axios.isAxiosError(err) && err.response) {
            if (err.response.status === 422) {
                 // Handle validation errors (e.g., email format)
                 errorMessage = err.response.data?.detail?.[0]?.msg || "Validation failed.";
             } else if (err.response.status === 400 && err.response.data?.detail?.includes("already exists")){
                 errorMessage = "Email already in use by another account.";
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
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    // This should technically be handled by ProtectedRoute, but as a fallback:
    return <p>Please log in to view your profile.</p>;
  }

   const getInitials = (name?: string | null): string => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
   };


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>View and update your display name.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border">
              {/* Avatar image upload removed */}
              {/* <AvatarImage src={avatarPreview || undefined} alt={user.full_name ?? 'User'} /> */}
              <AvatarFallback className="text-3xl">
                {user.full_name ? getInitials(user.full_name) : <UserIcon />}
              </AvatarFallback>
            </Avatar>
             {/* Avatar change controls removed */}
             {/*
             <div className="space-y-1">
                 <Label htmlFor="avatar-upload" className={cn(
                   buttonVariants({ variant: "outline", size: "sm" }),
                   "cursor-pointer"
                 )}>
                    <Camera className="mr-2 h-4 w-4" /> Change Avatar
                 </Label>
                <Input
                   id="avatar-upload"
                   type="file"
                   accept="image/*"
                   onChange={handleAvatarChange}
                   className="hidden"
                   disabled={loading}
                />
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB.</p>
             </div>
             */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              {...register('full_name')}
              className={errors.full_name ? 'border-destructive' : ''}
              disabled={loading}
            />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              // Decide if email should be editable based on backend capabilities
              disabled={loading} // Or potentially always disabled: disabled={true}
              readOnly={false} // Or readOnly={true} if not editable
              className={cn(
                  errors.email ? 'border-destructive' : '',
                  false ? 'bg-muted cursor-not-allowed' : '' // Style if disabled/readonly
              )}

            />
             {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            <p className="text-xs text-muted-foreground">
                {false ? "Email cannot be changed here." : "Ensure this is a valid email."}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isDirty}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </form>

         {/* Optional: Add link to password change */}
         <div className="mt-6 text-center text-sm">
             <Link href="/account/settings" className="text-primary hover:underline">
                 Change Password or Settings
             </Link>
         </div>

      </CardContent>
    </Card>
  );
}

// Need to import cn
import { cn } from "@/lib/utils";
// buttonVariants might not be needed if avatar upload is removed
// import { buttonVariants } from "@/components/ui/button";
