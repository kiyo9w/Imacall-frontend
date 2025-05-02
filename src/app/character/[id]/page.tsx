'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { CharacterPublic, CharacterReview } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Phone, Loader2, AlertCircle, User as UserIcon, Info, BookOpen, Languages, Mic, Sparkles, Brain, Smile, Users } from 'lucide-react'; // Added more icons
import { Separator } from '@/components/ui/separator';
// Review features removed as API doesn't support yet
// import { RatingInput } from '@/components/character/RatingInput';
// import { ReviewForm } from '@/components/character/ReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion" // Import Accordion

// Star rating display component
function StarRatingDisplay({ rating, count, size = "md" }: { rating: number; count?: number; size?: "sm" | "md" }) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    const starSizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className={cn(starSizeClass, "text-yellow-500 fill-yellow-400")} />
            ))}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className={cn(starSizeClass, "text-muted-foreground/40")} />
            ))}
            {count !== undefined && count > 0 && (
                <span className={cn("ml-2 text-sm text-muted-foreground", size === 'sm' && 'text-xs')}>
                    ({count} {count === 1 ? 'rating' : 'ratings'})
                </span>
            )}
        </div>
    );
}

// Helper to display text sections nicely
function DetailSection({ title, content, icon: Icon }: { title: string; content?: string | null; icon?: React.ElementType }) {
    if (!content) return null;
    return (
        <div className="space-y-1">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {title}
            </h4>
            <p className="text-foreground whitespace-pre-wrap text-sm">{content}</p>
        </div>
    );
}


