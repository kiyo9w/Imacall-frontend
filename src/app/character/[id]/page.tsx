'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import apiClient from '@/lib/apiClient'; // Import API client
import { CharacterPublic, CharacterReview } from '@/types/character'; // Use API types
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Phone, Loader2, AlertCircle, User as UserIcon, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator'; // Import Separator
// Review submission is removed as API doesn't support it yet
// import { RatingInput } from '@/components/character/RatingInput';
// import { ReviewForm } from '@/components/character/ReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns'; // Import parseISO
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import axios from 'axios'; // For error handling
import { cn } from '@/lib/utils'; // Import cn

// Star rating display component
function StarRatingDisplay({ rating, count, size = "md" }: { rating: number; count?: number; size?: "sm" | "md" }) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5; // Not standard, usually round down for display
    const emptyStars = 5 - fullStars; // Correct calculation
    const starSizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className={cn(starSizeClass, "text-yellow-500 fill-yellow-400")} />
            ))}
            {/* Half star display removed for simplicity - uncommon in UIs */}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className={cn(starSizeClass, "text-muted-foreground/40")} />
            ))}
            {count !== undefined && count > 0 && <span className="ml-2 text-sm text-muted-foreground">({count} {count === 1 ? 'rating' : 'ratings'})</span>}
        </div>
    );
}


export default function CharacterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const characterId = params.id as string;

    const [character, setCharacter] = useState<CharacterPublic | null>(null);
    // const [reviews, setReviews] = useState<CharacterReview[]>([]); // Kept for potential future use
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [loadingReviews, setLoadingReviews] = useState(true); // Kept for potential future use

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!characterId) return;

            setLoading(true);
            // setLoadingReviews(true);
            setError(null);

            try {
                const response = await apiClient.get<CharacterPublic>(`/characters/${characterId}`);
                setCharacter(response.data);

                // Fetch reviews if/when API supports it
                // const reviewsResponse = await apiClient.get(`/characters/${characterId}/reviews`);
                // setReviews(reviewsResponse.data.data);

            } catch (err) {
                console.error("Error fetching character details:", err);
                 if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 404) {
                         setError('Character not found or is not publicly available.');
                    } else {
                         setError("Failed to load character details. Please try again.");
                    }
                 } else {
                     setError("An unexpected error occurred.");
                 }
                setCharacter(null);
                // setReviews([]);
            } finally {
                setLoading(false);
                // setLoadingReviews(false);
            }
        };

        fetchCharacter();
    }, [characterId]);

     // handleReviewSubmitted removed

     const renderLoadingSkeleton = () => (
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <Skeleton className="aspect-[3/4] w-full bg-muted rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full bg-muted rounded-md" />
                        <Skeleton className="h-12 w-full bg-muted rounded-md" />
                    </div>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-none border-none">
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4 bg-muted rounded-md" />
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Skeleton className="h-5 w-20 bg-muted rounded-full" />
                                <Skeleton className="h-5 w-24 bg-muted rounded-full" />
                            </div>
                            <Skeleton className="h-5 w-40 mt-3 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full bg-muted rounded" />
                             <Skeleton className="h-4 w-5/6 mt-2 bg-muted rounded" />
                            <Skeleton className="h-4 w-1/2 mt-4 bg-muted rounded" />
                             <Skeleton className="h-4 w-3/4 mt-2 bg-muted rounded" />
                        </CardContent>
                    </Card>
                     <Card className="shadow-none border-none">
                        <CardHeader>
                            <Skeleton className="h-6 w-1/3 bg-muted rounded-md" />
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-4 w-1/2 bg-muted rounded" />
                           <Skeleton className="h-16 w-full mt-4 bg-muted rounded" />
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Image and Actions */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="overflow-hidden shadow-lg sticky top-24"> {/* Make card sticky */}
                        <div className="aspect-[3/4] relative bg-muted">
                             <Image
                                data-ai-hint={`${character.category || ''} character portrait ${character.tags?.join(' ') || ''}`}
                                src={character.image_url || `https://picsum.photos/seed/${character.id}/400/533`} // Adjusted size
                                alt={character.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 300px"
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-300 group-hover:scale-105"
                                priority
                            />
                             {/* Optional: Subtle overlay on image */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                        </div>
                    </Card>
                     {/* Interaction Buttons */}
                    <div className="space-y-3">
                        <Button asChild size="lg" className="w-full shadow-md hover:shadow-lg">
                            <Link href={`/character/${character.id}/chat`}>
                                <MessageSquare className="mr-2 h-5 w-5" /> Chat Now
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full shadow-sm hover:shadow-md" disabled>
                            <Phone className="mr-2 h-5 w-5" /> Voice Call (Coming Soon)
                        </Button>
                    </div>
                </div>

                {/* Right Column: Details and Reviews */}
                <div className="md:col-span-2 space-y-8">
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">{character.name}</CardTitle>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {character.category && <Badge>{character.category}</Badge>}
                                {character.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                            </div>
                             {/* Display Rating */}
                             {(character.averageRating !== undefined && character.averageRating !== null && character.averageRating > 0) || (character.ratingCount && character.ratingCount > 0) ? (
                                 <div className="mt-4">
                                    <StarRatingDisplay rating={character.averageRating ?? 0} count={character.ratingCount || 0} />
                                 </div>
                             ) : (
                                 <p className="text-sm text-muted-foreground mt-4">No ratings yet.</p>
                             )}
                        </CardHeader>
                        <CardContent>
                             <CardDescription className="text-base mb-6">{character.description || 'No description provided.'}</CardDescription>

                             <Separator className="my-6" />

                             <div className="space-y-4">
                                 <div>
                                     <h4 className="font-semibold text-sm text-muted-foreground mb-1 uppercase tracking-wider">Greeting</h4>
                                     <p className="text-foreground italic">
                                         {character.greeting_message ? `"${character.greeting_message}"` : '"Hello!"'}
                                    </p>
                                 </div>
                                  {/* Add more details if available from API */}
                                 {/* <div>
                                     <h4 className="font-semibold text-sm text-muted-foreground mb-1 uppercase tracking-wider">Scenario</h4>
                                     <p className="text-foreground">{character.scenario || 'Not specified'}</p>
                                 </div> */}
                                 <div>
                                     <h4 className="font-semibold text-sm text-muted-foreground mb-1 uppercase tracking-wider">Creator</h4>
                                      {/* Link to creator profile if possible/needed */}
                                     <p className="text-foreground text-sm">ID: {character.creator_id}</p>
                                 </div>
                                  <div>
                                     <h4 className="font-semibold text-sm text-muted-foreground mb-1 uppercase tracking-wider">Status</h4>
                                     <Badge variant={character.status === 'Approved' ? 'default' : 'secondary'}>{character.status}</Badge>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Ratings & Reviews Section Placeholder */}
                     <Card className="shadow-lg">
                        <CardHeader>
                             <CardTitle className="text-2xl">Ratings & Reviews</CardTitle>
                             <CardDescription>What others think of {character.name}.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             <div className="bg-secondary/50 p-4 rounded-md border border-dashed border-border mb-6">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5 text-muted-foreground"/>
                                    <p className="text-sm text-muted-foreground">
                                         Rating and review features are coming soon!
                                    </p>
                                </div>
                             </div>

                              {/* Future Review List */}
                              {/* {loadingReviews ? ( ... ) : reviews.length > 0 ? ( ... reviews.map(...) ... ) : ( ... <p>No reviews yet.</p> ...)} */}

                         </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
}
