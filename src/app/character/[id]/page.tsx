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
import { Star, MessageSquare, Phone, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';
// import { Separator } from '@/components/ui/separator'; // Might not be needed
// RatingInput and ReviewForm removed as review submission isn't in the API spec
// import { RatingInput } from '@/components/character/RatingInput';
// import { ReviewForm } from '@/components/character/ReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns'; // Import parseISO
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import axios from 'axios'; // For error handling

// Star rating display component remains the same
function StarRatingDisplay({ rating, count }: { rating: number; count?: number }) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className="h-5 w-5 text-yellow-500 fill-yellow-400" />
            ))}
            {halfStar && <Star key="half" className="h-5 w-5 text-yellow-500 fill-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className="h-5 w-5 text-muted-foreground/50" />
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
    // Reviews state and related logic removed as API doesn't support fetching/submitting them yet
    // const [reviews, setReviews] = useState<CharacterReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [loadingReviews, setLoadingReviews] = useState(true); // Removed

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!characterId) return;

            setLoading(true);
            // setLoadingReviews(true); // Removed
            setError(null);

            try {
                // Fetch character data using the public endpoint
                const response = await apiClient.get<CharacterPublic>(`/characters/${characterId}`);

                 // API endpoint returns 404 if not found or not approved/public
                 setCharacter(response.data);

                 // Fetch reviews if API supported it
                 // const reviewsResponse = await apiClient.get(...);
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
                // setReviews([]); // Removed
            } finally {
                setLoading(false);
                // setLoadingReviews(false); // Removed
            }
        };

        fetchCharacter();
    }, [characterId]);

     // handleReviewSubmitted removed as review submission isn't available

    if (loading) {
        return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
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
                {/* Left Column: Image and Basic Info */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="overflow-hidden shadow-lg">
                        <div className="aspect-[3/4] relative bg-muted">
                             <Image
                                data-ai-hint={`${character.category || ''} character portrait ${character.tags?.join(' ') || ''}`}
                                // Use image_url from API
                                src={character.image_url || `https://picsum.photos/seed/${character.id}/300/400`}
                                alt={character.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                style={{ objectFit: 'cover' }}
                                priority
                            />
                        </div>
                    </Card>
                     {/* Interaction Buttons */}
                    <div className="space-y-2">
                        <Button asChild size="lg" className="w-full">
                            {/* Link to chat page - requires conversation management */}
                            <Link href={`/character/${character.id}/chat`}>
                                <MessageSquare className="mr-2 h-5 w-5" /> Chat Now
                            </Link>
                        </Button>
                        {/* Voice call feature disabled */}
                        <Button variant="outline" size="lg" className="w-full" disabled>
                            <Phone className="mr-2 h-5 w-5" /> Voice Call (Coming Soon)
                        </Button>
                    </div>
                </div>

                {/* Right Column: Details and Reviews */}
                <div className="md:col-span-2 space-y-6">
                     <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-3xl">{character.name}</CardTitle>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {character.category && <Badge variant="secondary">{character.category}</Badge>}
                                {character.tags?.map(tag => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                             {/* Display Rating if available */}
                             {character.averageRating !== undefined && character.averageRating !== null && character.averageRating > 0 ? (
                                 <div className="mt-3">
                                    <StarRatingDisplay rating={character.averageRating} count={character.ratingCount || 0} />
                                 </div>
                             ) : (
                                 <p className="text-sm text-muted-foreground mt-3">No ratings yet.</p>
                             )}
                        </CardHeader>
                        <CardContent>
                             <p className="text-foreground mb-4">{character.description || 'No description provided.'}</p>
                             {/* Scenario might not be in CharacterPublic, display if added */}
                             {/* {character.scenario && ( ... )} */}
                             <h4 className="font-semibold mb-1">Greeting:</h4>
                             <p className="text-sm text-muted-foreground italic">
                                 {character.greeting_message ? `"${character.greeting_message}"` : '"Hello!"'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Ratings & Reviews Section (Placeholder - needs API support) */}
                     <Card className="shadow-sm">
                        <CardHeader>
                             <CardTitle className="text-xl">Ratings & Reviews</CardTitle>
                             <CardDescription>Feedback for {character.name}.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             {/* Review Submission Form Removed */}
                             {/* {user && ( ... <ReviewForm ... /> ...)} */}
                             <p className="text-sm text-muted-foreground mb-4">
                                 {user ? "Reviews feature coming soon!" : "Log in to leave a review (feature coming soon)."}
                             </p>

                              <h4 className="font-semibold mb-4">Recent Reviews</h4>
                              {/* Review Display Removed - Needs API */}
                               <p className="text-sm text-muted-foreground">No reviews available yet.</p>
                             {/* {loadingReviews ? ( ... ) : reviews.length > 0 ? ( ... ) : ( ... )} */}
                         </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
}
