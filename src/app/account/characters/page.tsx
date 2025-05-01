'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Character, CharacterStatus } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Eye, EyeOff, Loader2, AlertCircle, Bot } from 'lucide-react';
import { format } from 'date-fns'; // For formatting dates
import { cn } from '@/lib/utils'; // For conditional classes

export default function MyCharactersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);


     const getStatusBadgeVariant = (status: CharacterStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case 'Approved': return 'default'; // Use primary color (via default variant)
            case 'Pending': return 'secondary'; // Muted/secondary look
            case 'Draft': return 'outline'; // Outline style
            case 'Rejected': return 'destructive'; // Destructive style
            default: return 'secondary';
        }
    };

    useEffect(() => {
        if (!user || authLoading) {
             if (!authLoading) setLoading(false); // Stop loading if not logged in
            return;
        }

        setLoading(true);
        setError(null);

        const charactersQuery = query(
            collection(db, 'characters'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(charactersQuery, (querySnapshot) => {
            const fetchedCharacters: Character[] = [];
            querySnapshot.forEach((doc) => {
                fetchedCharacters.push({ id: doc.id, ...doc.data() } as Character);
            });
            setCharacters(fetchedCharacters);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching user characters:", err);
            setError("Failed to load your characters.");
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount

    }, [user, authLoading]);


    const handleDeleteCharacter = async (characterId: string) => {
         setDeletingId(characterId);
         try {
             await deleteDoc(doc(db, 'characters', characterId));
             toast({
                 title: "Character Deleted",
                 description: "The character has been successfully deleted.",
             });
         } catch (err) {
             console.error("Error deleting character:", err);
             toast({
                 title: "Deletion Failed",
                 description: "Could not delete the character. Please try again.",
                 variant: "destructive",
             });
         } finally {
             setDeletingId(null);
         }
     };

      const togglePublicVisibility = async (character: Character) => {
         setTogglingId(character.id);
         const newPublicState = !character.isPublic;
         try {
             await updateDoc(doc(db, 'characters', character.id), {
                 isPublic: newPublicState
             });
             toast({
                 title: "Visibility Updated",
                 description: `Character is now ${newPublicState ? 'public' : 'private'}.`,
             });
         } catch (err) {
             console.error("Error updating visibility:", err);
             toast({
                 title: "Update Failed",
                 description: "Could not update character visibility.",
                 variant: "destructive",
             });
         } finally {
             setTogglingId(null);
         }
     };


    const renderSkeleton = () => (
        Array.from({ length: 3 }).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-10 w-10 rounded-full bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 bg-muted rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                 <TableCell><Skeleton className="h-4 w-16 bg-muted rounded" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 bg-muted rounded" /></TableCell>
            </TableRow>
        ))
    );


    if (authLoading) {
        // Show a page-level loader if auth is still loading
         return <div className="flex justify-center items-center p-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

     if (!user) {
        // Prompt to login if not authenticated
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
                            <TableHead>Visibility</TableHead>
                            <TableHead className="text-right w-[50px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            renderSkeleton()
                         ) : characters.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                                             <AvatarImage src={char.imageUrl || `https://picsum.photos/seed/${char.id}/40/40`} alt={char.name}/>
                                             <AvatarFallback>
                                                 {char.name ? char.name.charAt(0).toUpperCase() : '?'}
                                             </AvatarFallback>
                                         </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{char.name}</TableCell>
                                    <TableCell>
                                         <Badge variant={getStatusBadgeVariant(char.status)}>{char.status}</Badge>
                                         {char.status === 'Rejected' && char.adminFeedback && (
                                            <p className="text-xs text-muted-foreground mt-1 italic truncate" title={char.adminFeedback}>
                                                Reason: {char.adminFeedback}
                                            </p>
                                         )}
                                     </TableCell>
                                    <TableCell>
                                         {char.updatedAt?.toDate ? format(char.updatedAt.toDate(), 'PPp') : 'N/A'}
                                    </TableCell>
                                      <TableCell>
                                         {char.status === 'Approved' ? (
                                             <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => togglePublicVisibility(char)}
                                                 disabled={togglingId === char.id}
                                                 className={cn("flex items-center gap-1 px-2 h-8", char.isPublic ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground')}
                                             >
                                                 {togglingId === char.id ? (
                                                     <Loader2 className="h-4 w-4 animate-spin" />
                                                 ) : char.isPublic ? (
                                                     <Eye className="h-4 w-4" />
                                                 ) : (
                                                     <EyeOff className="h-4 w-4" />
                                                 )}
                                                 {char.isPublic ? 'Public' : 'Private'}
                                             </Button>
                                         ) : (
                                             <span className="text-sm text-muted-foreground italic">N/A</span>
                                         )}
                                    </TableCell>
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
                                                     {/* Edit only available for Draft/Rejected */}
                                                     <DropdownMenuItem asChild disabled={!(char.status === 'Draft' || char.status === 'Rejected')}>
                                                        <Link href={`/account/characters/edit/${char.id}`}>
                                                             <Edit className="mr-2 h-4 w-4" /> Edit
                                                         </Link>
                                                     </DropdownMenuItem>
                                                    <AlertDialogTrigger asChild>
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

// Need buttonVariants import for AlertDialogAction styling
import { buttonVariants } from "@/components/ui/button";
