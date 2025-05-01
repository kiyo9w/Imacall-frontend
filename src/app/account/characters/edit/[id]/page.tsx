'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/apiClient'; // Import API client
import { CharacterPublic } from '@/types/character'; // Use API types
import { CharacterForm } from '@/components/character/CharacterForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios'; // For error handling

export default function EditCharacterPage() {
    const params = useParams();
    const characterId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    // Store the fetched character data which matches CharacterPublic
    const [characterData, setCharacterData] = useState<CharacterPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!characterId || !user || authLoading) {
            if (!authLoading && !user) setError("You must be logged in to edit characters.");
            if (!authLoading) setLoading(false);
            return;
        };

        const fetchCharacterData = async () => {
            setLoading(true);
            setError(null);
            try {
                 // Fetch character data from the API
                 // Use the admin endpoint to fetch ANY character by ID, assuming permissions are checked server-side
                 // OR use a dedicated 'my-submissions/{id}' endpoint if available
                const response = await apiClient.get<CharacterPublic>(`/admin/characters/${characterId}`); // Needs admin or specific access

                if (response.data) {
                    const data = response.data;
                    // Authorization check: Ensure the logged-in user owns this character
                     if (data.creator_id !== user.id) { // Compare with user.id from AuthContext
                        setError("You do not have permission to edit this character.");
                        setCharacterData(null);
                     }
                      // Check if editable based on status (e.g., Pending or Rejected)
                      // API doesn't seem to have 'Draft' - adjust logic if needed
                     else if (data.status !== 'Pending' && data.status !== 'Rejected') {
                        setError(`Character cannot be edited in '${data.status}' status.`);
                        setCharacterData(null);
                     }
                     else {
                         setCharacterData(data);
                     }
                } else {
                     // This case might not happen if API returns 404, handled in catch
                    setError("Character not found.");
                }
            } catch (err) {
                console.error("Error fetching character for edit:", err);
                 if (axios.isAxiosError(err)) {
                    if (err.response?.status === 404) {
                        setError("Character not found.");
                    } else if (err.response?.status === 403) {
                         setError("You do not have permission to view this character for editing.");
                    } else if (err.response?.status === 401) {
                         setError("Authentication error. Please log in again.");
                         // Redirect?
                    }
                     else {
                        setError("Failed to load character data.");
                    }
                 } else {
                    setError("An unexpected error occurred.");
                 }
            } finally {
                setLoading(false);
            }
        };

        fetchCharacterData();
    }, [characterId, user, authLoading]); // Depend on user object which contains the ID

    if (loading || authLoading) {
        return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
             <Alert variant="destructive" className="max-w-lg mx-auto my-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
        );
    }

    // Pass the fetched CharacterPublic data to the form
    // The form needs to map these fields to its internal structure (CharacterFormData)
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Edit Character: {characterData?.name}</h1>
             {characterData ? (
                 // Pass CharacterPublic type, CharacterForm will adapt
                 <CharacterForm mode="edit" existingCharacter={characterData} />
             ) : (
                 <p className="text-muted-foreground">Could not load character data for editing.</p>
             )}
        </div>
    );
}
