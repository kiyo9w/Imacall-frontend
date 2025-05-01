'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/apiClient'; // Import API client
import { CharacterPublic, CharacterCategory, CharacterStatus, PaginatedResponse } from '@/types/character'; // Use API types
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Search, Filter, ArrowUpDown, Bot, Loader2, AlertCircle } from 'lucide-react'; // Removed ArrowDown, ArrowUp
import { useDebounce } from '@/hooks/use-debounce';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios'; // For error handling

const CATEGORIES = Object.values(CharacterCategory);
const CHARS_PER_PAGE = 12;

type SortOption = 'createdAt' | 'popularityScore' | 'averageRating' | 'name'; // Add 'name' if API supports it
type SortDirection = 'desc' | 'asc';

export default function CharactersPage() {
    const [characters, setCharacters] = useState<CharacterPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CharacterCategory | 'All'>('All');
    // API might not support all sorting options, adjust defaults
    const [sortBy, setSortBy] = useState<SortOption>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(0); // Use page number for skip calculation
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search input

    const fetchCharacters = useCallback(async (loadMore = false) => {
        const pageToFetch = loadMore ? currentPage + 1 : 0;
        if (!loadMore) {
            setLoading(true);
            setCharacters([]); // Reset characters when filters/sort change
            setCurrentPage(0);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
             // Prepare query parameters for the API
             const params: Record<string, any> = {
                skip: pageToFetch * CHARS_PER_PAGE,
                limit: CHARS_PER_PAGE,
                // Add other filters/sorting params if the API supports them
                // status: 'Approved', // API endpoint likely defaults to Approved
                 // category: selectedCategory === 'All' ? undefined : selectedCategory,
                 // search: debouncedSearchTerm || undefined,
                 // sort_by: sortBy,
                 // sort_dir: sortDirection,
            };

             // Clean undefined params
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);


             // Call the API endpoint for listing approved characters
            const response = await apiClient.get<PaginatedResponse<CharacterPublic>>(
                '/characters/', // Endpoint for approved public characters
                { params }
            );

            const fetchedCharacters = response.data.data;
             const fetchedCount = response.data.count; // Assuming API returns total count

            // --- Client-side filtering/sorting if API doesn't support it ---
             let processedCharacters = fetchedCharacters;

             // Client-side category filtering (if API doesn't support it)
             if (selectedCategory !== 'All' /* && !params.category */) {
                 processedCharacters = processedCharacters.filter(char => char.category === selectedCategory);
             }

             // Client-side search (if API doesn't support it)
             if (debouncedSearchTerm /* && !params.search */) {
                processedCharacters = processedCharacters.filter(char =>
                    char.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    char.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                );
             }

             // Client-side sorting (if API doesn't support it)
             if (true /* !params.sort_by */) {
                 processedCharacters.sort((a, b) => {
                     let compareA: any = 0;
                     let compareB: any = 0;

                     switch (sortBy) {
                         case 'createdAt':
                         case 'updatedAt': // Assuming we sort by update time if createdAt isn't primary
                             compareA = a.updatedAt ? parseISO(a.updatedAt).getTime() : 0;
                             compareB = b.updatedAt ? parseISO(b.updatedAt).getTime() : 0;
                             break;
                         case 'averageRating':
                             compareA = a.averageRating ?? 0;
                             compareB = b.averageRating ?? 0;
                             break;
                         case 'popularityScore':
                             // compareA = a.popularityScore ?? 0; // Add if field exists
                             // compareB = b.popularityScore ?? 0;
                              compareA = 0; // Placeholder
                              compareB = 0;
                             break;
                         case 'name':
                              compareA = a.name.toLowerCase();
                              compareB = b.name.toLowerCase();
                              break;
                     }

                     if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
                     if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
                     return 0;
                 });
             }
             // --- End Client-side processing ---


            setCharacters(prev => loadMore ? [...prev, ...processedCharacters] : processedCharacters);
            setTotalCount(fetchedCount); // Update total count from API
            setCurrentPage(pageToFetch);
            // Determine hasMore based on total count and current items
            setHasMore((pageToFetch + 1) * CHARS_PER_PAGE < fetchedCount);

        } catch (err) {
            console.error("Error fetching characters:", err);
            setError("Failed to load characters. Please try again later.");
             if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError("Authentication error. Please log in again.");
             }
        } finally {
             setLoading(false);
             setLoadingMore(false);
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, selectedCategory, sortBy, sortDirection, debouncedSearchTerm]); // Dependencies


    // Fetch characters initially and whenever filters/sort/search change
    useEffect(() => {
        fetchCharacters(false); // Fetch first page
    }, [fetchCharacters]); // Use fetchCharacters callback


    const handleSortChange = (newSortBy: SortOption) => {
        if (sortBy === newSortBy) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(newSortBy);
            setSortDirection('desc'); // Default to descending for new field
        }
         // Reset pagination when sort changes
        setCurrentPage(0);
        setCharacters([]);
        // Fetching will be triggered by useEffect dependency change
    };

    const renderSkeleton = () => (
        Array.from({ length: CHARS_PER_PAGE }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
                <CardHeader className="p-0">
                    <Skeleton className="aspect-[3/2] w-full bg-muted" /> {/* Adjusted aspect ratio */}
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-full bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardContent>
                <CardFooter className="p-4 flex justify-between items-center">
                    <Skeleton className="h-6 w-16 bg-muted rounded-full" />
                    <Skeleton className="h-8 w-20 bg-muted" />
                </CardFooter>
            </Card>
        ))
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Discover Characters</h1>

            {/* Filters and Search */}
            <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or tag..." // Search might be client-side
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                             setSearchTerm(e.target.value);
                             // Reset pagination on search change
                            setCurrentPage(0);
                            setCharacters([]);
                            // Fetch triggered by useEffect on debouncedSearchTerm
                        }}
                        className="pl-10 w-full"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto flex-wrap"> {/* Added flex-wrap */}
                     <Select value={selectedCategory} onValueChange={(value) => {
                          setSelectedCategory(value as CharacterCategory | 'All');
                           // Reset pagination on filter change
                           setCurrentPage(0);
                           setCharacters([]);
                            // Fetch triggered by useEffect
                      }}>
                        <SelectTrigger className="w-full sm:w-[180px]"> {/* Responsive width */}
                             <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={`${sortBy}-${sortDirection}`} onValueChange={(value) => {
                        const [newSort, newDir] = value.split('-') as [SortOption, SortDirection];
                        handleSortChange(newSort); // Uses handleSortChange to manage direction toggle
                    }}>
                         <SelectTrigger className="w-full sm:w-[200px]"> {/* Responsive width */}
                             <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Adjust available sort options based on API/client capabilities */}
                            <SelectItem value="createdAt-desc">Newest First</SelectItem>
                            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                             <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                             <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            {/* <SelectItem value="popularityScore-desc">Most Popular</SelectItem> */}
                            <SelectItem value="averageRating-desc">Highest Rated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                 <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Character Grid */}
            {loading && characters.length === 0 ? ( // Show skeleton only on initial load
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {renderSkeleton()}
                 </div>
            ) : !loading && characters.length === 0 ? ( // Show no results message
                <div className="text-center py-16 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg">No characters found matching your criteria.</p>
                    <p>Try adjusting your search or filters.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char) => (
                            <Card key={char.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
                                <CardHeader className="p-0 relative">
                                    <Link href={`/character/${char.id}`} className="block aspect-[3/2] relative bg-muted">
                                        <Image
                                             data-ai-hint={`${char.category || ''} character ${char.tags?.join(' ') || ''}`}
                                             // Use image_url from API
                                            src={char.image_url || `https://picsum.photos/seed/${char.id}/300/200`}
                                            alt={char.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                            style={{ objectFit: 'cover' }}
                                            className="bg-muted"
                                        />
                                    </Link>
                                     {char.averageRating && char.averageRating > 0 && (
                                         <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 py-1 px-2">
                                             <Star className="h-3 w-3 text-yellow-500 fill-yellow-400" />
                                             <span className="text-xs font-semibold">{char.averageRating.toFixed(1)}</span>
                                         </Badge>
                                     )}
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg mb-1 truncate">{char.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{char.description || 'No description available.'}</p>
                                    {char.category && <Badge variant="outline">{char.category}</Badge>}
                                </CardContent>
                                <CardFooter className="p-4 border-t">
                                    <Button asChild size="sm" className="w-full">
                                        <Link href={`/character/${char.id}/chat`}>Chat Now</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                         {/* Skeleton placeholders while loading more */}
                         {loadingMore && renderSkeleton()}
                    </div>

                     {/* Load More Button */}
                     {hasMore && !loadingMore && (
                        <div className="mt-8 text-center">
                            <Button
                                onClick={() => fetchCharacters(true)} // Pass true to load more
                                disabled={loadingMore}
                                variant="outline"
                            >
                                Load More
                            </Button>
                        </div>
                    )}
                     {loadingMore && ( // Show loader while loading more
                        <div className="mt-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        </div>
                     )}
                     {!hasMore && characters.length > 0 && ( // Indicate end of list
                         <p className="text-center text-muted-foreground mt-8">You've reached the end!</p>
                     )}
                </>
            )}
        </div>
    );
}

// Import parseISO for date sorting
import { parseISO } from 'date-fns';
