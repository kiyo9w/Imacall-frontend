'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { UserPublic, PaginatedResponse } from '@/types/auth'; // Assuming UserPublic is in auth types
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Edit, Trash2, UserPlus, Loader2, AlertCircle, ShieldCheck, ShieldOff, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { Input } from '@/components/ui/input'; // For search/filter
import { useDebounce } from '@/hooks/use-debounce';

const USERS_PER_PAGE = 15;

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchUsers = async (loadMore = false) => {
        const pageToFetch = loadMore ? currentPage + 1 : 0;
        if (!loadMore) {
            setLoading(true);
            setUsers([]);
            setCurrentPage(0);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const params: Record<string, any> = {
                skip: pageToFetch * USERS_PER_PAGE,
                limit: USERS_PER_PAGE,
                // Add search query param if backend supports it (e.g., ?search=...)
                // search: debouncedSearchTerm || undefined,
            };
             // Filter out undefined params
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await apiClient.get<PaginatedResponse<UserPublic>>('/users/', { params });

            let fetchedUsers = response.data.data;
             // Client-side search fallback if API doesn't support it
             if (debouncedSearchTerm && !params.search) {
                 fetchedUsers = fetchedUsers.filter(user =>
                     user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                     user.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                 );
             }

            setUsers(prev => loadMore ? [...prev, ...fetchedUsers] : fetchedUsers);
            setTotalCount(response.data.count); // Use total count from API
            setCurrentPage(pageToFetch);

        } catch (err) {
            console.error("Error fetching users:", err);
            let errorMsg = "Failed to load users.";
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
    };

    useEffect(() => {
        fetchUsers(false); // Fetch on initial load and when search term changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm]);

    const handleDeleteUser = async (userId: string) => {
        setDeletingId(userId);
        try {
            await apiClient.delete(`/users/${userId}`);
            setUsers(prev => prev.filter(user => user.id !== userId));
            setTotalCount(prev => prev - 1); // Decrement total count
            toast({
                title: "User Deleted",
                description: "The user account has been successfully deleted.",
            });
        } catch (err) {
            console.error("Error deleting user:", err);
            let errorMsg = "Could not delete the user. Please try again.";
            if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                errorMsg = "You do not have permission to delete this user.";
            } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                errorMsg = "User not found.";
            }
            toast({
                title: "Deletion Failed",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setDeletingId(null);
        }
    };

     // Placeholder functions for create/edit actions
     const handleCreateUser = () => {
         // TODO: Implement user creation (e.g., open a modal form)
         toast({ title: "Action Needed", description: "User creation form not implemented yet." });
         console.log("Trigger Create User");
     };
     const handleEditUser = (userId: string) => {
          // TODO: Implement user editing (e.g., open a modal form or redirect)
          toast({ title: "Action Needed", description: "User editing form not implemented yet." });
          console.log("Trigger Edit User:", userId);
     };


    const renderSkeleton = (count = 5) => (
        Array.from({ length: count }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton className="h-10 w-10 rounded-full bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 bg-muted rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 bg-muted rounded-full" /></TableCell>
                {/* <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell> */}
                <TableCell><Skeleton className="h-8 w-8 bg-muted rounded" /></TableCell>
            </TableRow>
        ))
    );

    const getInitials = (name?: string | null): string => {
         if (!name) return '';
         const names = name.split(' ');
         if (names.length === 1) return names[0].charAt(0).toUpperCase();
         return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

     const hasMore = users.length < totalCount;

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
                <div>
                    <CardTitle className="text-2xl">User Management</CardTitle>
                    <CardDescription>View, create, edit, and delete user accounts.</CardDescription>
                </div>
                 <Button onClick={handleCreateUser}>
                    <UserPlus className="mr-2 h-4 w-4" /> Create User
                 </Button>
            </CardHeader>
             <CardContent>
                 {/* Search Input */}
                 <div className="mb-4 max-w-sm">
                     <Input
                         type="search"
                         placeholder="Search by name or email..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="pl-8" // Add padding for potential icon
                     />
                      {/* Optional: Add search icon */}
                 </div>

                 {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Users</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Admin</TableHead>
                                {/* <TableHead>Joined</TableHead> */}
                                <TableHead className="text-right w-[50px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && users.length === 0 ? (
                                renderSkeleton()
                             ) : !loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                         No users found{debouncedSearchTerm ? ' matching your search' : ''}.
                                    </TableCell>
                                </TableRow>
                             ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Avatar className="h-9 w-9">
                                                 {/* Assuming no avatar URL from API for users */}
                                                {/* <AvatarImage src={user.avatarUrl} alt={user.full_name}/> */}
                                                <AvatarFallback className="bg-secondary text-secondary-foreground">
                                                     {user.full_name ? getInitials(user.full_name) : <UserIcon size={16}/>}
                                                 </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{user.full_name || <span className="italic text-muted-foreground">N/A</span>}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? 'default' : 'outline'}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                             {user.is_superuser ? (
                                                 <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                                                    <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Admin
                                                </Badge>
                                             ) : (
                                                 <Badge variant="outline">
                                                     <ShieldOff className="mr-1 h-3.5 w-3.5 text-muted-foreground" /> User
                                                 </Badge>
                                             )}
                                        </TableCell>
                                         {/* Joined Date - Assuming API doesn't provide this, remove for now */}
                                        {/* <TableCell className="text-xs text-muted-foreground">
                                             {user.createdAt ? format(parseISO(user.createdAt), 'PP') : 'N/A'}
                                         </TableCell> */}
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingId === user.id}>
                                                            {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                                            <span className="sr-only">User Actions</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEditUser(user.id)} className="cursor-pointer">
                                                            <Edit className="mr-2 h-4 w-4" /> Edit User
                                                        </DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                            {/* Disable delete for superusers themselves if needed */}
                                                             <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" disabled={deletingId === user.id || user.is_superuser}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                             Are you sure you want to delete the user "{user.email}"? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel disabled={deletingId === user.id}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            disabled={deletingId === user.id}
                                                            className={buttonVariants({ variant: "destructive" })}
                                                        >
                                                            {deletingId === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                                            Delete User
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
                            onClick={() => fetchUsers(true)}
                            variant="outline"
                            disabled={loadingMore}
                         >
                             {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                             Load More
                         </Button>
                    </div>
                 )}
                 {!hasMore && users.length > 0 && (
                     <p className="mt-6 text-center text-sm text-muted-foreground">
                         Showing all {totalCount} users.
                     </p>
                 )}
            </CardContent>
        </Card>
    );
}
