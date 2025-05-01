import type { Timestamp } from 'firebase/firestore';

// Represents the overall status of a character
export type CharacterStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

// Categories for characters
export type CharacterCategory = 'Fantasy' | 'Sci-Fi' | 'Historical' | 'Anime' | 'Celebrity' | 'Game Character' | 'Assistant' | 'Custom';

// Basic character data structure (V1 + initial V2 fields)
export interface Character {
    id: string; // Firestore document ID
    userId: string; // ID of the user who created the character
    creatorType: 'User' | 'Admin'; // Who created the character
    name: string;
    description: string; // Short description/tagline
    imageUrl?: string; // URL for the character's avatar/image
    status: CharacterStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // V1 Detail Fields
    greetingMessage: string; // Initial message the character sends
    scenario?: string; // Context or setting for the interaction
    category: CharacterCategory;
    language?: string; // Primary language (e.g., 'en', 'es')
    tags?: string[]; // Searchable tags
    voiceId?: string; // Identifier for the TTS voice to use

    // V1 Admin/Platform Managed Fields
    isPublic: boolean; // Whether the character is visible in the public browser
    isFeatured?: boolean; // If the character is featured by admins
    adminFeedback?: string; // Reason for rejection or other admin notes

    // V2 Fields
    popularityScore?: number; // Calculated score based on interactions, ratings, etc.
    averageRating?: number; // Average star rating from users
    ratingCount?: number; // Number of ratings received

    // V3 Fields (Placeholders for future implementation)
    // personalityTraits?: string[];
    // backgroundStory?: string;
    // knowledgeScope?: string;
    // quirks?: string[];
    // emotionalRange?: string;
    // allowRemixing?: boolean;
    // shareLink?: string;

}

// Data structure for user ratings/reviews (V2)
export interface CharacterReview {
    id: string; // Firestore document ID
    characterId: string; // ID of the character being reviewed
    userId: string; // ID of the user submitting the review
    displayName?: string; // User's display name at the time of review
    userAvatarUrl?: string; // User's avatar URL at the time of review
    rating: number; // Star rating (e.g., 1-5)
    reviewText?: string; // Optional text comment
    createdAt: Timestamp;
}

// Data for the character creation/edit form (combines fields)
export type CharacterFormData = Pick<Character,
    'name' |
    'description' |
    'greetingMessage' |
    'scenario' |
    'category' |
    'language' |
    'tags'
    // imageUrl is handled separately via file upload
    // voiceId might be selected from a list
>;
