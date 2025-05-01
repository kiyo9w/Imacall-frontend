'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient'; // Import API client
import { ConversationPublic, PaginatedResponse } from '@/types/character'; // Use API types
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, MessageSquare, AlertCircle, Bot } from 'lucide-react'; // Removed Phone icon for now
import { formatDistanceToNow, parseISO } from 'date-fns'; // Import parseISO
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import axios from 'axios'; // For error handling

// Limit the number of sessions displayed initially
const SESSIONS_LIMIT = 15;

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    // Use ConversationPublic from API which should ideally include character details
    const [sessions, setSessions] = useState<ConversationPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user) return; // Handled by ProtectedRoute

            setLoading(true);
            setError(null);

            try {
                // Fetch conversations for the current user
                const response = await apiClient.get<PaginatedResponse<ConversationPublic>>(
                    '/conversations/',
                    {
                        params: {
                            skip: 0,
                            limit: SESSIONS_LIMIT, // Fetch latest sessions
                            // Add sorting params if API supports (e.g., sort_by=last_interaction_at&sort_dir=desc)
                        }
                    }
                );

                 // Assuming the API sorts by last interaction or creation date descending
                 // If not, sort client-side if lastInteractionAt is available
                 const sortedSessions = response.data.data.sort((a, b) => {
                    const dateA = a.lastInteractionAt ? parseISO(a.lastInteractionAt).getTime() : (a.created_at ? parseISO(a.created_at).getTime() : 0);
                    const dateB = b.lastInteractionAt ? parseISO(b.lastInteractionAt).getTime() : (b.created_at ? parseISO(b.created_at).getTime() : 0);
                    return dateB - dateA; // Descending
                });

                setSessions(sortedSessions);

            } catch (err) {
                console.error("Error fetching conversation history:", err);
                 let errorMsg = "Failed to load your interaction history.";
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    errorMsg = "Authentication error. Please log in again.";
                 }
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        if (user && !authLoading) {
            fetchConversations();
        } else if (!authLoading) {
            setLoading(false); // Stop loading if not logged in
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    if (authLoading) {
        return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

     if (!user && !loading) {
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
                <CardDescription>Review your past conversations.</CardDescription> {/* Removed 'and calls' */}
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
                            <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
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
                                     {/* Use characterImageUrl if provided by API */}
                                     <AvatarImage src={session.characterImageUrl || `https://picsum.photos/seed/${session.character_id}/50/50`} alt={session.characterName || 'Character'} />
                                     <AvatarFallback><Bot size={20}/></AvatarFallback>
                                </Avatar>
                                 <div className="flex-grow">
                                     {/* Use characterName if provided by API */}
                                     <p className="font-medium">{session.characterName || 'Unknown Character'}</p>
                                     <p className="text-sm text-muted-foreground flex items-center gap-1">
                                         <MessageSquare className="h-3 w-3"/> {/* Assuming text only for now */}
                                         {/* Use lastInteractionAt or created_at */}
                                         Last activity {formatDistanceToNow(parseISO(session.lastInteractionAt || session.created_at), { addSuffix: true })}
                                     </p>
                                 </div>
                                 {/* Link to the specific chat page using conversation ID */}
                                <Button variant="outline" size="sm" asChild>
                                     <Link href={`/character/${session.character_id}/chat?conversationId=${session.id}`}>View Chat</Link>
                                </Button>
                            </div>
                        ))}
                         {sessions.length >= SESSIONS_LIMIT && (
                             <p className="text-xs text-center text-muted-foreground pt-4">
                                  Showing the latest {sessions.length} conversations. More history might be available.
                             </p>
                         )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
