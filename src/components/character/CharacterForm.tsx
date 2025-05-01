'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Character, CharacterFormData, CharacterCategory, CharacterStatus } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, AlertCircle, Bot, Trash2, Image as ImageIcon } from 'lucide-react';
import { Input as ShadInput } from "@/components/ui/input"; // Renamed ShadCN input
import { cn } from '@/lib/utils'; // For conditional classes

// Zod schema for V1 form data
const characterFormSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters'),
    greetingMessage: z.string().min(5, 'Greeting must be at least 5 characters').max(500, 'Greeting cannot exceed 500 characters'),
    scenario: z.string().max(1000, 'Scenario cannot exceed 1000 characters').optional(),
    category: z.nativeEnum(CharacterCategory),
    language: z.string().max(10, 'Language code too long (e.g., en, es-MX)').optional(),
    tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []), // Transform comma-separated string to array
    // voiceId will be added later
});


type CharacterFormInputs = z.infer<typeof characterFormSchema>;

interface CharacterFormProps {
    mode: 'create' | 'edit';
    existingCharacter?: Character; // Provided in edit mode
}

const CATEGORIES: CharacterCategory[] = ['Fantasy', 'Sci-Fi', 'Historical', 'Anime', 'Celebrity', 'Game Character', 'Assistant', 'Custom'];


