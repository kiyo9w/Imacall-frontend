'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Character } from '@/types/character';
import { CharacterForm } from '@/components/character/CharacterForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext'; // Ensure user owns character


export default function EditCharacterPage() {
    const params = useParams();
    const characterId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [characterData, setCharacterData] = useState<Character | null>(null);
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
                const docRef = doc(db, 'characters', characterId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Character;
                    // Authorization check: Ensure the logged-in user owns this character
                     if (data.userId !== user.uid) {
                        setError("You do not have permission to edit this character.");
                        setCharacterData(null);
                     } else if (data.status !== 'Draft' && data.status !== 'Rejected') {
                        // Prevent editing if not in Draft or Rejected status
                        setError(`Character cannot be edited in '${data.status}' status.`);
                        setCharacterData(null); // Or potentially load data but disable form
                     }
                     else {
                         setCharacterData(data);
                     }
                } else {
                    setError("Character not found.");
                }
            } catch (err) {
                console.error("Error fetching character for edit:", err);
                setError("Failed to load character data.");
            } finally {
                setLoading(false);
            }
        };

        fetchCharacterData();
    }, [characterId, user, authLoading]);

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


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Edit Character: {characterData?.name}</h1>
             {characterData ? (
                 <CharacterForm mode="edit" existingCharacter={characterData} />
             ) : (
                 // This should ideally not be reached if error handling is correct
                 <p className="text-muted-foreground">Could not load character data for editing.</p>
             )}

        </div>
    );
}
