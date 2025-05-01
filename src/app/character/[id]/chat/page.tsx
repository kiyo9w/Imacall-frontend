'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Character } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, ArrowLeft, Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns'; // For formatting timestamps

// Define message structure
interface ChatMessage {
    id: string;
    sessionId: string; // ID linking messages in a session
    userId: string; // ID of the user sending/receiving
    characterId: string;
    sender: 'user' | 'character';
    text: string;
    timestamp: Timestamp;
}

// Define chat session structure (optional, could be inferred)
interface ChatSession {
    id: string;
    userId: string;
    characterId: string;
    lastMessageAt: Timestamp;
    characterName: string; // Store for quick access
    characterImageUrl?: string;
}

const MESSAGES_PER_LOAD = 20; // Number of messages to load initially/more

export default function ChatPage() {
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const characterId = params.id as string;
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);


    const [character, setCharacter] = useState<Character | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingCharacter, setLoadingCharacter] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null); // Assume one session per user/character for simplicity V1
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [firstVisibleMessage, setFirstVisibleMessage] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);


    // 1. Fetch Character Details
    useEffect(() => {
        const fetchCharacter = async () => {
            if (!characterId) return;
            setLoadingCharacter(true);
            setError(null);
            try {
                const characterDocRef = doc(db, 'characters', characterId);
                const characterDocSnap = await getDoc(characterDocRef);

                if (!characterDocSnap.exists() || characterDocSnap.data()?.status !== 'Approved') {
                    setError('Character not found or is not available for chat.');
                    setCharacter(null);
                } else {
                    setCharacter({ id: characterDocSnap.id, ...characterDocSnap.data() } as Character);
                }
            } catch (err) {
                console.error("Error fetching character:", err);
                setError("Failed to load character details.");
            } finally {
                setLoadingCharacter(false);
            }
        };
        fetchCharacter();
    }, [characterId]);

    // 2. Determine Session ID and Fetch/Subscribe to Messages
    useEffect(() => {
        if (!user || !characterId || authLoading) return;

        // Simple session ID generation (replace with robust backend logic later)
        // Sorting ensures consistency regardless of user/character order
        const ids = [user.uid, characterId].sort();
        const currentSessionId = ids.join('_');
        setSessionId(currentSessionId);
        setLoadingMessages(true);
        setHasMoreMessages(true); // Reset hasMore on session change
        setFirstVisibleMessage(null); // Reset pagination marker

        const messagesQuery = query(
            collection(db, 'chatMessages'), // Assumes top-level collection
            where('sessionId', '==', currentSessionId),
            orderBy('timestamp', 'desc'), // Fetch latest first for initial view
            limit(MESSAGES_PER_LOAD)
        );

        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const fetchedMessages: ChatMessage[] = [];
            querySnapshot.forEach((doc) => {
                fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
             // Reverse to display oldest first in the UI
            setMessages(fetchedMessages.reverse());
            setFirstVisibleMessage(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
            setHasMoreMessages(querySnapshot.docs.length === MESSAGES_PER_LOAD);
            setLoadingMessages(false);

            // Scroll to bottom after initial load or new message arrival
            scrollToBottom();

        }, (err) => {
            console.error("Error fetching messages:", err);
            setError("Failed to load chat messages.");
            setLoadingMessages(false);
        });

        return () => unsubscribe(); // Cleanup subscription

    }, [user, characterId, authLoading]);

     // Function to load older messages
    const loadMoreMessages = async () => {
        if (!sessionId || !hasMoreMessages || loadingMore || !firstVisibleMessage) return;

        setLoadingMore(true);
        try {
            const moreMessagesQuery = query(
                collection(db, 'chatMessages'),
                where('sessionId', '==', sessionId),
                orderBy('timestamp', 'desc'),
                startAfter(firstVisibleMessage),
                limit(MESSAGES_PER_LOAD)
            );

            const querySnapshot = await getDocs(moreMessagesQuery);
            const olderMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse(); // Reverse to maintain order

            setMessages(prev => [...olderMessages, ...prev]); // Prepend older messages
            setFirstVisibleMessage(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
            setHasMoreMessages(querySnapshot.docs.length === MESSAGES_PER_LOAD);

        } catch (err) {
            console.error("Error loading more messages:", err);
            toast({ title: "Error", description: "Could not load older messages.", variant: "destructive" });
        } finally {
            setLoadingMore(false);
        }
    };


     // 3. Scroll to Bottom Helper
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
         // Delay slightly to allow DOM update
        setTimeout(() => {
            if (viewportRef.current) {
                viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior });
            }
        }, 100);
    };

    // Scroll to bottom when messages change (new message added)
    useEffect(() => {
         // Only auto-scroll if near the bottom already, or on initial load
        // Add logic here if you want conditional scrolling
        if (!loadingMessages) {
           scrollToBottom('smooth');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]); // Depend only on the number of messages


    // 4. Handle Sending Message
    const handleSendMessage = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user || !sessionId || !characterId || sending) return;

        setSending(true);
        const textToSend = newMessage.trim();
        setNewMessage(''); // Clear input immediately

        const userMessageData: Omit<ChatMessage, 'id'> = {
            sessionId: sessionId,
            userId: user.uid,
            characterId: characterId,
            sender: 'user',
            text: textToSend,
            timestamp: serverTimestamp() as Timestamp,
        };

        try {
            // Add user message to Firestore
            await addDoc(collection(db, 'chatMessages'), userMessageData);

            // --- AI Interaction Placeholder ---
            // TODO: Call AI service (e.g., via Firebase Function)
            // Pass user message, character details, chat history context
            // const aiResponseText = await callAIService(textToSend, character, messages);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI delay
            const aiResponseText = `Echoing: "${textToSend}" (AI response pending integration)`;
            // -----------------------------------

            if (aiResponseText) {
                 const characterMessageData: Omit<ChatMessage, 'id'> = {
                    sessionId: sessionId,
                    userId: user.uid, // Still associate with the user's session
                    characterId: characterId,
                    sender: 'character',
                    text: aiResponseText,
                    timestamp: serverTimestamp() as Timestamp,
                 };
                 // Add character response to Firestore
                 await addDoc(collection(db, 'chatMessages'), characterMessageData);
            }

             // Update session last message time (optional, can be done server-side)
             // await updateDoc(doc(db, 'chatSessions', sessionId), { lastMessageAt: serverTimestamp() });


        } catch (err) {
            console.error("Error sending message:", err);
            toast({
                title: "Send Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
            // Optionally: Add the failed message back to the input
            // setNewMessage(textToSend);
        } finally {
            setSending(false);
            // Ensure scroll happens after potential Firestore updates
            scrollToBottom();
        }
    };

     if (authLoading || loadingCharacter) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
     }

     if (!user) {
         // Should be caught by ProtectedRoute layout if applied, but good fallback
         return (
             <div className="flex flex-col items-center justify-center h-screen text-center">
                 <p className="text-lg mb-4">Please log in to chat with characters.</p>
                 <Button asChild>
                     <Link href={`/login?redirect=/character/${characterId}/chat`}>Login</Link>
                 </Button>
             </div>
         );
     }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button asChild variant="outline" className="mt-6">
                     <Link href="/characters">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Characters
                     </Link>
                </Button>
            </div>
        );
    }

     if (!character) {
         return <p className="text-center py-16 text-muted-foreground">Character not found.</p>; // Should be covered by error state
     }


    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]"> {/* Full height minus header */}
            {/* Chat Header */}
            <CardHeader className="flex flex-row items-center gap-4 p-4 border-b bg-card sticky top-16 z-30">
                 <Button variant="ghost" size="icon" asChild className="mr-2">
                      <Link href={`/character/${character.id}`}>
                         <ArrowLeft />
                      </Link>
                 </Button>
                <Avatar>
                    <AvatarImage src={character.imageUrl || `https://picsum.photos/seed/${character.id}/40/40`} alt={character.name} />
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <CardTitle className="text-lg">{character.name}</CardTitle>
                    {/* Optional: Add status like 'Online' or 'Typing...' */}
                </div>
                {/* Add Actions like voice call button here later */}
            </CardHeader>

            {/* Chat Messages Area */}
            <ScrollArea className="flex-grow bg-background/80 p-4" viewportRef={viewportRef} ref={scrollAreaRef}>
                 {loadingMessages ? (
                     <div className="flex justify-center items-center h-full">
                         <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     </div>
                 ) : (
                    <>
                     {/* Load More Button */}
                     {hasMoreMessages && (
                        <div className="text-center mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadMoreMessages}
                                disabled={loadingMore}
                            >
                                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Older Messages"}
                            </Button>
                        </div>
                     )}
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-end gap-2",
                                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.sender === 'character' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={character.imageUrl || `https://picsum.photos/seed/${character.id}/40/40`} />
                                        <AvatarFallback><Bot size={16} /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
                                        msg.sender === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card border'
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    <p className={cn("text-xs mt-1", msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right')}>
                                        {/* Format timestamp - ensure it's a valid date */}
                                         {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'p') : '...'}
                                    </p>
                                </div>
                                 {msg.sender === 'user' && user && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback>
                                             {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={16} />}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {sending && ( // Display optimistic UI while sending user message
                            <div className="flex items-end gap-2 justify-end opacity-50">
                                <div className="max-w-[70%] rounded-lg px-3 py-2 shadow-sm bg-primary text-primary-foreground">
                                    <p className="text-sm whitespace-pre-wrap">{newMessage}</p> {/* Show the message being sent */}
                                    <p className="text-xs text-primary-foreground/70 text-right mt-1">Sending...</p>
                                </div>
                                {user && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.photoURL || undefined} />
                                         <AvatarFallback>
                                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={16}/>}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )}
                    </div>
                   </>
                )}
            </ScrollArea>

            {/* Message Input Area */}
            <CardFooter className="p-4 border-t bg-card">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                        disabled={sending || loadingMessages}
                        className="flex-grow"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardFooter>
        </div>
    );
}


// Need toast import
import { useToast } from "@/hooks/use-toast";
// Need cn import
import { cn } from "@/lib/utils";
// Import AlertCircle if needed
import { AlertCircle } from 'lucide-react';
