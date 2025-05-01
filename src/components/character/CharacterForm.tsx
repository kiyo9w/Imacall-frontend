'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient'; // Use API client
import { useAuth } from '@/contexts/AuthContext';
import {
    CharacterPublic,
    CharacterFormData,
    CharacterCategory,
    CharacterStatus,
    CharacterCreate,
    CharacterUpdateAdmin, // Use admin update type, assuming user updates hit this with permission checks
 } from '@/types/character'; // Use API types
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react'; // Removed Bot, added Upload
import { Input as ShadInput } from "@/components/ui/input"; // Renamed ShadCN input
import { cn } from '@/lib/utils';
import axios from 'axios'; // For error handling

// Zod schema for V1 form data mapped from API types
const characterFormSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters').optional().nullable(), // Match potential null from API/update
    greetingMessage: z.string().min(5, 'Greeting must be at least 5 characters').max(500, 'Greeting cannot exceed 500 characters').optional().nullable(), // Match potential null from API/update
    scenario: z.string().max(1000, 'Scenario cannot exceed 1000 characters').optional().nullable(),
    category: z.nativeEnum(CharacterCategory).optional(), // Make optional as it might not be required in create/update
    language: z.string().max(10, 'Language code too long (e.g., en, es-MX)').optional().nullable(),
    tags: z.string().optional(), // Keep as string for form input, transform on submit
    // imageUrl is handled via state, not directly in the form data object passed to react-hook-form
});


type CharacterFormInputs = z.infer<typeof characterFormSchema>;

interface CharacterFormProps {
    mode: 'create' | 'edit';
    // Use CharacterPublic as it's what we fetch from the API
    existingCharacter?: CharacterPublic;
}

const CATEGORIES = Object.values(CharacterCategory);


