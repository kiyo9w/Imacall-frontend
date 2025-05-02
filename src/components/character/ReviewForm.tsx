'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; Removed Firebase imports
// import { db } from '@/lib/firebase'; Removed Firebase imports
import { CharacterReview } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingInput } from './RatingInput'; // Assuming RatingInput is in the same directory
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext'; // To get current user's display name/avatar


const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  reviewText: z.string().max(1000, "Review text cannot exceed 1000 characters").optional(),
});

type ReviewFormInputs = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  characterId: string;
  userId: string; // Passed from parent component (CharacterDetail page)
   onReviewSubmitted: (newReview: CharacterReview) => void; // Callback after successful submission
}

export function ReviewForm({ characterId, userId, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth(); // Get user for display name/avatar
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewFormInputs>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0, // Initialize rating to 0
      reviewText: '',
    },
  });

  // Watch rating value to update RatingInput
  const currentRating = watch('rating');

   // Register rating field and set value manually
   register('rating');
   const handleRatingChange = (newRating: number) => {
     setValue('rating', newRating, { shouldValidate: true, shouldDirty: true });
   };

  const onSubmit: SubmitHandler<ReviewFormInputs> = async (data) => {
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("You must be logged in to submit a review.");
      setLoading(false);
      return;
    }

    // --- Firebase code removed ---
    // Replace with API call if/when review submission is supported by the backend
    setError("Review submission is not currently supported by the API.");
    toast({
        title: "Feature Unavailable",
        description: "Submitting reviews is not yet implemented in the backend.",
        variant: "destructive",
    });
    setLoading(false);
    return; // Prevent further execution

    // try {
    //   const reviewData: Omit<CharacterReview, 'id' | 'createdAt'> = {
    //     characterId: characterId,
    //     userId: userId,
    //     displayName: user?.full_name || 'Anonymous', // Use full_name from UserPublic
    //     userAvatarUrl: undefined, // API doesn't provide avatar URL for user
    //     rating: data.rating,
    //     reviewText: data.reviewText || '',
    //     // createdAt needs to be handled by the API on submission
    //   };

    //   // --- Replace with API call ---
    //   // Example: const response = await apiClient.post(`/characters/${characterId}/reviews`, reviewData);
    //   // const newReviewFromApi = response.data;
    //   // ---

    //   // Construct the new review object for the callback
    //   const newReviewForCallback: CharacterReview = {
    //       // id: newReviewFromApi.id,
    //       id: `temp-${Date.now()}`, // Temporary ID for callback
    //       ...reviewData,
    //       createdAt: new Date().toISOString() // Use client timestamp for immediate feedback
    //   };
    //   onReviewSubmitted(newReviewForCallback);

    //   toast({
    //     title: "Review Submitted",
    //     description: "Thank you for your feedback!",
    //   });

    //   // Reset form (optional)
    //   setValue('rating', 0);
    //   setValue('reviewText', '');

    // } catch (err) {
    //   console.error("Error submitting review:", err);
    //   setError("Failed to submit your review. Please try again.");
    //   toast({
    //     title: "Submission Failed",
    //     description: "Could not submit your review.",
    //     variant: "destructive",
    //   });
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
       {error && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        )}
      <div>
        <Label htmlFor="rating" className="block mb-2 font-medium">Your Rating *</Label>
         <RatingInput
            value={currentRating}
            onChange={handleRatingChange}
            disabled={loading}
         />
        {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
      </div>

      <div>
        <Label htmlFor="reviewText">Your Review (Optional)</Label>
        <Textarea
          id="reviewText"
          placeholder={`What did you think of this character?`}
          {...register('reviewText')}
          className={errors.reviewText ? 'border-destructive' : ''}
          rows={4}
          disabled={loading}
        />
        {errors.reviewText && <p className="text-sm text-destructive">{errors.reviewText.message}</p>}
      </div>

      <Button type="submit" disabled={loading || currentRating === 0} className="w-full sm:w-auto">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit Review</>}
      </Button>
    </form>
  );
}

    