export function CharacterForm({ mode, existingCharacter }: CharacterFormProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(existingCharacter?.imageUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [removeAvatar, setRemoveAvatar] = useState(false); // Flag to remove existing avatar


     // Pre-fill form in edit mode
    const defaultValues: Partial<CharacterFormInputs> = {
        name: existingCharacter?.name || '',
        description: existingCharacter?.description || '',
        greetingMessage: existingCharacter?.greetingMessage || '',
        scenario: existingCharacter?.scenario || '',
        category: existingCharacter?.category || undefined, // Let zod handle if undefined
        language: existingCharacter?.language || '',
        tags: existingCharacter?.tags || [],
    };

    const { register, handleSubmit, control, setValue, watch, formState: { errors, isDirty } } = useForm<CharacterFormInputs>({
        resolver: zodResolver(characterFormSchema),
         defaultValues: defaultValues
    });

    // Set initial avatar preview in edit mode
    useEffect(() => {
        if (mode === 'edit' && existingCharacter?.imageUrl) {
            setAvatarPreview(existingCharacter.imageUrl);
        }
    }, [mode, existingCharacter]);


    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file (PNG, JPG, GIF).');
                return;
            }
             if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Image size should not exceed 2MB.');
                return;
            }
            setError(null);
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setRemoveAvatar(false); // If a new file is chosen, don't remove
             // Manually mark form as dirty if avatar changes
            setValue('name', watch('name'), { shouldDirty: true });
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setRemoveAvatar(true); // Set flag to remove on save
        // Manually mark form as dirty if avatar is removed
        setValue('name', watch('name'), { shouldDirty: true });
    };


     const uploadAvatar = async (characterId: string, file: File): Promise<string> => {
        setIsUploading(true);
        try {
            const storageRef = ref(storage, `character-avatars/${characterId}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit: SubmitHandler<CharacterFormInputs> = async (data) => {
         if (!user) {
             setError("You must be logged in to submit a character.");
             return;
         }
        // Check if anything actually changed in edit mode
        const avatarChanged = avatarFile || removeAvatar;
         if (mode === 'edit' && !isDirty && !avatarChanged) {
            toast({ title: "No Changes", description: "No changes were detected." });
            return;
        }


        setLoading(true);
        setError(null);

        try {
            let finalImageUrl: string | null | undefined = mode === 'edit' ? existingCharacter?.imageUrl : undefined;

            // Logic for Create
            if (mode === 'create') {
                const characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'> & { createdAt: Timestamp, updatedAt: Timestamp } = {
                    userId: user.uid,
                    creatorType: 'User', // Assuming user creation for now
                    status: 'Pending', // Default status for new submissions
                    isPublic: false, // Default to private
                    createdAt: serverTimestamp() as Timestamp,
                    updatedAt: serverTimestamp() as Timestamp,
                    ...data,
                    // Fields not in form yet
                    popularityScore: 0,
                    ratingCount: 0,
                };

                const docRef = await addDoc(collection(db, 'characters'), characterData);

                // Upload avatar if selected AFTER getting the doc ID
                if (avatarFile) {
                     finalImageUrl = await uploadAvatar(docRef.id, avatarFile);
                     await updateDoc(docRef, { imageUrl: finalImageUrl });
                }

                 toast({
                    title: "Character Submitted!",
                    description: `${data.name} has been submitted for review.`,
                });
                 router.push('/account/characters'); // Redirect to dashboard


            // Logic for Edit
            } else if (mode === 'edit' && existingCharacter) {
                 // Upload new avatar if selected
                 if (avatarFile) {
                     finalImageUrl = await uploadAvatar(existingCharacter.id, avatarFile);
                 } else if (removeAvatar) {
                     finalImageUrl = null; // Explicitly set to null if removed
                      // TODO: Optionally delete old image from storage here
                 }


                const updateData: Partial<Character> & { updatedAt: Timestamp } = {
                    ...data,
                    imageUrl: finalImageUrl, // Update with new or removed URL
                    updatedAt: serverTimestamp() as Timestamp,
                     // Reset status to Pending if editing a Rejected character
                    status: existingCharacter.status === 'Rejected' ? 'Pending' : existingCharacter.status,
                     adminFeedback: existingCharacter.status === 'Rejected' ? '' : existingCharacter.adminFeedback // Clear feedback on resubmit
                };

                 await updateDoc(doc(db, 'characters', existingCharacter.id), updateData);

                 toast({
                    title: "Character Updated!",
                    description: `${data.name} has been updated.`,
                });
                 router.push('/account/characters'); // Redirect to dashboard
            }

        } catch (err: any) {
            console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} character:`, err);
            setError(err.message || `Failed to ${mode} character. Please try again.`);
            toast({
                 title: `${mode === 'create' ? 'Submission' : 'Update'} Failed`,
                 description: err.message || `Could not ${mode} character.`,
                 variant: "destructive",
             });
        } finally {
            setLoading(false);
        }
    };

     if (authLoading) {
         return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
     }

    return (
        <Card className="max-w-2xl mx-auto shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                    <CardTitle>{mode === 'create' ? 'New Character Details' : `Editing: ${existingCharacter?.name}`}</CardTitle>
                    <CardDescription>
                        {mode === 'create'
                            ? 'Fill in the details for your new AI character. It will be submitted for review.'
                            : 'Update the details for your character.'}
                         {mode === 'edit' && existingCharacter?.status === 'Rejected' && ' Resubmitting will send it for review again.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Avatar Upload */}
                     <div className="flex items-center gap-4">
                         <Avatar className="h-24 w-24 border">
                             <AvatarImage src={avatarPreview || undefined} alt="Character Avatar Preview"/>
                             <AvatarFallback className="text-muted-foreground">
                                 <ImageIcon size={40}/>
                             </AvatarFallback>
                         </Avatar>
                         <div className="space-y-2">
                             <Label htmlFor="avatarFile">Character Avatar (Optional)</Label>
                             <div className="flex gap-2">
                                 <ShadInput
                                     id="avatarFile"
                                     type="file"
                                     accept="image/*"
                                     onChange={handleAvatarChange}
                                     className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                     disabled={loading || isUploading}
                                 />
                                 {avatarPreview && (
                                     <Button
                                         type="button"
                                         variant="ghost"
                                         size="icon"
                                         onClick={handleRemoveAvatar}
                                         disabled={loading || isUploading}
                                         title="Remove Avatar"
                                     >
                                         <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                 )}
                             </div>
                             <p className="text-xs text-muted-foreground">Recommended: Square image (e.g., 512x512). Max 2MB.</p>
                             {isUploading && <p className="text-xs text-primary flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin"/> Uploading...</p>}
                         </div>
                     </div>


                    {/* Basic Fields */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" {...register('name')} placeholder="Character's full name" disabled={loading} className={errors.name ? 'border-destructive' : ''} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Short Description *</Label>
                        <Textarea id="description" {...register('description')} placeholder="A brief tagline or summary (max 500 chars)" disabled={loading} rows={3} className={errors.description ? 'border-destructive' : ''} />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>

                     {/* Detail Fields */}
                     <div className="space-y-2">
                        <Label htmlFor="greetingMessage">Greeting Message *</Label>
                        <Textarea id="greetingMessage" {...register('greetingMessage')} placeholder="The first thing the character says (max 500 chars)" disabled={loading} rows={3} className={errors.greetingMessage ? 'border-destructive' : ''} />
                        {errors.greetingMessage && <p className="text-sm text-destructive">{errors.greetingMessage.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="scenario">Scenario (Optional)</Label>
                        <Textarea id="scenario" {...register('scenario')} placeholder="The context or setting for interaction (e.g., 'You meet them in a bustling tavern...')" disabled={loading} rows={4} className={errors.scenario ? 'border-destructive' : ''} />
                        {errors.scenario && <p className="text-sm text-destructive">{errors.scenario.message}</p>}
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <Label htmlFor="category">Category *</Label>
                              <Controller
                                control={control}
                                name="category"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                        <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                             />
                             {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                         </div>

                         <div className="space-y-2">
                             <Label htmlFor="language">Language (Optional)</Label>
                             <Input id="language" {...register('language')} placeholder="e.g., en, es, ja" disabled={loading} className={errors.language ? 'border-destructive' : ''} />
                             {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
                         </div>
                     </div>

                     <div className="space-y-2">
                         <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                          {/* Use Controller to manage transformation */}
                        <Controller
                             name="tags"
                             control={control}
                             defaultValue={[]} // Ensure default is array
                             render={({ field }) => (
                                 <Input
                                     id="tags"
                                     placeholder="e.g., friendly, knowledgeable, wizard"
                                     // Convert array back to string for input display
                                     value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                     onChange={(e) => {
                                         // Update the form state with the processed array
                                         const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                                         field.onChange(tagsArray); // Store as array
                                     }}
                                     disabled={loading}
                                     className={errors.tags ? 'border-destructive' : ''}
                                 />
                             )}
                         />
                         {errors.tags && <p className="text-sm text-destructive">{typeof errors.tags.message === 'string' ? errors.tags.message : 'Invalid tags format'}</p>}
                         <p className="text-xs text-muted-foreground">Helps users find your character.</p>
                    </div>

                     {/* Voice ID (Placeholder for V2/V3) */}
                    {/* <div className="space-y-2">
                        <Label htmlFor="voiceId">Voice ID (Optional)</Label>
                        <Input id="voiceId" {...register('voiceId')} placeholder="Enter voice identifier (if known)" disabled={loading} />
                         <p className="text-xs text-muted-foreground">Select a voice for voice interactions.</p>
                    </div> */}


                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading || isUploading} className="w-full">
                         {loading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                         {loading ? 'Saving...' : (mode === 'create' ? 'Submit for Review' : 'Save Changes')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
