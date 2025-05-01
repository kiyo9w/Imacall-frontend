'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import {
    CharacterPublic,
    MessagePublic,
    MessagesPublic,
    ConversationPublic
} from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Removed Card, CardContent
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, ArrowLeft, Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import axios from 'axios';

const MESSAGES_PER_LOAD = 20;

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const characterId = params.id as string;
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const [character, setCharacter] = useState<CharacterPublic | null>(null);
    const [messages, setMessages] = useState<MessagePublic[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingCharacter, setLoadingCharacter] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(searchParams.get('conversationId'));
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0); // To track total for pagination


    // 1. Fetch Character Details
    useEffect(() => {
        const fetchCharacter = async () => {
            if (!characterId) return;
            setLoadingCharacter(true);
            setError(null);
            try {
                // Use the public endpoint for approved characters
                const response = await apiClient.get<CharacterPublic>(`/characters/${characterId}`);
                setCharacter(response.data);
            } catch (err) {
                console.error("Error fetching character:", err);
                 let errorMsg = "Failed to load character details.";
                  if (axios.isAxiosError(err) && err.response?.status === 404) {
                     errorMsg = 'Character not found or is not available for chat.';
                  } else if (axios.isAxiosError(err) && err.response?.status === 401) {
                     errorMsg = 'Authentication error. Please log in again.';
                  }
                 setError(errorMsg);
                 setCharacter(null);
            } finally {
                setLoadingCharacter(false);
            }
        };
        fetchCharacter();
    }, [characterId]);

    // 2. Fetch Messages or Start Conversation
    const fetchMessages = useCallback(async (convId: string, loadMore = false) => {
        const currentMessagesCount = loadMore ? messages.length : 0;
        if (loadMore) setLoadingMore(true);
        else setLoadingMessages(true);

        try {
            const response = await apiClient.get<MessagesPublic>(
                `/conversations/${convId}/messages`,
                {
                    params: {
                        skip: currentMessagesCount,
                        limit: MESSAGES_PER_LOAD,
                        // Add sort params if needed, e.g., sort_by=timestamp&sort_dir=asc
                    }
                }
            );
             const fetchedMessages = response.data.data;
            // Assuming API returns messages oldest first, otherwise reverse here
             // fetchedMessages.sort((a,b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

            setMessages(prev => loadMore ? [...prev, ...fetchedMessages] : fetchedMessages);
            setTotalMessages(response.data.count);
            setHasMoreMessages((loadMore ? messages.length : 0) + fetchedMessages.length < response.data.count);

            if (!loadMore) {
                scrollToBottom('auto'); // Instant scroll on initial load
            }

        } catch (err) {
            console.error("Error fetching messages:", err);
            setError("Failed to load chat messages.");
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setError("Conversation not found or you don't have access.");
                 setConversationId(null); // Reset conversation ID if not found
            }
        } finally {
            setLoadingMessages(false);
            setLoadingMore(false);
        }
    }, [messages.length]); // Include messages.length for pagination skip calculation


     // Start conversation or fetch initial messages
    useEffect(() => {
        if (!user || !characterId || authLoading) return;

        if (conversationId) {
            console.log("Fetching messages for existing conversation:", conversationId);
            fetchMessages(conversationId, false);
        } else {
             // No conversation ID, implies we might need to start one before sending the first message
             // For now, disable sending until a conversation is potentially started
             console.log("No conversation ID found in URL.");
             setLoadingMessages(false); // Stop loading indicator
             setMessages([]); // Ensure messages are empty
             setHasMoreMessages(false);
             // Optionally, show a button or prompt to "Start Conversation"
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, characterId, authLoading, conversationId, fetchMessages]); // Rerun if conversationId changes


    // 3. Scroll to Bottom Helper
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        setTimeout(() => {
            if (viewportRef.current) {
                viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior });
            }
        }, 100); // Adjust delay if needed
    };

    // Scroll to bottom when new messages are added (if near bottom)
    useEffect(() => {
         if (!loadingMessages && viewportRef.current) {
             const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
             // Scroll if user is close to the bottom (e.g., within 200px)
             if (scrollHeight - scrollTop - clientHeight < 200) {
                 scrollToBottom('smooth');
             }
         }
     }, [messages.length, loadingMessages]); // Depend on messages length and loading state


     // Function to start a new conversation
     const startConversation = async (): Promise<string | null> => {
        if (!user || !characterId) return null;
        setSending(true); // Indicate loading state
        setError(null);
        try {
            console.log("Attempting to start conversation with character:", characterId);
            const response = await apiClient.post<ConversationPublic>('/conversations/', { character_id: characterId });
            const newConvId = response.data.id;
            console.log("Conversation started:", newConvId);
            setConversationId(newConvId);
            // Update URL without full page reload
            router.replace(`/character/${characterId}/chat?conversationId=${newConvId}`, { scroll: false });
            return newConvId;
        } catch (err) {
            console.error("Error starting conversation:", err);
            setError("Could not start a new conversation. Please try again.");
             toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
            return null;
        } finally {
            // Keep sending true until message is actually sent
            // setSending(false);
        }
    };


    // 4. Handle Sending Message
    const handleSendMessage = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user || !characterId || sending || authLoading) return;

        let currentConvId = conversationId;

        // If no conversation exists, start one first
        if (!currentConvId) {
             currentConvId = await startConversation();
             if (!currentConvId) {
                 setSending(false); // Ensure sending is false if starting failed
                 return; // Stop if conversation couldn't be started
             }
        }

        setSending(true);
        const textToSend = newMessage.trim();

         // Optimistic UI update
        const optimisticUserMessage: MessagePublic = {
             id: `temp-${Date.now()}`, // Temporary ID
             conversation_id: currentConvId,
             userId: user.id, // Use user.id from AuthContext
             characterId: characterId, // Store for context if needed, though API uses conversation_id
             sender: 'user',
             content: textToSend,
             timestamp: new Date().toISOString(), // Use ISO string for consistency
        };
         setMessages(prev => [...prev, optimisticUserMessage]);
        setNewMessage(''); // Clear input immediately
        scrollToBottom();

        try {
            // Call API to send message
            const response = await apiClient.post<MessagePublic>(
                `/conversations/${currentConvId}/messages`,
                { content: textToSend }
            );

            const aiResponse = response.data; // API should return the AI's response message

             // Replace optimistic user message with actual one? Not strictly necessary if API doesn't return it.
             // Add AI response
             // Ensure AI response is correctly formatted as MessagePublic
             if (aiResponse && aiResponse.sender === 'character') { // Or whatever sender type API uses
                setMessages(prev => [...prev.filter(m => m.id !== optimisticUserMessage.id), aiResponse]); // Replace temp message or just add AI response
             } else {
                 // Handle cases where API might return user message or something else unexpected
                 console.warn("Received unexpected response format after sending message:", response.data);
                 // Remove optimistic message if AI response wasn't received correctly
                  setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
             }

        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message.");
            toast({
                title: "Send Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
            // Remove optimistic message on error
             setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
             setNewMessage(textToSend); // Put message back in input
        } finally {
            setSending(false);
            scrollToBottom();
        }
    };

    // Function to load older messages (pagination)
    const loadMore = () => {
        if (conversationId && hasMoreMessages && !loadingMore) {
            fetchMessages(conversationId, true);
        }
    };

     // Loading states
     if (authLoading || loadingCharacter) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
     }

     // Not logged in
     if (!user && !authLoading) {
         return (
             <div className="flex flex-col items-center justify-center h-screen text-center">
                 <p className="text-lg mb-4">Please log in to chat with characters.</p>
                 <Button asChild>
                     <Link href={`/login?redirect=/character/${characterId}/chat${conversationId ? `?conversationId=${conversationId}` : ''}`}>Login</Link>
                 </Button>
             </div>
         );
     }

     // Error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button asChild variant="outline" className="mt-6">
                     <Link href={`/character/${characterId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Character
                     </Link>
                </Button>
            </div>
        );
    }

     // Character not found after loading
     if (!character && !loadingCharacter) {
         return <p className="text-center py-16 text-muted-foreground">Character details could not be loaded.</p>;
     }


    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background"> {/* Full height minus header */}
            {/* Chat Header */}
            <CardHeader className="flex flex-row items-center gap-4 p-3 border-b bg-card sticky top-16 z-10"> {/* Reduced padding */}
                 <Button variant="ghost" size="icon" asChild className="mr-1"> {/* Reduced margin */}
                      {/* Link back to character detail page */}
                      <Link href={`/character/${characterId}`}>
                         <ArrowLeft />
                      </Link>
                 </Button>
                 {character && (
                     <>
                        <Avatar className="h-10 w-10"> {/* Slightly smaller avatar */}
                            <AvatarImage src={character.image_url || `https://picsum.photos/seed/${character.id}/40/40`} alt={character.name} />
                            <AvatarFallback><Bot size={18} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <CardTitle className="text-lg">{character.name}</CardTitle>
                            {/* Optional: Add status */}
                        </div>
                     </>
                 )}
            </CardHeader>

            {/* Chat Messages Area */}
            <ScrollArea className="flex-grow" viewportRef={viewportRef} ref={scrollAreaRef}>
                 <div className="p-4 space-y-4"> {/* Add padding here */}
                     {/* Load More Button */}
                     {hasMoreMessages && !loadingMessages && (
                        <div className="text-center mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Older Messages"}
                            </Button>
                        </div>
                     )}

                     {loadingMessages ? (
                         <div className="flex justify-center items-center pt-10">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                      ) : messages.length === 0 && !conversationId ? (
                          <div className="text-center text-muted-foreground pt-10">
                             <MessageSquare size={40} className="mx-auto mb-2"/>
                             <p>Send a message to start the conversation.</p>
                           </div>
                      ) : messages.length === 0 && conversationId ? (
                           <div className="text-center text-muted-foreground pt-10">
                              <MessageSquare size={40} className="mx-auto mb-2"/>
                              <p>No messages in this conversation yet.</p>
                            </div>
                     ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id} // Use message ID from API
                                className={cn(
                                    "flex items-end gap-2",
                                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.sender !== 'user' && character && ( // Show character avatar for non-user messages
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={character.image_url || `https://picsum.photos/seed/${character.id}/40/40`} />
                                        <AvatarFallback><Bot size={16} /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-lg px-3 py-2 shadow-sm", // Increased max-width
                                        msg.sender === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card border',
                                         msg.id.startsWith('temp-') ? 'opacity-70' : '' // Dim optimistic message
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <p className={cn("text-xs mt-1 text-right",
                                        msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground',
                                     )}>
                                         {/* Format timestamp from ISO string */}
                                         {msg.id.startsWith('temp-') ? 'Sending...' : format(parseISO(msg.timestamp), 'p')}
                                    </p>
                                </div>
                                 {msg.sender === 'user' && user && (
                                    <Avatar className="h-8 w-8">
                                         {/* Use user's avatar if available (not in current UserPublic) */}
                                        {/* <AvatarImage src={user.photoURL || undefined} /> */}
                                        <AvatarFallback>
                                             {user.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))
                    )}
                 </div> {/* End padding div */}
            </ScrollArea>

            {/* Message Input Area */}
            <CardFooter className="p-4 border-t bg-card sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                        // Disable input while sending, loading initial messages, or if user/character isn't loaded
                        disabled={sending || loadingMessages || loadingCharacter || authLoading || !user || !character}
                        className="flex-grow"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim() || loadingMessages || loadingCharacter || authLoading || !user || !character}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardFooter>
        </div>
    );
}
