'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import {
    CharacterPublic,
    CharacterFormData,
    CharacterCategory,
    // CharacterStatus, // Status not directly set by user form
    CharacterCreate,
    CharacterUpdateAdmin,
 } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Separator } from '../ui/separator';

// Updated Zod schema including new fields
const characterFormSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
    greetingMessage: z.string().min(5, 'Greeting must be at least 5 characters').max(500, 'Greeting cannot exceed 500 characters').optional().nullable(),
    scenario: z.string().max(1000, 'Scenario cannot exceed 1000 characters').optional().nullable(),
    category: z.union([z.nativeEnum(CharacterCategory), z.string()]).optional(), // Allow enum or string
    language: z.string().max(10, 'Language code too long (e.g., en, es-MX)').optional().nullable(),
    tags: z.string().optional(), // Comma-separated string
    imageUrl: z.string().url('Must be a valid URL').optional().nullable(), // For preview/URL input

    // New fields validation
    voice_id: z.string().max(100, 'Voice ID too long').optional().nullable(),
    personality_traits: z.string().max(2000, 'Personality Traits cannot exceed 2000 characters').optional().nullable(),
    writing_style: z.string().max(2000, 'Writing Style cannot exceed 2000 characters').optional().nullable(),
    background: z.string().max(5000, 'Background cannot exceed 5000 characters').optional().nullable(),
    knowledge_scope: z.string().max(2000, 'Knowledge Scope cannot exceed 2000 characters').optional().nullable(),
    quirks: z.string().max(1000, 'Quirks cannot exceed 1000 characters').optional().nullable(),
    emotional_range: z.string().max(1000, 'Emotional Range cannot exceed 1000 characters').optional().nullable(),
});


type CharacterFormInputs = z.infer<typeof characterFormSchema>;

interface CharacterFormProps {
    mode: 'create' | 'edit';
    existingCharacter?: CharacterPublic;
}

const CATEGORIES = Object.values(CharacterCategory);


