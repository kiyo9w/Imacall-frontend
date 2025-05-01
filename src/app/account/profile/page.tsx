'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth, updateProfile, User } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { app, storage } from '@/lib/firebase';
import { Loader2, User as UserIcon, Save, Camera, AlertCircle, CheckCircle } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(3, { message: 'Display name must be at least 3 characters' }).max(50, { message: 'Display name cannot exceed 50 characters' }),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const auth = getAuth(app);


  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    }
  });

   // Update form default value when user data loads
   useEffect(() => {
     if (user?.displayName) {
       setValue('displayName', user.displayName, { shouldDirty: false });
     }
     if (user?.photoURL){
         setAvatarPreview(user.photoURL);
     }
   }, [user, setValue]);


  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation (e.g., file type, size)
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
         setError('Image size should not exceed 2MB.');
         return;
      }
      setError(null);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (currentUser: User, file: File): Promise<string> => {
    const storageRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };


  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    if (!auth.currentUser) {
      setError("Not authenticated.");
      return;
    }
    // Only proceed if form is dirty or avatar changed
    if (!isDirty && !avatarFile) {
        toast({ title: "No changes", description: "No changes were made to your profile."});
        return;
    }

    setError(null);
    setLoading(true);

    try {
      let photoURL = auth.currentUser.photoURL; // Keep existing URL initially

      // Upload new avatar if selected
      if (avatarFile) {
        photoURL = await uploadAvatar(auth.currentUser, avatarFile);
      }

      // Update profile
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: photoURL, // Update photoURL if changed
      });

      // Clear the avatar file state after successful upload
      setAvatarFile(null);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default", // Explicitly default, looks like success due to theme
        action: <CheckCircle className="text-green-500"/>
      });

    } catch (err: any) {
      console.error('Profile Update Error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
       toast({
           title: "Update Failed",
           description: err.message || 'Could not update profile.',
           variant: "destructive",
         });
    } finally {
      setLoading(false);
      // Reset dirty state after submission attempt regardless of outcome
       // Note: React Hook Form doesn't have a built-in resetDirty, this needs careful handling
       // Re-fetching user or manually resetting might be needed if RHF doesn't update automatically
    }
  };

  if (authLoading) {
      return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
     // This should technically be handled by ProtectedRoute, but as a fallback:
     return <p>Please log in to view your profile.</p>;
   }


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>View and update your display name and avatar.</CardDescription>
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
              <Avatar className="h-20 w-20">
                 <AvatarImage src={avatarPreview || undefined} alt={user.displayName ?? 'User'} />
                 <AvatarFallback className="text-3xl">
                     {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon />}
                 </AvatarFallback>
              </Avatar>
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
                    className="hidden" // Hide the default input
                    disabled={loading}
                 />
                 <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB.</p>
              </div>
           </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              {...register('displayName')}
              className={errors.displayName ? 'border-destructive' : ''}
              disabled={loading}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>

           <div className="space-y-2">
             <Label htmlFor="email">Email</Label>
             <Input
               id="email"
               type="email"
               value={user.email || ''}
               disabled // Email is usually not editable directly
               readOnly
               className="bg-muted cursor-not-allowed"
             />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
           </div>


          <Button type="submit" className="w-full" disabled={loading || (!isDirty && !avatarFile)}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Need to import cn and buttonVariants
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
