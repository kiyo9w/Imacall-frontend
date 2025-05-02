'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent, useCallback } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation'; // Import usePathname
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
import { CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, ArrowLeft, Bot, User as UserIcon, AlertCircle, MessageSquare, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

const MESSAGES_PER_LOAD = 30; // Load more messages at once

// Helper to format timestamp for display
const formatTimestamp = (isoString: string) => {
    try {
        const date = parseISO(isoString);
        if (isToday(date)) {
            return format(date, 'p'); // e.g., 2:30 PM
        }
        if (isYesterday(date)) {
            return `Yesterday ${format(date, 'p')}`; // e.g., Yesterday 10:15 AM
        }
        return format(date, 'MMM d, p'); // e.g., May 1, 2:30 PM
    } catch (e) {
        console.warn("Invalid date string for formatting:", isoString);
        return "Invalid Date";
    }
};


export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const characterId = params.id as string;
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null); // Ref for input focus

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
    const [totalMessages, setTotalMessages] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true); // Track scroll position
    const pathname = usePathname(); // Get pathname for redirect


    // 1. Fetch Character Details
    useEffect(() => {
        const fetchCharacter = async () => {
            if (!characterId) return;
            setLoadingCharacter(true);
            setError(null);
            try {
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
                        // Assuming API returns newest first, adjust if needed
                         // sort_by: 'timestamp',
                         // sort_dir: 'desc' // Get newest first for pagination
                    }
                }
            );
            // If API returns oldest first, reverse for display (newest at bottom)
             const fetchedMessages = response.data.data.reverse(); // Reverse here if API sends oldest first
            // If API returns newest first, simply use response.data.data

            const totalCount = response.data.count;
            setMessages(prev => loadMore ? [...fetchedMessages, ...prev] : fetchedMessages);
            setTotalMessages(totalCount);
            setHasMoreMessages(messages.length + fetchedMessages.length < totalCount);

            if (!loadMore) {
                // Only scroll to bottom instantly on initial load
                scrollToBottom('auto');
            }

        } catch (err) {
            console.error("Error fetching messages:", err);
            setError("Failed to load chat messages.");
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setError("Conversation not found or you don't have access.");
                 setConversationId(null); // Reset conversation ID if not found
            } else if (axios.isAxiosError(err) && err.response?.status === 401) {
                 setError("Authentication required to view messages.");
            } else if (axios.isAxiosError(err) && err.response?.status === 403) {
                 setError("You do not have permission to view this conversation.");
                 setConversationId(null);
            }
        } finally {
            setLoadingMessages(false);
            setLoadingMore(false);
        }
    }, [messages.length]); // messages.length dependency for skip calculation

    useEffect(() => {
        if (!user || !characterId || authLoading) return;

        if (conversationId) {
            fetchMessages(conversationId, false);
        } else {
             setLoadingMessages(false);
             setMessages([]);
             setHasMoreMessages(false);
        }
    }, [user, characterId, authLoading, conversationId, fetchMessages]); // Rerun if conversationId changes

    // 3. Scroll Management
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        setTimeout(() => { // Delay ensures DOM update before scrolling
            if (viewportRef.current) {
                viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior });
            }
        }, 50);
    };

    // Scroll to bottom when new messages are added *only if already near the bottom*
    useEffect(() => {
        if (isAtBottom && !loadingMessages) {
            scrollToBottom('smooth');
        }
    }, [messages.length, loadingMessages, isAtBottom]); // Depend on messages length, loading state, and scroll position

    // Track scroll position
     const handleScroll = useCallback(() => {
         if (!viewportRef.current) return;
         const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
         const atBottom = scrollHeight - scrollTop - clientHeight < 50; // Threshold for being "at the bottom"
         setIsAtBottom(atBottom);

         // Load more when scrolling near the top
         if (scrollTop < 100 && hasMoreMessages && !loadingMore && !loadingMessages && conversationId) {
             fetchMessages(conversationId, true);
         }
     }, [hasMoreMessages, loadingMore, loadingMessages, conversationId, fetchMessages]);

     // Add scroll listener
     useEffect(() => {
         const currentViewport = viewportRef.current;
         if (currentViewport) {
             currentViewport.addEventListener('scroll', handleScroll);
             return () => currentViewport.removeEventListener('scroll', handleScroll);
         }
     }, [handleScroll]);


     // Function to start a new conversation
     const startConversation = async (): Promise<string | null> => {
        if (!user || !characterId) return null;
        setSending(true);
        setError(null);
        try {
            const response = await apiClient.post<ConversationPublic>('/conversations/', { character_id: characterId });
            const newConvId = response.data.id;
            setConversationId(newConvId);
            router.replace(`/character/${characterId}/chat?conversationId=${newConvId}`, { scroll: false });
            return newConvId;
        } catch (err) {
            console.error("Error starting conversation:", err);
            let errorMsg = "Could not start a new conversation. Please try again.";
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                errorMsg = "Authentication required to start conversation.";
            } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                errorMsg = "Character not found or cannot be chatted with.";
            }
            setError(errorMsg);
             toast({ title: "Error", description: errorMsg, variant: "destructive" });
            return null;
        } finally {
            // Keep sending true until message is actually sent in handleSendMessage
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
                 setSending(false); // Reset sending state if starting failed
                 return;
             }
             // Ensure messages list is empty if starting new
             setMessages([]);
             setTotalMessages(0);
             setHasMoreMessages(false); // No history yet
        }

        setSending(true);
        const textToSend = newMessage.trim();
        setNewMessage(''); // Clear input immediately

        const optimisticUserMessage: MessagePublic = {
             id: `temp-${Date.now()}`,
             conversation_id: currentConvId,
             sender: 'user',
             content: textToSend,
             timestamp: new Date().toISOString(),
             // Include userId/characterId if needed by frontend logic, though API uses conversation_id
             // userId: user.id,
             // characterId: characterId,
        };

        setMessages(prev => [...prev, optimisticUserMessage]);
        scrollToBottom('smooth'); // Scroll smoothly when sending

        try {
            const response = await apiClient.post<MessagePublic>(
                `/conversations/${currentConvId}/messages`,
                { content: textToSend }
            );
            const aiResponse = response.data;

            if (aiResponse && aiResponse.sender === 'character') {
                 // Replace optimistic message with potentially nothing (if API only returns AI response)
                 // then add the AI response
                setMessages(prev => [
                    ...prev.filter(m => m.id !== optimisticUserMessage.id),
                    aiResponse // Add the AI's message from the response
                ]);
             } else {
                 console.warn("Received unexpected response format after sending message:", response.data);
                  // If API unexpectedly returned the user message instead of AI, update ID
                  if(response.data && response.data.id && response.data.sender === 'user' && response.data.content === textToSend) {
                     setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? response.data : m));
                  } else {
                     // Remove optimistic message if AI response wasn't valid
                     setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
                  }
             }

        } catch (err) {
            console.error("Error sending message:", err);
            let errorMsg = "Failed to send message. Please try again.";
             if (axios.isAxiosError(err) && err.response?.status === 401) {
                 errorMsg = "Authentication error sending message.";
             } else if (axios.isAxiosError(err) && err.response?.status === 403) {
                 errorMsg = "You don't have permission for this conversation.";
             } else if (axios.isAxiosError(err) && err.response?.status === 422) {
                  errorMsg = "Message content invalid or too long.";
             } else if (axios.isAxiosError(err) && err.response?.status === 500) {
                 errorMsg = "An error occurred on the server while generating the response.";
             }
            setError(errorMsg); // Display error to user potentially
            toast({ title: "Send Error", description: errorMsg, variant: "destructive" });
            // Remove optimistic message and restore input content
             setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
             setNewMessage(textToSend);
        } finally {
            setSending(false);
            inputRef.current?.focus(); // Refocus input after sending
        }
    };


    // Loading skeleton for messages
    const renderMessageSkeleton = (count = 5) => (
         <div className="space-y-6 p-4">
             {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={cn("flex items-end gap-2", i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                    {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full bg-muted" />}
                    <div className={cn("max-w-[70%] rounded-xl p-3 space-y-1.5 shadow-sm", i % 2 === 0 ? 'bg-card' : 'bg-primary text-primary-foreground')}>
                        <Skeleton className={cn("h-3 w-32", i % 2 === 0 ? 'bg-muted' : 'bg-primary-foreground/30')} />
                         <Skeleton className={cn("h-3 w-24", i % 2 === 0 ? 'bg-muted' : 'bg-primary-foreground/30')} />
                    </div>
                    {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full bg-muted" />}
                </div>
             ))}
         </div>
    );

     // Combined loading states
     if (authLoading || loadingCharacter) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                 {/* Skeleton Header */}
                 <CardHeader className="flex flex-row items-center gap-4 p-3 border-b bg-card/95 backdrop-blur-sm sticky top-16 z-10 shadow-sm">
                     <Skeleton className="h-9 w-9 rounded-md bg-muted" />
                     <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                     <div className="flex-grow space-y-1">
                         <Skeleton className="h-5 w-32 bg-muted" />
                         <Skeleton className="h-3 w-20 bg-muted" />
                     </div>
                     <Skeleton className="h-9 w-9 rounded-md bg-muted" />
                 </CardHeader>
                 <div className="flex-grow flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 </div>
                 {/* Skeleton Footer */}
                 <CardFooter className="p-3 border-t bg-card/95 backdrop-blur-sm sticky bottom-0">
                      <div className="flex w-full items-center gap-2">
                         <Skeleton className="h-10 flex-grow bg-muted rounded-lg"/>
                         <Skeleton className="h-10 w-10 bg-muted rounded-lg"/>
                      </div>
                 </CardFooter>
            </div>
        );
     }

     // Not logged in
     if (!user && !authLoading) {
         return (
             <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
                 <UserIcon className="h-16 w-16 text-muted-foreground mb-4"/>
                 <p className="text-lg font-medium mb-2">Login Required</p>
                 <p className="text-muted-foreground mb-6">Please log in to start chatting with characters.</p>
                 <Button asChild>
                     <Link href={`/login?redirect=${encodeURIComponent(pathname + searchParams.toString())}`}>Login</Link>
                 </Button>
             </div>
         );
     }

     // Error state
    if (error && !loadingMessages) { // Show error only if not also loading
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-semibold mb-2">Chat Error</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                 <Button asChild variant="outline" onClick={() => router.back()}> {/* Go back on error */}
                     {/* <Link href={`/character/${characterId}`}> */}
                        <ArrowLeft className="mr-2 h-4 w-4"/> Go Back
                     {/* </Link> */}
                </Button>
            </div>
        );
    }

     // Character not found after loading
     if (!character && !loadingCharacter) {
         return <p className="text-center py-16 text-muted-foreground">Character details could not be loaded.</p>;
     }


    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-secondary/20 to-background"> {/* Subtle gradient background */}
            {/* Chat Header */}
            <CardHeader className="flex flex-row items-center gap-3 p-3 border-b bg-card/95 backdrop-blur-sm sticky top-16 z-10 shadow-sm">
                 <Button variant="ghost" size="icon" asChild className="mr-1 text-muted-foreground hover:text-foreground">
                      <Link href={`/character/${characterId}`} aria-label="Back to character">
                         <ArrowLeft />
                      </Link>
                 </Button>
                 {character && (
                     <>
                        <Avatar className="h-10 w-10 border-2 border-border/60 shadow-sm">
                            <AvatarImage src={character.image_url || `https://picsum.photos/seed/${character.id}/40/40`} alt={character.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-medium"><Bot size={18} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <CardTitle className="text-base font-semibold line-clamp-1">{character.name}</CardTitle>
                             {/* Optional: Online status or description */}
                             <p className="text-xs text-muted-foreground line-clamp-1">
                                {/* {character.description || 'Ready to chat'} */}
                                <span className="text-green-600 mr-1">•</span> Online
                            </p>
                        </div>
                        {/* Optional: Header actions (e.g., call button - disabled) */}
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors" disabled>
                             <Phone size={18} />
                             <span className="sr-only">Voice call (coming soon)</span>
                         </Button>
                     </>
                 )}
            </CardHeader>

            {/* Chat Messages Area */}
            <ScrollArea className="flex-grow" viewportRef={viewportRef} ref={scrollAreaRef} onScroll={handleScroll}>
                 <div className="p-4 space-y-6"> {/* Increased spacing */}
                     {/* Load More Spinner/Button */}
                      {loadingMessages ? (
                          renderMessageSkeleton()
                      ) : (
                         <>
                             {loadingMore ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
                             ) : hasMoreMessages && conversationId && ( // Only show if conv exists
                                <div className="text-center mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchMessages(conversationId!, true)}
                                        className="text-xs rounded-full shadow-sm hover:shadow-md"
                                    >
                                        Load Older Messages
                                    </Button>
                                </div>
                             )}

                             {messages.length === 0 && !conversationId ? (
                                 <div className="text-center text-muted-foreground pt-10 flex flex-col items-center">
                                     <MessageSquare size={40} className="mb-3 opacity-50"/>
                                     <p>Send the first message to start the conversation.</p>
                                 </div>
                             ) : messages.length === 0 && conversationId ? (
                                 <div className="text-center text-muted-foreground pt-10 flex flex-col items-center">
                                     <MessageSquare size={40} className="mb-3 opacity-50"/>
                                     <p>No messages yet in this conversation.</p>
                                     <p className="text-sm mt-1">Say hello!</p>
                                 </div>
                             ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300",
                                            msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                        )}
                                        style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }} // Stagger animation slightly
                                    >
                                        {msg.sender !== 'user' && character && (
                                            <Avatar className="h-8 w-8 self-end border shadow-sm"> {/* Align avatar bottom */}
                                                <AvatarImage src={character.image_url || `https://picsum.photos/seed/${character.id}/32/32`} />
                                                <AvatarFallback className="bg-muted text-muted-foreground"><Bot size={16} /></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[75%] rounded-xl px-3.5 py-2 shadow-md relative", // Rounded-xl, slightly stronger shadow
                                                msg.sender === 'user'
                                                    ? 'bg-gradient-to-br from-primary to-teal-500 text-primary-foreground rounded-br-none' // Gradient for user
                                                    : 'bg-card border border-border/60 rounded-bl-none', // Card bg for AI
                                                msg.id.startsWith('temp-') ? 'opacity-70' : ''
                                            )}
                                        >
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <p className={cn("text-[10px] mt-1.5 text-right",
                                                msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground',
                                            )}>
                                                 {msg.id.startsWith('temp-') ? 'Sending...' : formatTimestamp(msg.timestamp)}
                                            </p>
                                        </div>
                                         {msg.sender === 'user' && user && (
                                            <Avatar className="h-8 w-8 self-end border shadow-sm"> {/* Align avatar bottom */}
                                                 {/* Add user avatar if available */}
                                                {/* <AvatarImage src={user.avatarUrl} /> */}
                                                <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                                                     {user.full_name ? getInitials(user.full_name) : <UserIcon size={16} />}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))
                            )}
                         </>
                      )}

                 </div> {/* End padding div */}
            </ScrollArea>

            {/* Message Input Area */}
            <CardFooter className="p-3 border-t bg-card/95 backdrop-blur-sm sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                        disabled={sending || loadingMessages || loadingCharacter || authLoading || !user || !character}
                        className="flex-grow h-10 rounded-full px-4 focus-visible:ring-primary/60" // Rounded full
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim() || loadingMessages || loadingCharacter || authLoading || !user || !character} className="rounded-full w-10 h-10 flex-shrink-0 shadow-md hover:shadow-lg">
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="sr-only">Send message</span>
                    </Button>
                </form>
            </CardFooter>
        </div>
    );
}

// Helper function to get initials (if not already imported/available)
const getInitials = (name?: string | null): string => {
     if (!name) return '?';
     const names = name.trim().split(' ');
     if (names.length === 1 && names[0]) return names[0].charAt(0).toUpperCase();
     if (names.length > 1 && names[0] && names[names.length - 1]) {
       return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
     }
     return '?';
};

