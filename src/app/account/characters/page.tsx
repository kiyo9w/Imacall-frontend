'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient'; // Import API client
import { CharacterPublic, CharacterStatus, PaginatedResponse } from '@/types/character'; // Use API types
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Bot, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'; // Keep icons
import { format, parseISO } from 'date-fns'; // Keep date-fns, use parseISO for API dates
import { cn } from '@/lib/utils'; // Keep cn
import axios from 'axios'; // For error handling
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components


const CHARACTERS_PER_PAGE = 10; // Example pagination limit

export default function MyCharactersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [characters, setCharacters] = useState<CharacterPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Removed toggling state as isPublic toggle might be admin-only
    // const [togglingId, setTogglingId] = useState<string | null>(null);

     const getStatusBadgeVariant = (status: CharacterStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            // case 'Draft': return 'outline'; // No 'Draft' status in API? Assuming only Pending, Approved, Rejected
            case 'Rejected': return 'destructive';
            default: return 'secondary';
        }
    };

    const fetchMyCharacters = async () => {
        if (!user) return; // Should be handled by ProtectedRoute

        setLoading(true);
        setError(null);

        try {
             // Call the API endpoint to get user's submissions
            const response = await apiClient.get<PaginatedResponse<CharacterPublic>>(
                '/characters/my-submissions', // Endpoint for user's own characters regardless of status
                {
                    params: {
                        skip: 0,
                        limit: 100 // Fetch a larger number initially, or implement pagination
                    }
                }
            );
             // Sort by updatedAt or createdAt if available, otherwise keep API order (or implement server-side sorting)
            const sortedCharacters = response.data.data.sort((a, b) => {
                const dateA = a.updatedAt ? parseISO(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? parseISO(b.updatedAt).getTime() : 0;
                return dateB - dateA; // Descending order
            });

            setCharacters(sortedCharacters);
        } catch (err) {
            console.error("Error fetching user characters:", err);
            setError("Failed to load your characters.");
             if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError("Authentication error. Please log in again.");
                // Optionally redirect to login
             }
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (!authLoading && user) {
            fetchMyCharacters();
        } else if (!authLoading && !user) {
            setLoading(false); // Stop loading if not logged in
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]); // Fetch when user context is ready


    const handleDeleteCharacter = async (characterId: string) => {
         setDeletingId(characterId);
         try {
             // Call the ADMIN delete endpoint - Requires admin privileges on backend!
             // If users can delete their own SUBMISSIONS (e.g., pending/rejected),
             // the backend needs a different endpoint or logic.
             // Assuming admin endpoint for now.
             await apiClient.delete(`/admin/characters/${characterId}`);
             setCharacters(prev => prev.filter(char => char.id !== characterId)); // Optimistic update
             toast({
                 title: "Character Deleted",
                 description: "The character has been successfully deleted.",
             });
         } catch (err) {
             console.error("Error deleting character:", err);
             let errorMsg = "Could not delete the character. Please try again.";
              if (axios.isAxiosError(err) && err.response?.status === 403) {
                  errorMsg = "You do not have permission to delete this character.";
              } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                  errorMsg = "Character not found.";
              }
             toast({
                 title: "Deletion Failed",
                 description: errorMsg,
                 variant: "destructive",
             });
              // Revert optimistic update if needed, or refetch
             // fetchMyCharacters();
         } finally {
             setDeletingId(null);
         }
     };

      // Public visibility toggle removed - Assume this is admin controlled via admin update endpoint

    const renderSkeleton = () => (
        Array.from({ length: 3 }).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-10 w-10 rounded-full bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 bg-muted rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                 {/* Visibility column removed */}
                {/* <TableCell><Skeleton className="h-4 w-16 bg-muted rounded" /></TableCell> */}
                <TableCell><Skeleton className="h-8 w-8 bg-muted rounded" /></TableCell>
            </TableRow>
        ))
    );


    if (authLoading) {
        return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

     if (!user && !loading) { // Check loading state too
         return (
            <div className="text-center py-16">
                <p className="text-lg mb-4">Please log in to manage your characters.</p>
                 <Button asChild>
                    <Link href="/login?redirect=/account/characters">Login</Link>
                 </Button>
             </div>
         );
     }


    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="text-2xl">My Characters</CardTitle>
                    <CardDescription>Manage the characters you have created.</CardDescription>
                </div>
                <Button asChild>
                    <Link href="/account/characters/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">Avatar</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            {/* Visibility column removed */}
                            {/* <TableHead>Visibility</TableHead> */}
                            <TableHead className="text-right w-[50px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            renderSkeleton()
                         ) : characters.length === 0 ? (
                             <TableRow>
                                {/* Adjusted colspan */}
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    <Bot className="h-8 w-8 mx-auto mb-2"/>
                                     You haven't created any characters yet.
                                     <Link href="/account/characters/new" className="text-primary font-medium hover:underline ml-1">Create one now!</Link>
                                </TableCell>
                            </TableRow>
                         ) : (
                            characters.map((char) => (
                                <TableRow key={char.id}>
                                    <TableCell>
                                         <Avatar className="h-10 w-10">
                                            {/* Use image_url from API */}
                                             <AvatarImage src={char.image_url || `https://picsum.photos/seed/${char.id}/40/40`} alt={char.name}/>
                                             <AvatarFallback>
                                                 {char.name ? char.name.charAt(0).toUpperCase() : '?'}
                                             </AvatarFallback>
                                         </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{char.name}</TableCell>
                                    <TableCell>
                                         <Badge variant={getStatusBadgeVariant(char.status)}>{char.status}</Badge>
                                         {/* Admin Feedback might not be directly available in this endpoint, adjust if needed */}
                                         {/* {char.status === 'Rejected' && char.adminFeedback && ( ... )} */}
                                     </TableCell>
                                    <TableCell>
                                         {/* Use updatedAt from API, parse ISO string */}
                                         {char.updatedAt ? format(parseISO(char.updatedAt), 'PPp') : 'N/A'}
                                    </TableCell>
                                    {/* Visibility Cell Removed */}
                                    {/*
                                     <TableCell>
                                         {char.status === 'Approved' ? (
                                             <div className="flex items-center gap-1">
                                                  {char.isPublic ? <Eye className="h-4 w-4 text-green-600"/> : <EyeOff className="h-4 w-4 text-muted-foreground"/>}
                                                  {char.isPublic ? 'Public' : 'Private'}
                                             </div>
                                         ) : (
                                             <span className="text-sm text-muted-foreground italic">N/A</span>
                                         )}
                                     </TableCell>
                                    */}
                                    <TableCell className="text-right">
                                         <AlertDialog>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingId === char.id}>
                                                         {deletingId === char.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                     {/* Edit only available for Pending/Rejected? API might differ from Firestore 'Draft' */}
                                                     {/* Check if API allows editing 'Pending' or only 'Rejected' */}
                                                     <DropdownMenuItem asChild disabled={!(char.status === 'Pending' || char.status === 'Rejected')}>
                                                        <Link href={`/account/characters/edit/${char.id}`}>
                                                             <Edit className="mr-2 h-4 w-4" /> Edit
                                                         </Link>
                                                     </DropdownMenuItem>
                                                    <AlertDialogTrigger asChild>
                                                         {/* Add check for user permission if delete is user-specific */}
                                                         <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={deletingId === char.id}>
                                                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                         </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                             </DropdownMenu>
                                             <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the character "{char.name}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={deletingId === char.id}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteCharacter(char.id)}
                                                        disabled={deletingId === char.id}
                                                        className={buttonVariants({ variant: "destructive" })}
                                                     >
                                                        {deletingId === char.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
