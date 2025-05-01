'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { CharacterPublic, CharacterStatus, PaginatedResponse } from '@/types/character';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Loader2, AlertCircle, ListFilter, Bot } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { cn } from '@/lib/utils';

const CHARACTERS_PER_PAGE = 15;
const STATUS_OPTIONS: (CharacterStatus | 'all')[] = ['all', 'Pending', 'Approved', 'Rejected'];

export default function AdminCharactersPage() {
    const { toast } = useToast();
    const [characters, setCharacters] = useState<CharacterPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [interactingId, setInteractingId] = useState<string | null>(null); // For delete/approve/reject loading state
    const [filterStatus, setFilterStatus] = useState<CharacterStatus | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchCharacters = useCallback(async (loadMore = false) => {
        const pageToFetch = loadMore ? currentPage + 1 : 0;
        if (!loadMore) {
            setLoading(true);
            setCharacters([]);
            setCurrentPage(0);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const params: Record<string, any> = {
                skip: pageToFetch * CHARACTERS_PER_PAGE,
                limit: CHARACTERS_PER_PAGE,
                status: filterStatus === 'all' ? undefined : filterStatus.toLowerCase(), // Use lowercase for API if needed
            };
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            // Use the admin endpoint to get all characters
            const response = await apiClient.get<PaginatedResponse<CharacterPublic>>('/admin/characters/', { params });

            setCharacters(prev => loadMore ? [...prev, ...response.data.data] : response.data.data);
            setTotalCount(response.data.count);
            setCurrentPage(pageToFetch);

        } catch (err) {
            console.error("Error fetching admin characters:", err);
            let errorMsg = "Failed to load characters.";
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    errorMsg = "Unauthorized or Forbidden. You may not have permission.";
                }
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentPage, filterStatus]); // Dependencies

    useEffect(() => {
        fetchCharacters(false); // Fetch on initial load and when filter changes
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

     const handleStatusChange = async (characterId: string, action: 'approve' | 'reject') => {
         setInteractingId(characterId);
         try {
             const endpoint = `/admin/characters/${characterId}/${action}`;
             const response = await apiClient.patch<CharacterPublic>(endpoint, action === 'reject' ? { adminFeedback: 'Rejected via admin panel' } : undefined); // Optionally add feedback for rejection

             setCharacters(prev =>
                 prev.map(char =>
                     char.id === characterId ? response.data : char // Update the specific character with the response
                 )
             );
             toast({
                 title: `Character ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                 description: `Character "${response.data.name}" status updated to ${response.data.status}.`,
                 variant: action === 'approve' ? 'default' : 'destructive',
             });
         } catch (err) {
             console.error(`Error ${action}ing character:`, err);
             let errorMsg = `Could not ${action} the character.`;
             if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                 errorMsg = `You do not have permission to ${action} this character.`;
             } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                 errorMsg = "Character not found.";
             }
             toast({
                 title: `${action === 'approve' ? 'Approval' : 'Rejection'} Failed`,
                 description: errorMsg,
                 variant: "destructive",
             });
         } finally {
             setInteractingId(null);
         }
     };


    const handleDeleteCharacter = async (characterId: string) => {
        setInteractingId(characterId);
        try {
            await apiClient.delete(`/admin/characters/${characterId}`);
            setCharacters(prev => prev.filter(char => char.id !== characterId));
            setTotalCount(prev => prev - 1); // Decrement total count
            toast({
                title: "Character Deleted",
                description: "The character has been permanently deleted.",
            });
        } catch (err) {
            console.error("Error deleting character:", err);
            let errorMsg = "Could not delete the character.";
             if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                 errorMsg = "You do not have permission to delete this character.";
             } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                 errorMsg = "Character not found.";
             }
            toast({
                title: "Deletion Failed",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setInteractingId(null);
        }
    };

    const getStatusBadgeVariant = (status: CharacterStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case 'Approved': return 'default'; // Using default (usually primary color) for approved
            case 'Pending': return 'secondary'; // Using secondary (usually gray-ish) for pending
            case 'Rejected': return 'destructive'; // Using destructive (red) for rejected
            default: return 'secondary';
        }
    };

    const renderSkeleton = (count = 5) => (
        Array.from({ length: count }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton className="h-10 w-10 rounded-full bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 bg-muted rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 bg-muted rounded" /></TableCell>
            </TableRow>
        ))
    );

     const hasMore = characters.length < totalCount;

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
                <div>
                    <CardTitle className="text-2xl">Character Submissions</CardTitle>
                    <CardDescription>Review, approve, reject, or edit character submissions.</CardDescription>
                </div>
                 {/* Filter Dropdown */}
                 <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as CharacterStatus | 'all')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                             {STATUS_OPTIONS.map(status => (
                                 <SelectItem key={status} value={status}>
                                    {status === 'all' ? 'All Statuses' : status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            </CardHeader>
            <CardContent>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Characters</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Creator ID</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right w-[50px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loading && characters.length === 0 ? (
                                renderSkeleton()
                             ) : !loading && characters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No characters found{filterStatus !== 'all' ? ` with status '${filterStatus}'` : ''}.
                                    </TableCell>
                                </TableRow>
                             ) : (
                                characters.map((char) => (
                                    <TableRow key={char.id} className={cn(interactingId === char.id && "opacity-50 pointer-events-none")}>
                                        <TableCell>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={char.image_url || `https://picsum.photos/seed/${char.id}/40/40`} alt={char.name}/>
                                                <AvatarFallback><Bot size={18}/></AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{char.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(char.status)}>{char.status}</Badge>
                                        </TableCell>
                                         <TableCell className="text-xs text-muted-foreground font-mono">{char.creator_id}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {char.updatedAt ? format(parseISO(char.updatedAt), 'PPp') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={interactingId === char.id}>
                                                            {interactingId === char.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                                            <span className="sr-only">Character Actions</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                         {char.status !== 'Approved' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(char.id, 'approve')} className="text-green-600 focus:text-green-700 focus:bg-green-100 cursor-pointer">
                                                                 <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                                            </DropdownMenuItem>
                                                        )}
                                                         {char.status !== 'Rejected' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(char.id, 'reject')} className="text-orange-600 focus:text-orange-700 focus:bg-orange-100 cursor-pointer">
                                                                 <XCircle className="mr-2 h-4 w-4" /> Reject
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                         {/* Link to an admin-specific edit page or reuse existing edit page */}
                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                            <Link href={`/account/characters/edit/${char.id}`}> {/* Assuming edit page handles admin edits */}
                                                                 <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                             </Link>
                                                         </DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                             <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                {/* Delete Confirmation Dialog */}
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                             Are you sure you want to permanently delete the character "{char.name}"? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteCharacter(char.id)}
                                                            className={buttonVariants({ variant: "destructive" })}
                                                        >
                                                            Delete Character
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                             {/* Skeleton placeholders while loading more */}
                             {loadingMore && renderSkeleton(3)}
                        </TableBody>
                    </Table>
                 </div>
                 {/* Load More Button */}
                 {hasMore && !loading && !loadingMore && (
                    <div className="mt-6 text-center">
                         <Button
                            onClick={() => fetchCharacters(true)}
                            variant="outline"
                            disabled={loadingMore}
                         >
                             {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                             Load More
                         </Button>
                    </div>
                 )}
                 {!hasMore && characters.length > 0 && (
                     <p className="mt-6 text-center text-sm text-muted-foreground">
                         Showing all {totalCount} characters{filterStatus !== 'all' ? ` with status '${filterStatus}'` : ''}.
                     </p>
                 )}
            </CardContent>
        </Card>
    );
}
