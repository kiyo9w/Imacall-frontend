'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Character, CharacterReview } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Phone, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RatingInput } from '@/components/character/RatingInput'; // Component for star rating input
import { ReviewForm } from '@/components/character/ReviewForm'; // Component for submitting review text
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';


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
            {count !== undefined && <span className="ml-2 text-sm text-muted-foreground">({count} {count === 1 ? 'rating' : 'ratings'})</span>}
        </div>
    );
}


export default function CharacterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const characterId = params.id as string;

    const [character, setCharacter] = useState<Character | null>(null);
    const [reviews, setReviews] = useState<CharacterReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchCharacterAndReviews = async () => {
            if (!characterId) return;

            setLoading(true);
            setLoadingReviews(true);
            setError(null);

            try {
                // Fetch character data
                const characterDocRef = doc(db, 'characters', characterId);
                const characterDocSnap = await getDoc(characterDocRef);

                if (!characterDocSnap.exists() || !characterDocSnap.data()?.isPublic || characterDocSnap.data()?.status !== 'Approved') {
                   // Consider redirecting to a 404 page or showing a specific message
                   setError('Character not found or is not publicly available.');
                   setCharacter(null);
                   setReviews([]);
                   return;
                }

                setCharacter({ id: characterDocSnap.id, ...characterDocSnap.data() } as Character);

                 // Fetch recent reviews
                const reviewsQuery = query(
                    collection(db, 'reviews'), // Assuming top-level 'reviews' collection
                    where('characterId', '==', characterId),
                    orderBy('createdAt', 'desc'),
                    limit(5) // Fetch latest 5 reviews for display
                );
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const fetchedReviews = reviewsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                     // Convert Firestore Timestamp to JS Date for easier handling
                    // createdAt: (doc.data().createdAt as Timestamp).toDate()
                 }) as CharacterReview);

                setReviews(fetchedReviews);

            } catch (err) {
                console.error("Error fetching character details:", err);
                setError("Failed to load character details. Please try again.");
            } finally {
                setLoading(false);
                setLoadingReviews(false);
            }
        };

        fetchCharacterAndReviews();
    }, [characterId]);

    const handleReviewSubmitted = (newReview: CharacterReview) => {
        // Add the new review to the top of the list
        setReviews(prev => [newReview, ...prev].slice(0, 5)); // Keep latest 5
        // Potentially refetch character data if backend updates averageRating immediately
        // Or update averageRating optimistically on the client (more complex)
         setCharacter(prev => {
            if (!prev) return null;
            const oldTotalRating = (prev.averageRating || 0) * (prev.ratingCount || 0);
            const newRatingCount = (prev.ratingCount || 0) + 1;
            const newTotalRating = oldTotalRating + newReview.rating;
            const newAverageRating = newTotalRating / newRatingCount;
            return { ...prev, averageRating: newAverageRating, ratingCount: newRatingCount };
        });
    };


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
         // This case should be covered by error state, but added for safety
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
                                data-ai-hint={`${character.category} character portrait ${character.tags?.join(' ')}`}
                                src={character.imageUrl || `https://picsum.photos/seed/${character.id}/300/400`}
                                alt={character.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                style={{ objectFit: 'cover' }}
                                priority // Prioritize loading the main image
                            />
                        </div>
                    </Card>
                     {/* Interaction Buttons */}
                    <div className="space-y-2">
                        <Button asChild size="lg" className="w-full">
                            <Link href={`/character/${character.id}/chat`}>
                                <MessageSquare className="mr-2 h-5 w-5" /> Chat Now
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full" disabled> {/* V2 Feature - Placeholder */}
                            <Phone className="mr-2 h-5 w-5" /> Voice Call (V2)
                        </Button>
                    </div>
                </div>

                {/* Right Column: Details and Reviews */}
                <div className="md:col-span-2 space-y-6">
                     <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-3xl">{character.name}</CardTitle>
                             <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{character.category}</Badge>
                                {character.tags?.map(tag => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                             {character.averageRating !== undefined && character.averageRating > 0 ? (
                                 <div className="mt-3">
                                    <StarRatingDisplay rating={character.averageRating} count={character.ratingCount} />
                                 </div>
                             ) : (
                                 <p className="text-sm text-muted-foreground mt-3">No ratings yet.</p>
                             )}
                        </CardHeader>
                        <CardContent>
                             <p className="text-foreground mb-4">{character.description}</p>
                             {character.scenario && (
                                <>
                                    <h4 className="font-semibold mb-1">Scenario:</h4>
                                    <p className="text-sm text-muted-foreground italic mb-4">{character.scenario}</p>
                                </>
                             )}
                             <h4 className="font-semibold mb-1">Greeting:</h4>
                             <p className="text-sm text-muted-foreground italic">{`"${character.greetingMessage}"`}</p>

                        </CardContent>
                    </Card>

                    {/* Ratings & Reviews Section (V2) */}
                     <Card className="shadow-sm">
                        <CardHeader>
                             <CardTitle className="text-xl">Ratings & Reviews</CardTitle>
                             <CardDescription>Share your experience with {character.name}.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             {user && (
                                <div className="mb-6 p-4 border rounded-lg bg-background">
                                     <h4 className="font-semibold mb-3">Leave a Review</h4>
                                     {/* Pass characterId and user to the form */}
                                     <ReviewForm
                                         characterId={character.id}
                                         userId={user.uid}
                                         onReviewSubmitted={handleReviewSubmitted}
                                     />
                                </div>
                             )}
                              <h4 className="font-semibold mb-4">Recent Reviews</h4>
                             {loadingReviews ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                             ) : reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map(review => (
                                        <div key={review.id} className="flex gap-3 border-b pb-4 last:border-b-0">
                                             <Avatar className="h-10 w-10 mt-1">
                                                <AvatarImage src={review.userAvatarUrl || undefined} alt={review.displayName || 'User'} />
                                                <AvatarFallback>
                                                    {review.displayName ? review.displayName.charAt(0).toUpperCase() : <UserIcon size={18} />}
                                                </AvatarFallback>
                                            </Avatar>
                                             <div className="flex-1">
                                                 <div className="flex justify-between items-center mb-1">
                                                     <span className="font-medium text-sm">{review.displayName || 'Anonymous User'}</span>
                                                      {/* Check if createdAt is a Timestamp before calling toDate */}
                                                     <span className="text-xs text-muted-foreground">
                                                         {review.createdAt instanceof Timestamp
                                                             ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true })
                                                             : 'Date unavailable'}
                                                      </span>
                                                 </div>
                                                <StarRatingDisplay rating={review.rating} />
                                                {review.reviewText && <p className="text-sm mt-2 text-foreground/90">{review.reviewText}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No reviews yet for this character.</p>
                             )}
                         </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
}

// Import AlertCircle if needed
import { AlertCircle } from 'lucide-react';