export function CharacterForm({ mode, existingCharacter }: CharacterFormProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(existingCharacter?.image_url || null);


     // Pre-fill form in edit mode using CharacterPublic fields
    const defaultValues: CharacterFormData = {
        name: existingCharacter?.name || '',
        description: existingCharacter?.description || null,
        greetingMessage: existingCharacter?.greeting_message || null,
        scenario: existingCharacter?.scenario || null,
        category: existingCharacter?.category || undefined,
        language: existingCharacter?.language || null,
        tags: existingCharacter?.tags?.join(', ') || '', // Join array to string for input
        imageUrl: existingCharacter?.image_url || null, // Keep for display

        // New fields defaults
        voice_id: existingCharacter?.voice_id || null,
        personality_traits: existingCharacter?.personality_traits || null,
        writing_style: existingCharacter?.writing_style || null,
        background: existingCharacter?.background || null,
        knowledge_scope: existingCharacter?.knowledge_scope || null,
        quirks: existingCharacter?.quirks || null,
        emotional_range: existingCharacter?.emotional_range || null,
    };

    const { register, handleSubmit, control, setValue, watch, formState: { errors, isDirty } } = useForm<CharacterFormData>({
        resolver: zodResolver(characterFormSchema),
        defaultValues: defaultValues
    });

    // Set initial avatar preview in edit mode
    useEffect(() => {
        if (mode === 'edit' && existingCharacter?.image_url) {
            setAvatarPreview(existingCharacter.image_url);
            setValue('imageUrl', existingCharacter.image_url, { shouldDirty: false });
        }
    }, [mode, existingCharacter, setValue]);


    const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setValue('imageUrl', url, { shouldDirty: true });
        setAvatarPreview(url);
    };


    const onSubmit: SubmitHandler<CharacterFormData> = async (data) => {
         if (!user) {
             setError("You must be logged in to submit a character.");
             return;
         }

         // Basic check if form state is dirty
         if (mode === 'edit' && !isDirty) {
            toast({ title: "No Changes", description: "No changes were detected to save." });
            return;
         }

        setLoading(true);
        setError(null);

         // Transform tags string to array before saving
         const tagsArray = data.tags
           ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
           : undefined;


        try {
            // Logic for Create -> POST /characters/submit
            if (mode === 'create') {
                 const createData: CharacterCreate = {
                    name: data.name,
                    description: data.description || null,
                    image_url: data.imageUrl || null,
                    greeting_message: data.greetingMessage || null,
                    category: data.category || null,
                    tags: tagsArray || null,
                    scenario: data.scenario || null,
                    language: data.language || null,
                    // Add new fields for creation
                    voice_id: data.voice_id || null,
                    personality_traits: data.personality_traits || null,
                    writing_style: data.writing_style || null,
                    background: data.background || null,
                    knowledge_scope: data.knowledge_scope || null,
                    quirks: data.quirks || null,
                    emotional_range: data.emotional_range || null,
                    // is_public default is handled by backend
                 };

                const response = await apiClient.post<CharacterPublic>('/characters/submit', createData);

                 toast({
                    title: "Character Submitted!",
                    description: `${response.data.name} has been submitted for review.`,
                });
                 router.push('/account/characters'); // Redirect to dashboard

            // Logic for Edit -> PUT /admin/characters/{id}
            } else if (mode === 'edit' && existingCharacter) {
                 // Construct update payload, only including changed fields
                 const updateData: Partial<CharacterUpdateAdmin> = {};

                 if (data.name !== existingCharacter.name) updateData.name = data.name;
                 if (data.description !== existingCharacter.description) updateData.description = data.description || null;
                 if (data.imageUrl !== existingCharacter.image_url) updateData.image_url = data.imageUrl || null;
                 if (data.greetingMessage !== existingCharacter.greeting_message) updateData.greeting_message = data.greetingMessage || null;
                 if (data.category !== existingCharacter.category) updateData.category = data.category || null;
                 // Compare tag arrays carefully
                 const currentTags = existingCharacter.tags || [];
                 const newTags = tagsArray || [];
                 if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) updateData.tags = newTags.length > 0 ? newTags : null;
                 if (data.scenario !== existingCharacter.scenario) updateData.scenario = data.scenario || null;
                 if (data.language !== existingCharacter.language) updateData.language = data.language || null;
                 if (data.voice_id !== existingCharacter.voice_id) updateData.voice_id = data.voice_id || null;
                 if (data.personality_traits !== existingCharacter.personality_traits) updateData.personality_traits = data.personality_traits || null;
                 if (data.writing_style !== existingCharacter.writing_style) updateData.writing_style = data.writing_style || null;
                 if (data.background !== existingCharacter.background) updateData.background = data.background || null;
                 if (data.knowledge_scope !== existingCharacter.knowledge_scope) updateData.knowledge_scope = data.knowledge_scope || null;
                 if (data.quirks !== existingCharacter.quirks) updateData.quirks = data.quirks || null;
                 if (data.emotional_range !== existingCharacter.emotional_range) updateData.emotional_range = data.emotional_range || null;

                 // Handle status transition if resubmitting a rejected character
                 if (existingCharacter.status === 'Rejected') {
                     updateData.status = 'Pending';
                     updateData.admin_feedback = null; // Clear feedback on resubmission
                 }

                  // Check if there's actually anything to update
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
                     const details = err.response.data?.detail;
                     if (Array.isArray(details)) {
                        errorMsg = `Validation Error: ${details[0]?.loc?.join('.')} - ${details[0]?.msg || 'Invalid data'}`;
                     } else {
                        errorMsg = details || 'Validation Error: Invalid data';
                     }
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
        <Card className="max-w-3xl mx-auto shadow-xl border border-border/40 rounded-2xl overflow-hidden"> {/* Wider card */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader className="bg-gradient-to-br from-card to-secondary/10 dark:to-secondary/5 border-b border-border/40 p-6">
                     <CardTitle className="text-2xl">{mode === 'create' ? 'Create New AI Character' : `Editing: ${existingCharacter?.name}`}</CardTitle>
                    <CardDescription>
                        {mode === 'create'
                            ? 'Craft a unique personality. Your submission will be reviewed.'
                            : 'Refine the details of your character.'}
                         {mode === 'edit' && existingCharacter?.status === 'Rejected' && ' Resubmitting will send it for review again.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Section 1: Core Identity */}
                    <fieldset className="space-y-6 border border-border/40 rounded-lg p-4 pt-2">
                        <legend className="text-sm font-medium text-muted-foreground px-1 -translate-y-3 bg-card">Core Identity</legend>

                        {/* Avatar URL */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Avatar className="h-24 w-24 border flex-shrink-0">
                                <AvatarImage src={avatarPreview || undefined} alt="Character Avatar Preview"/>
                                <AvatarFallback className="text-muted-foreground">
                                    <ImageIcon size={40}/>
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow space-y-2 w-full">
                                <Label htmlFor="imageUrl">Character Image URL (Optional)</Label>
                                <Input
                                    id="imageUrl"
                                    type="url"
                                    placeholder="https://example.com/image.png"
                                    {...register('imageUrl')}
                                    disabled={loading}
                                    className={errors.imageUrl ? 'border-destructive' : ''}
                                />
                                {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                                <p className="text-xs text-muted-foreground">Enter a direct URL to the character's image.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" {...register('name')} placeholder="Character's full name" disabled={loading} className={errors.name ? 'border-destructive' : ''} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Short Description (Tagline)</Label>
                            <Textarea id="description" {...register('description')} placeholder="A brief tagline or summary (max 500 chars)" disabled={loading} rows={2} className={errors.description ? 'border-destructive' : ''} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => field.onChange(value as CharacterCategory | string)}
                                            value={field.value || ''}
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
                                 <Label htmlFor="tags">Tags (comma-separated)</Label>
                                 <Input
                                     id="tags"
                                     placeholder="e.g., friendly, wizard, sci-fi"
                                     {...register('tags')}
                                     disabled={loading}
                                     className={errors.tags ? 'border-destructive' : ''}
                                 />
                                 {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
                            </div>
                        </div>
                    </fieldset>


                     {/* Section 2: Interaction Details */}
                    <fieldset className="space-y-6 border border-border/40 rounded-lg p-4 pt-2">
                         <legend className="text-sm font-medium text-muted-foreground px-1 -translate-y-3 bg-card">Interaction Details</legend>

                        <div className="space-y-2">
                            <Label htmlFor="greetingMessage">Greeting Message *</Label>
                            <Textarea id="greetingMessage" {...register('greetingMessage')} placeholder="The first thing the character says (min 5, max 500 chars)" disabled={loading} rows={3} className={errors.greetingMessage ? 'border-destructive' : ''} />
                            {errors.greetingMessage && <p className="text-sm text-destructive">{errors.greetingMessage.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scenario">Scenario (Optional)</Label>
                            <Textarea id="scenario" {...register('scenario')} placeholder="The context or setting for interaction (e.g., 'You meet them in a bustling tavern...')" disabled={loading} rows={4} className={errors.scenario ? 'border-destructive' : ''} />
                            {errors.scenario && <p className="text-sm text-destructive">{errors.scenario.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="language">Primary Language (Optional)</Label>
                                <Input id="language" {...register('language')} placeholder="e.g., en, es, ja" disabled={loading} className={errors.language ? 'border-destructive' : ''} />
                                {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
                            </div>
                             <div className="space-y-2">
                                 <Label htmlFor="voice_id">Voice ID (Optional)</Label>
                                 <Input id="voice_id" {...register('voice_id')} placeholder="Reference ID for TTS voice" disabled={loading} className={errors.voice_id ? 'border-destructive' : ''} />
                                 {errors.voice_id && <p className="text-sm text-destructive">{errors.voice_id.message}</p>}
                             </div>
                         </div>
                     </fieldset>


                     {/* Section 3: Personality & Background (New Fields) */}
                     <fieldset className="space-y-6 border border-border/40 rounded-lg p-4 pt-2">
                         <legend className="text-sm font-medium text-muted-foreground px-1 -translate-y-3 bg-card">Personality & Background</legend>

                         <div className="space-y-2">
                             <Label htmlFor="personality_traits">Personality Traits (Optional)</Label>
                             <Textarea id="personality_traits" {...register('personality_traits')} placeholder="Describe key personality aspects (e.g., curious, grumpy, optimistic)" disabled={loading} rows={4} className={errors.personality_traits ? 'border-destructive' : ''} />
                             {errors.personality_traits && <p className="text-sm text-destructive">{errors.personality_traits.message}</p>}
                         </div>

                         <div className="space-y-2">
                             <Label htmlFor="writing_style">Writing Style (Optional)</Label>
                             <Textarea id="writing_style" {...register('writing_style')} placeholder="Describe how the character communicates (e.g., formal, slang, verbose, uses emojis)" disabled={loading} rows={4} className={errors.writing_style ? 'border-destructive' : ''} />
                             {errors.writing_style && <p className="text-sm text-destructive">{errors.writing_style.message}</p>}
                         </div>

                         <div className="space-y-2">
                             <Label htmlFor="background">Background / Backstory (Optional)</Label>
                             <Textarea id="background" {...register('background')} placeholder="Detailed history or context for the character" disabled={loading} rows={6} className={errors.background ? 'border-destructive' : ''} />
                             {errors.background && <p className="text-sm text-destructive">{errors.background.message}</p>}
                         </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <Label htmlFor="knowledge_scope">Knowledge Scope (Optional)</Label>
                                 <Textarea id="knowledge_scope" {...register('knowledge_scope')} placeholder="What topics does the character know about?" disabled={loading} rows={3} className={errors.knowledge_scope ? 'border-destructive' : ''} />
                                 {errors.knowledge_scope && <p className="text-sm text-destructive">{errors.knowledge_scope.message}</p>}
                             </div>

                             <div className="space-y-2">
                                 <Label htmlFor="quirks">Quirks (Optional)</Label>
                                 <Textarea id="quirks" {...register('quirks')} placeholder="Unique habits or unusual behaviors" disabled={loading} rows={3} className={errors.quirks ? 'border-destructive' : ''} />
                                 {errors.quirks && <p className="text-sm text-destructive">{errors.quirks.message}</p>}
                             </div>
                         </div>

                         <div className="space-y-2">
                             <Label htmlFor="emotional_range">Emotional Range (Optional)</Label>
                             <Textarea id="emotional_range" {...register('emotional_range')} placeholder="Describe the character's typical emotional responses" disabled={loading} rows={3} className={errors.emotional_range ? 'border-destructive' : ''} />
                             {errors.emotional_range && <p className="text-sm text-destructive">{errors.emotional_range.message}</p>}
                         </div>
                     </fieldset>

                    {/* Public/Private toggle might be admin-only, confirm API capabilities */}

                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border/40 p-4">
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto ml-auto">
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                         {loading ? 'Saving...' : (mode === 'create' ? 'Submit for Review' : 'Save Changes')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}