'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, MessageSquare, Phone, AlertCircle, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Assuming a simplified Session structure for V2 list display
interface InteractionSessionStub {
    id: string; // Session ID (e.g., userUID_characterID)
    characterId: string;
    characterName: string;
    characterImageUrl?: string;
    lastInteractionAt: Timestamp;
    interactionType: 'text' | 'voice'; // To distinguish later
    // We might add a snippet of the last message later
}


export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [sessions, setSessions] = useState<InteractionSessionStub[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || authLoading) {
             if (!authLoading) setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Querying sessions - This requires a 'sessions' collection or derived data.
        // For V2, we might query the *last message* for each session group.
        // This is complex with Firestore client-side. A backend function
        // or denormalized 'sessions' collection is strongly recommended for efficiency.

        // *** Placeholder Logic: Fetch last 15 chat messages and group them client-side ***
        // *** This is INEFFICIENT and NOT scalable - Replace with backend solution ***
        const fetchRecentInteractions = async () => {
            try {
                const messagesQuery = query(
                    collection(db, 'chatMessages'), // Assuming 'chatMessages' collection
                    where('userId', '==', user.uid),
                    orderBy('timestamp', 'desc'),
                    limit(50) // Fetch more messages to find unique sessions
                );

                const querySnapshot = await getDocs(messagesQuery);
                const recentMessages = querySnapshot.docs.map(doc => doc.data() as { sessionId: string, characterId: string, timestamp: Timestamp });

                // Group messages by session ID and get the latest timestamp
                const sessionMap = new Map<string, { characterId: string, lastInteractionAt: Timestamp }>();
                recentMessages.forEach(msg => {
                    if (!sessionMap.has(msg.sessionId) || msg.timestamp.toMillis() > sessionMap.get(msg.sessionId)!.lastInteractionAt.toMillis()) {
                        sessionMap.set(msg.sessionId, { characterId: msg.characterId, lastInteractionAt: msg.timestamp });
                    }
                });

                if (sessionMap.size === 0) {
                    setSessions([]);
                    setLoading(false);
                    return;
                }


                 // Fetch character details for each unique session
                const characterIds = Array.from(sessionMap.values()).map(s => s.characterId);
                // Firestore 'in' query limit is 30 - handle pagination or larger sets if needed
                const uniqueCharacterIds = [...new Set(characterIds)];

                 if (uniqueCharacterIds.length === 0) {
                     setSessions([]);
                     setLoading(false);
                     return;
                 }


                // Fetch character details efficiently
                const charactersData: Record<string, { name: string, imageUrl?: string }> = {};
                // Break down into chunks of 30 for 'in' query limitation
                 const chunkSize = 30;
                 for (let i = 0; i < uniqueCharacterIds.length; i += chunkSize) {
                    const chunk = uniqueCharacterIds.slice(i, i + chunkSize);
                    if (chunk.length > 0) {
                        const charactersQuery = query(collection(db, 'characters'), where('__name__', 'in', chunk));
                        const charactersSnapshot = await getDocs(charactersQuery);
                        charactersSnapshot.forEach(doc => {
                            charactersData[doc.id] = {
                                name: doc.data()?.name || 'Unknown Character',
                                imageUrl: doc.data()?.imageUrl,
                            };
                        });
                    }
                 }


                // Construct session stubs
                const sessionStubs: InteractionSessionStub[] = Array.from(sessionMap.entries()).map(([sessionId, sessionInfo]) => ({
                    id: sessionId,
                    characterId: sessionInfo.characterId,
                    characterName: charactersData[sessionInfo.characterId]?.name || 'Unknown Character',
                    characterImageUrl: charactersData[sessionInfo.characterId]?.imageUrl,
                    lastInteractionAt: sessionInfo.lastInteractionAt,
                    interactionType: 'text', // Assuming text for V2 placeholder
                }));

                 // Sort sessions by last interaction date, descending
                 sessionStubs.sort((a, b) => b.lastInteractionAt.toMillis() - a.lastInteractionAt.toMillis());

                setSessions(sessionStubs.slice(0, 15)); // Limit display


            } catch (err) {
                console.error("Error fetching interaction history:", err);
                setError("Failed to load your interaction history.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecentInteractions();

    }, [user, authLoading]);


      if (authLoading) {
        return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

     if (!user) {
         return (
             <div className="text-center py-16">
                 <p className="text-lg mb-4">Please log in to view your interaction history.</p>
                 <Button asChild>
                     <Link href="/login?redirect=/account/history">Login</Link>
                 </Button>
             </div>
         );
     }


    return (
        <Card className="max-w-3xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Interaction History</CardTitle>
                <CardDescription>Review your past conversations and calls.</CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                     <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {loading ? (
                     <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 border rounded-md animate-pulse">
                                <Skeleton className="h-12 w-12 rounded-full bg-muted"/>
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-4 w-1/2 bg-muted"/>
                                    <Skeleton className="h-3 w-1/4 bg-muted"/>
                                </div>
                                <Skeleton className="h-8 w-20 bg-muted rounded-md"/>
                            </div>
                         ))}
                     </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3"/>
                        <p>No recent interactions found.</p>
                         <p className="mt-1">Start chatting with a character!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(session => (
                             <div key={session.id} className="flex items-center gap-4 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                <Avatar className="h-12 w-12">
                                     <AvatarImage src={session.characterImageUrl || `https://picsum.photos/seed/${session.characterId}/50/50`} alt={session.characterName} />
                                     <AvatarFallback><Bot size={20}/></AvatarFallback>
                                </Avatar>
                                 <div className="flex-grow">
                                     <p className="font-medium">{session.characterName}</p>
                                     <p className="text-sm text-muted-foreground flex items-center gap-1">
                                         {session.interactionType === 'text' ? <MessageSquare className="h-3 w-3"/> : <Phone className="h-3 w-3"/>}
                                         Last interaction {formatDistanceToNow(session.lastInteractionAt.toDate(), { addSuffix: true })}
                                     </p>
                                 </div>
                                 {/* Link to detailed log page (V2 - not implemented yet) */}
                                <Button variant="outline" size="sm" asChild>
                                     {/* The actual link needs refinement based on how logs are stored/queried */}
                                     <Link href={`/character/${session.characterId}/chat`}>View Chat</Link>
                                </Button>
                            </div>
                        ))}
                         <p className="text-xs text-center text-muted-foreground pt-4">
                              Showing the latest {sessions.length} interaction sessions. More detailed history coming soon.
                         </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