export default function CharacterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const characterId = params.id as string;

    const [character, setCharacter] = useState<CharacterPublic | null>(null);
    // const [reviews, setReviews] = useState<CharacterReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!characterId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get<CharacterPublic>(`/characters/${characterId}`);
                setCharacter(response.data);
            } catch (err) {
                console.error("Error fetching character details:", err);
                 if (axios.isAxiosError(err) && err.response?.status === 404) {
                     setError('Character not found or is not publicly available.');
                 } else {
                     setError("Failed to load character details. Please try again.");
                 }
                setCharacter(null);
            } finally {
                setLoading(false);
            }
        };
        fetchCharacter();
    }, [characterId]);


     const renderLoadingSkeleton = () => (
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse"> {/* Wider layout */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column Skeleton */}
                <div className="md:col-span-1 space-y-6">
                    <Skeleton className="aspect-[3/4] w-full bg-muted rounded-xl shadow-lg" />
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full bg-muted rounded-lg" />
                        <Skeleton className="h-12 w-full bg-muted rounded-lg" />
                    </div>
                     <Skeleton className="h-20 w-full bg-muted rounded-lg" />
                </div>
                {/* Right Column Skeleton */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="shadow-lg rounded-xl">
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4 bg-muted rounded-md" />
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Skeleton className="h-5 w-20 bg-muted rounded-full" />
                                <Skeleton className="h-5 w-24 bg-muted rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-40 mt-4 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full bg-muted rounded" />
                             <Skeleton className="h-4 w-5/6 mt-2 bg-muted rounded" />
                            <Separator className="my-6 bg-muted/50"/>
                             <div className="space-y-4">
                                 <Skeleton className="h-4 w-1/4 bg-muted rounded"/>
                                 <Skeleton className="h-10 w-full bg-muted rounded"/>
                                 <Skeleton className="h-4 w-1/4 bg-muted rounded"/>
                                 <Skeleton className="h-10 w-full bg-muted rounded"/>
                             </div>
                        </CardContent>
                    </Card>
                     <Card className="shadow-lg rounded-xl">
                        <CardHeader>
                            <Skeleton className="h-7 w-1/3 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full bg-muted rounded-lg" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
     );

    if (loading) {
        return renderLoadingSkeleton();
    }

    if (error) {
         return (
             <div className="container mx-auto px-4 py-16 text-center">
                 <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                 <h2 className="text-2xl font-semibold mb-2">Error Loading Character</h2>
                 <p className="text-muted-foreground">{error}</p>
                 <Button onClick={() => router.back()} variant="outline" className="mt-6">Go Back</Button>
             </div>
         );
    }

     if (!character) {
         return <p className="text-center py-16 text-muted-foreground">Character data could not be loaded.</p>;
     }


    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl"> {/* Wider layout */}
            <div className="grid md:grid-cols-3 gap-8 items-start"> {/* Align items start */}

                {/* Left Column: Image, Actions, Quick Info */}
                <div className="md:col-span-1 space-y-6 sticky top-24"> {/* Make left column sticky */}
                    <Card className="overflow-hidden shadow-xl rounded-2xl border border-border/40">
                        <div className="aspect-[3/4] relative bg-gradient-to-br from-muted via-secondary to-muted">
                             <Image
                                data-ai-hint={`${character.category || ''} character portrait ${character.tags?.join(' ') || ''}`}
                                src={character.image_url || `https://picsum.photos/seed/${character.id}/600/800`}
                                alt={character.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 400px"
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-500 ease-in-out hover:scale-105"
                                priority // Load image faster
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                        </div>
                    </Card>

                     {/* Interaction Buttons */}
                    <div className="space-y-3">
                        <Button asChild size="lg" className="w-full shadow-lg hover:shadow-primary/40 transition-shadow duration-300 group">
                            <Link href={`/character/${character.id}/chat`}>
                                <MessageSquare className="mr-2 h-5 w-5 group-hover:animate-pulse" /> Chat Now
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full shadow hover:shadow-md transition-shadow border-border/60" disabled>
                            <Phone className="mr-2 h-5 w-5" /> Voice Call (Soon)
                        </Button>
                    </div>

                     {/* Quick Info Card */}
                    <Card className="shadow-md rounded-xl border border-border/40 bg-card/90 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Quick Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={character.status === 'Approved' ? 'default' : 'secondary'} className="capitalize">{character.status}</Badge>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Visibility</span>
                                 <Badge variant={character.is_public ? 'outline' : 'secondary'} className="border-dashed">
                                    {character.is_public ? 'Public' : 'Private'}
                                 </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Creator ID</span>
                                <span className="font-mono text-xs truncate">{character.creator_id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Popularity</span>
                                <span className="font-semibold flex items-center gap-1">
                                    <Users className="h-4 w-4 text-primary/70"/>
                                    {character.popularity_score}
                                </span>
                            </div>
                             {character.updatedAt && (
                                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span className="text-xs">{formatDistanceToNow(parseISO(character.updatedAt), { addSuffix: true })}</span>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details and Personality */}
                <div className="md:col-span-2 space-y-8">
                     <Card className="shadow-lg rounded-xl border border-border/40">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-3xl font-bold mb-1">{character.name}</CardTitle>
                             {/* Description below title */}
                             <CardDescription className="text-base text-foreground/90">{character.description || 'No description provided.'}</CardDescription>
                             {/* Tags and Category */}
                             <div className="flex flex-wrap gap-2 pt-3">
                                {character.category && <Badge className="text-xs">{character.category}</Badge>}
                                {character.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                            </div>
                             {/* Rating */}
                             <div className="pt-4">
                                 {(character.averageRating !== undefined && character.averageRating !== null && character.averageRating >= 0) || (character.ratingCount !== undefined && character.ratingCount > 0) ? (
                                     <StarRatingDisplay rating={character.averageRating ?? 0} count={character.ratingCount || 0} />
                                 ) : (
                                     <p className="text-sm text-muted-foreground italic">No ratings yet.</p>
                                 )}
                            </div>
                        </CardHeader>

                        <Separator className="bg-border/40" />

                        <CardContent className="pt-6 space-y-5">
                              <DetailSection title="Greeting" content={character.greeting_message ? `"${character.greeting_message}"` : '"Hello!"'} icon={Sparkles}/>
                              <DetailSection title="Scenario" content={character.scenario} icon={BookOpen} />
                              {character.language && <DetailSection title="Language" content={character.language} icon={Languages} />}
                              {character.voice_id && <DetailSection title="Voice ID" content={character.voice_id} icon={Mic} />}
                        </CardContent>
                    </Card>

                     {/* Personality Accordion */}
                    <Card className="shadow-lg rounded-xl border border-border/40">
                         <CardHeader>
                             <CardTitle className="text-2xl">Personality Deep Dive</CardTitle>
                             <CardDescription>Learn more about the character's inner workings.</CardDescription>
                         </CardHeader>
                         <CardContent>
                             <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="item-1">
                                    <AccordionTrigger>Background & Backstory</AccordionTrigger>
                                    <AccordionContent className="text-sm text-foreground/90 whitespace-pre-wrap">
                                      {character.background || "No background provided."}
                                    </AccordionContent>
                                  </AccordionItem>
                                  <AccordionItem value="item-2">
                                    <AccordionTrigger>Personality Traits</AccordionTrigger>
                                    <AccordionContent className="text-sm text-foreground/90 whitespace-pre-wrap">
                                      {character.personality_traits || "Not specified."}
                                    </AccordionContent>
                                  </AccordionItem>
                                   <AccordionItem value="item-3">
                                    <AccordionTrigger>Writing Style</AccordionTrigger>
                                    <AccordionContent className="text-sm text-foreground/90 whitespace-pre-wrap">
                                      {character.writing_style || "Not specified."}
                                    </AccordionContent>
                                  </AccordionItem>
                                  <AccordionItem value="item-4">
                                     <AccordionTrigger>Knowledge Scope</AccordionTrigger>
                                     <AccordionContent className="text-sm text-foreground/90 whitespace-pre-wrap">
                                        {character.knowledge_scope || "General knowledge."}
                                     </AccordionContent>
                                  </AccordionItem>
                                  <AccordionItem value="item-5">
                                     <AccordionTrigger>Quirks</AccordionTrigger>
                                     <AccordionContent className="text-sm text-foreground/90 whitespace-pre-wrap">
                                         {character.quirks || "None specified."}
                                     </AccordionContent>
                                  </AccordionItem>
                                  <AccordionItem value="item-6">
                                      <AccordionTrigger>Emotional Range</AccordionTrigger>
                                      <AccordionContent className="text-sm text-foreground/90 whitespace-pre-wrap">
                                         {character.emotional_range || "Standard emotional range."}
                                     </AccordionContent>
                                  </AccordionItem>
                            </Accordion>
                         </CardContent>
                     </Card>

                    {/* Ratings & Reviews Section Placeholder */}
                     <Card className="shadow-lg rounded-xl border border-border/40">
                        <CardHeader>
                             <CardTitle className="text-2xl">Ratings & Reviews</CardTitle>
                             <CardDescription>See what others think.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             <div className="bg-gradient-to-r from-secondary/30 to-muted/30 p-4 rounded-lg border border-dashed border-border/60 mb-6">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
                                    <p className="text-sm text-muted-foreground">
                                         Rating and review features are coming soon!
                                    </p>
                                </div>
                             </div>
                         </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
}