export function CharacterForm({ mode, existingCharacter }: CharacterFormProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    // Use image_url from the API type
    const [avatarPreview, setAvatarPreview] = useState<string | null>(existingCharacter?.image_url || null);
    // Avatar upload is not in the current API spec, remove related state/logic
    // const [isUploading, setIsUploading] = useState(false);
    // const [removeAvatar, setRemoveAvatar] = useState(false);

     // Pre-fill form in edit mode using CharacterPublic fields
    const defaultValues: CharacterFormData = {
        name: existingCharacter?.name || '',
        description: existingCharacter?.description || '',
        greetingMessage: existingCharacter?.greeting_message || '',
        scenario: '', // Assuming scenario isn't directly fetched in CharacterPublic, add if it is
        category: existingCharacter?.category || undefined,
        language: '', // Assuming language isn't directly fetched, add if it is
        tags: existingCharacter?.tags?.join(', ') || '', // Join array to string for input
        imageUrl: existingCharacter?.image_url || null, // Keep for display
    };

    const { register, handleSubmit, control, setValue, watch, formState: { errors, isDirty } } = useForm<CharacterFormData>({
        resolver: zodResolver(characterFormSchema),
        defaultValues: defaultValues
    });

    // Set initial avatar preview in edit mode
    useEffect(() => {
        if (mode === 'edit' && existingCharacter?.image_url) {
            setAvatarPreview(existingCharacter.image_url);
        }
    }, [mode, existingCharacter]);


    // Avatar change/upload/remove logic removed as it's not in API spec.
    // If image_url needs to be updated via a URL input:
    const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setValue('imageUrl', url, { shouldDirty: true }); // Update hidden form value if needed for submission
        setAvatarPreview(url); // Update preview
    };


    const onSubmit: SubmitHandler<CharacterFormData> = async (data) => {
         if (!user) {
             setError("You must be logged in to submit a character.");
             return;
         }

         // Check if anything actually changed in edit mode
         // Compare with existingCharacter data, needs careful handling if types differ slightly
         const hasMeaningfulChange = isDirty; // Simple check for now

         if (mode === 'edit' && !hasMeaningfulChange) {
            toast({ title: "No Changes", description: "No changes were detected." });
            return;
         }


        setLoading(true);
        setError(null);

         // Transform tags string to array before saving
         const tagsArray = data.tags
           ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
           : undefined; // Use undefined if empty/not provided, matching potential API schema


        try {
            // Logic for Create -> POST /characters/submit
            if (mode === 'create') {
                 const createData: CharacterCreate = {
                    name: data.name,
                    description: data.description || null,
                    // Use the URL from the input/state if image URL is managed that way
                    image_url: avatarPreview || null, // Assuming avatarPreview holds the URL
                    greeting_message: data.greetingMessage || null,
                    // Add other fields if they are part of CharacterCreate schema
                    category: data.category || null,
                    tags: tagsArray || null,
                    scenario: data.scenario || null,
                    language: data.language || null,
                 };

                const response = await apiClient.post<CharacterPublic>('/characters/submit', createData);

                 toast({
                    title: "Character Submitted!",
                    description: `${response.data.name} has been submitted for review.`,
                });
                 router.push('/account/characters'); // Redirect to dashboard


            // Logic for Edit -> PUT /admin/characters/{id} (assuming user has permission)
            } else if (mode === 'edit' && existingCharacter) {
                 const updateData: CharacterUpdateAdmin = {
                    name: data.name !== existingCharacter.name ? data.name : undefined,
                    description: data.description !== existingCharacter.description ? (data.description || null) : undefined,
                    image_url: avatarPreview !== existingCharacter.image_url ? (avatarPreview || null) : undefined,
                    greeting_message: data.greetingMessage !== existingCharacter.greeting_message ? (data.greetingMessage || null) : undefined,
                     // Add other fields if they are part of CharacterUpdateAdmin schema and have changed
                    category: data.category !== existingCharacter.category ? (data.category || null) : undefined,
                    tags: tagsArray, // Send updated tags array or undefined/null
                    // scenario: data.scenario !== existingCharacter.scenario ? (data.scenario || null) : undefined, // Add if applicable
                    // language: data.language !== existingCharacter.language ? (data.language || null) : undefined, // Add if applicable

                    // If resubmitting a 'Rejected' character, API should handle status change to 'Pending'
                     status: existingCharacter.status === 'Rejected' ? 'Pending' : undefined, // Explicitly set to Pending if was Rejected
                    // adminFeedback: existingCharacter.status === 'Rejected' ? null : undefined, // Clear feedback if resubmitting
                 };

                  // Remove undefined fields before sending
                  Object.keys(updateData).forEach(key => updateData[key as keyof CharacterUpdateAdmin] === undefined && delete updateData[key as keyof CharacterUpdateAdmin]);


                 // Check if there's actually anything to update after removing undefined
                  if (Object.keys(updateData).length === 0) {
                      toast({ title: "No Changes", description: "No effective changes to save." });
                      setLoading(false);
                      return;
                  }


                 // Use PUT for update as per API spec
                 const response = await apiClient.put<CharacterPublic>(`/admin/characters/${existingCharacter.id}`, updateData);

                 toast({
                    title: "Character Updated!",
                    description: `${response.data.name} has been updated.`,
                });
                 router.push('/account/characters'); // Redirect to dashboard
            }

        } catch (err: any) {
            console.error(`Error ${mode === 'create' ? 'submitting' : 'updating'} character:`, err);
             let errorMsg = `Failed to ${mode} character. Please try again.`;
             if (axios.isAxiosError(err) && err.response) {
                 if (err.response.status === 422) {
                     errorMsg = `Validation Error: ${err.response.data?.detail?.[0]?.msg || 'Invalid data'}`;
                 } else if (err.response.status === 403) {
                     errorMsg = "You do not have permission for this action.";
                 } else if (err.response.status === 401) {
                     errorMsg = "Authentication error. Please log in again.";
                 } else if (err.response.status === 404) {
                      errorMsg = "Character not found (for update).";
                 }
             }
            setError(errorMsg);
            toast({
                 title: `${mode === 'create' ? 'Submission' : 'Update'} Failed`,
                 description: errorMsg,
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
            {/* Use CharacterFormData for the form */}
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

                    {/* Avatar Section - Use URL input if image upload isn't supported */}
                     <div className="flex items-center gap-4">
                         <Avatar className="h-24 w-24 border">
                             <AvatarImage src={avatarPreview || undefined} alt="Character Avatar Preview"/>
                             <AvatarFallback className="text-muted-foreground">
                                 <ImageIcon size={40}/>
                             </AvatarFallback>
                         </Avatar>
                         <div className="flex-grow space-y-2">
                             <Label htmlFor="imageUrl">Character Image URL (Optional)</Label>
                             <ShadInput
                                 id="imageUrl"
                                 type="url"
                                 placeholder="https://example.com/image.png"
                                 value={avatarPreview || ''} // Bind value to avatarPreview state
                                 onChange={handleImageUrlChange} // Update state on change
                                 disabled={loading}
                             />
                             <p className="text-xs text-muted-foreground">Enter a direct URL to the character's image.</p>
                         </div>
                     </div>

                    {/* Basic Fields */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" {...register('name')} placeholder="Character's full name" disabled={loading} className={errors.name ? 'border-destructive' : ''} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                         {/* Adjusted description based on schema */}
                        <Label htmlFor="description">Short Description</Label>
                        <Textarea id="description" {...register('description')} placeholder="A brief tagline or summary (max 500 chars)" disabled={loading} rows={3} className={errors.description ? 'border-destructive' : ''} />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>

                     {/* Detail Fields */}
                     <div className="space-y-2">
                         {/* Adjusted greeting based on schema */}
                        <Label htmlFor="greetingMessage">Greeting Message</Label>
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
                              {/* Adjusted category based on schema */}
                             <Label htmlFor="category">Category</Label>
                              <Controller
                                control={control}
                                name="category"
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(value) => field.onChange(value as CharacterCategory)} // Ensure value is CharacterCategory
                                        value={field.value || ''} // Handle undefined case
                                        disabled={loading}
                                    >
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
                              {/* Adjusted language based on schema */}
                             <Label htmlFor="language">Language (Optional)</Label>
                             <Input id="language" {...register('language')} placeholder="e.g., en, es, ja" disabled={loading} className={errors.language ? 'border-destructive' : ''} />
                             {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
                         </div>
                     </div>

                     <div className="space-y-2">
                         <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                         <Input
                             id="tags"
                             placeholder="e.g., friendly, knowledgeable, wizard"
                             {...register('tags')}
                             disabled={loading}
                             className={errors.tags ? 'border-destructive' : ''}
                         />
                         {errors.tags && <p className="text-sm text-destructive">{typeof errors.tags.message === 'string' ? errors.tags.message : 'Invalid tags format'}</p>}
                         <p className="text-xs text-muted-foreground">Helps users find your character.</p>
                    </div>

                     {/* Voice ID removed - not in API spec */}

                </CardContent>
                <CardFooter>
                    {/* isUploading removed */}
                    <Button type="submit" disabled={loading} className="w-full">
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                         {loading ? 'Saving...' : (mode === 'create' ? 'Submit for Review' : 'Save Changes')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
