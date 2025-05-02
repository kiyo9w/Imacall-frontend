// Represents the overall status of a character
// Ensure these values exactly match the ENUM or choices defined in the backend API schema if applicable.
// Using string literals as per previous definition.
export type CharacterStatus = 'Pending' | 'Approved' | 'Rejected';

// Categories - Use string literals if defined as strings in the backend/DB
// If it's a strict Enum in the backend, ensure these match.
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


// Matches CharacterPublic schema from FastAPI, including new fields
export interface CharacterPublic {
    name: string;
    description?: string | null;
    image_url?: string | null;
    greeting_message?: string | null;
    id: string; // UUID
    status: CharacterStatus;
    creator_id: string; // UUID

    // New fields added from migration 086914fa157b
    scenario?: string | null;
    category?: CharacterCategory | string | null; // Allow string for flexibility if enum not strictly enforced
    language?: string | null; // Max 10 chars
    tags?: string[] | null; // Assuming API converts Text field to string array
    voice_id?: string | null;
    personality_traits?: string | null; // Text field
    writing_style?: string | null; // Text field
    background?: string | null; // Text field
    knowledge_scope?: string | null; // Text field
    quirks?: string | null; // Text field
    emotional_range?: string | null; // Text field
    popularity_score: number; // Integer, non-null (default 0)
    is_public: boolean; // Boolean, non-null (default true)
    is_featured: boolean; // Boolean, non-null (default false)
    admin_feedback?: string | null; // Text field

    // Fields assumed from previous version, confirm if still present in API
    averageRating?: number | null;
    ratingCount?: number | null;
    createdAt?: string | null; // ISO Date string
    updatedAt?: string | null; // ISO Date string
}


// Matches CharacterCreate schema from FastAPI, including new fields if applicable on creation
export interface CharacterCreate {
    name: string; // Max 100
    description?: string | null;
    image_url?: string | null;
    greeting_message?: string | null;
    category?: CharacterCategory | string | null;
    tags?: string[] | null; // Expects array from frontend processing
    scenario?: string | null;
    language?: string | null; // Max 10

    // These fields likely added during creation too, confirm with API schema
    voice_id?: string | null;
    personality_traits?: string | null;
    writing_style?: string | null;
    background?: string | null;
    knowledge_scope?: string | null;
    quirks?: string | null;
    emotional_range?: string | null;

    // These fields usually have defaults or are set by admin, confirm if creatable
    is_public?: boolean | null; // Default true in DB
    // is_featured is likely admin-only
}

// Matches CharacterUpdateAdmin schema from FastAPI, including new fields
// Used for admin updates and potentially user edits on pending/rejected characters.
export interface CharacterUpdateAdmin {
    name?: string | null; // Max 100
    description?: string | null;
    image_url?: string | null;
    greeting_message?: string | null;
    status?: CharacterStatus | null;
    category?: CharacterCategory | string | null;
    tags?: string[] | null; // Sending the full array or null/undefined
    scenario?: string | null;
    language?: string | null; // Max 10

    // New fields
    voice_id?: string | null;
    personality_traits?: string | null;
    writing_style?: string | null;
    background?: string | null;
    knowledge_scope?: string | null;
    quirks?: string | null;
    emotional_range?: string | null;
    is_public?: boolean | null;
    is_featured?: boolean | null; // Admin can likely update this
    admin_feedback?: string | null;
}


// Data structure for user ratings/reviews - **Currently not supported by API**
export interface CharacterReview {
    id: string;
    characterId: string;
    userId: string;
    displayName?: string | null;
    userAvatarUrl?: string | null; // User avatar not available
    rating: number;
    reviewText?: string | null;
    createdAt: string;
}

// Data for the character creation/edit form, including new fields
export interface CharacterFormData {
    name: string;
    description: string | null;
    greetingMessage: string | null;
    scenario: string | null;
    category?: CharacterCategory | string; // Allow string for flexibility
    language: string | null;
    tags: string; // Comma-separated string for form input
    imageUrl?: string | null; // For preview/existing URL

    // New fields
    voice_id: string | null;
    personality_traits: string | null;
    writing_style: string | null;
    background: string | null;
    knowledge_scope: string | null;
    quirks: string | null;
    emotional_range: string | null;

    // These are typically not directly set in the user form but might be needed internally
    // is_public?: boolean; // Managed separately?
}


// --- CONVERSATION & MESSAGE TYPES ---

// Matches MessagePublic schema
export interface MessagePublic {
    content: string;
    id: string; // UUID
    conversation_id: string; // UUID
    sender: 'user' | 'character' | 'system';
    timestamp: string; // ISO Date string
}

// Matches ConversationPublic schema
export interface ConversationPublic {
    id: string; // UUID
    user_id: string; // UUID
    character_id: string; // UUID
    created_at: string; // ISO Date string
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

// --- CONFIG TYPES ---

// Response for GET /config/ai/providers/available
export type AvailableProvidersResponse = string[];

// Response for GET /config/ai/providers/active
export type ActiveProviderResponse = string;

// Response for PUT /config/ai/providers/active
export interface SetActiveProviderResponse {
    message: string;
}