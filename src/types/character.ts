// Represents the overall status of a character
export type CharacterStatus = 'Pending' | 'Approved' | 'Rejected'; // Match API schema exactly ('Pending', not 'pending')

// Categories might be handled differently in FastAPI, adjust if needed
export enum CharacterCategory {
    FANTASY = 'Fantasy',
    SCI_FI = 'Sci-Fi',
    HISTORICAL = 'Historical',
    ANIME = 'Anime',
    CELEBRITY = 'Celebrity',
    GAME_CHARACTER = 'Game Character',
    ASSISTANT = 'Assistant',
    CUSTOM = 'Custom'
}


// Matches CharacterPublic schema from FastAPI
export interface CharacterPublic {
    name: string;
    description?: string | null;
    image_url?: string | null; // Renamed from imageUrl
    greeting_message?: string | null; // Renamed from greetingMessage
    id: string; // UUID
    status: CharacterStatus;
    creator_id: string; // UUID, renamed from userId
    // Add other fields from the API schema as needed
    category?: CharacterCategory | null;
    tags?: string[] | null;
    averageRating?: number | null; // Assuming these are returned
    ratingCount?: number | null; // Assuming these are returned
    isPublic?: boolean | null; // Assuming this is returned
    createdAt?: string | null; // ISO Date string
    updatedAt?: string | null; // ISO Date string
    adminFeedback?: string | null; // Include if API provides it
}


// Matches CharacterCreate schema from FastAPI
export interface CharacterCreate {
    name: string;
    description?: string | null;
    image_url?: string | null;
    greeting_message?: string | null;
    // Add other creation fields like category, tags if they are part of CharacterCreate
    category?: CharacterCategory | null;
    tags?: string[] | null;
    scenario?: string | null; // Assuming scenario is part of create
    language?: string | null; // Assuming language is part of create
}

// Matches CharacterUpdateAdmin schema from FastAPI (used for both admin and potentially user edits on pending/rejected)
export interface CharacterUpdateAdmin {
    name?: string | null;
    description?: string | null;
    image_url?: string | null;
    greeting_message?: string | null;
    status?: CharacterStatus | null;
     // Add other updatable fields like category, tags, isPublic if part of the admin update schema
    category?: CharacterCategory | null;
    tags?: string[] | null; // Sending the full array or null/undefined
    scenario?: string | null;
    language?: string | null;
    isPublic?: boolean | null;
    adminFeedback?: string | null; // Assuming feedback is part of update
}


// Data structure for user ratings/reviews - **Currently not supported by API**
// Keep for potential future implementation, adjust based on actual future API schema.
export interface CharacterReview {
    id: string; // Review ID (e.g., UUID from API)
    characterId: string; // ID of the character being reviewed
    userId: string; // ID of the user submitting the review
    displayName?: string | null; // User's display name (from UserPublic)
    userAvatarUrl?: string | null; // **User avatar URL is not available from current UserPublic**
    rating: number; // Star rating (e.g., 1-5)
    reviewText?: string | null; // Optional text comment
    createdAt: string; // ISO Date string from API
}

// Data for the character creation/edit form
// Map from API CharacterCreate/Update types
export interface CharacterFormData {
    name: string;
    description: string;
    greetingMessage: string;
    scenario?: string;
    category?: CharacterCategory;
    language?: string;
    tags?: string; // Keep as comma-separated string for form input, transform on submit
    imageUrl?: string | null; // Keep image URL for preview/existing
}


// Matches MessagePublic schema
export interface MessagePublic {
    content: string;
    id: string; // UUID
    conversation_id: string; // UUID
    sender: 'user' | 'character' | 'system'; // Adjust if enum differs
    timestamp: string; // ISO Date string
}

// Matches ConversationPublic schema
export interface ConversationPublic {
    id: string; // UUID
    user_id: string; // UUID
    character_id: string; // UUID
    created_at: string; // ISO Date string
     // Add fields like last_message_at, character_name, character_image_url if backend provides them
    lastInteractionAt?: string; // Example, adjust name based on API
    characterName?: string; // Example
    characterImageUrl?: string | null; // Example
}

// Matches MessagesPublic schema
export interface MessagesPublic {
    data: MessagePublic[];
    count: number;
}

// Matches ConversationsPublic schema
export interface ConversationsPublic {
    data: ConversationPublic[];
    count: number;
}


// Utility type for API responses with pagination
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
}

// --- NEW CONFIG TYPES ---

// Response for GET /config/ai/providers/available
export type AvailableProvidersResponse = string[];

// Response for GET /config/ai/providers/active
export type ActiveProviderResponse = string;

// Response for PUT /config/ai/providers/active
export interface SetActiveProviderResponse {
    message: string;
}
