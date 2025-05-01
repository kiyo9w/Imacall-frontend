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
import { Star, Search, Filter, ArrowUpDown, Bot, Loader2, AlertCircle, ListFilter } from 'lucide-react'; // Added ListFilter
import { useDebounce } from '@/hooks/use-debounce'; // Corrected import path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios'; // For error handling
import { parseISO } from 'date-fns'; // Import parseISO for date sorting

const CATEGORIES = Object.values(CharacterCategory);
const CHARS_PER_PAGE = 12;

type SortOption = 'updatedAt' | 'popularityScore' | 'averageRating' | 'name'; // API might use 'updatedAt' or similar
type SortDirection = 'desc' | 'asc';

export default function CharactersPage() {
    const [characters, setCharacters] = useState<CharacterPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CharacterCategory | 'All'>('All');
    // Default sort by latest updated
    const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchCharacters = useCallback(async (loadMore = false) => {
        const pageToFetch = loadMore ? currentPage + 1 : 0;
        if (!loadMore) {
            setLoading(true);
            setCharacters([]); // Reset characters on new filter/sort
            setCurrentPage(0);
            setHasMore(true); // Assume more might exist on filter change
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
             const params: Record<string, any> = {
                skip: pageToFetch * CHARS_PER_PAGE,
                limit: CHARS_PER_PAGE,
                // Add API-supported filters/sorting if available
                 // category: selectedCategory === 'All' ? undefined : selectedCategory,
                 // search: debouncedSearchTerm || undefined,
                 // sort_by: sortBy, // Adjust based on actual API param names
                 // sort_dir: sortDirection, // Adjust based on actual API param names
            };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await apiClient.get<PaginatedResponse<CharacterPublic>>(
                '/characters/', // Public approved characters endpoint
                { params }
            );

            const fetchedCharacters = response.data.data;
            const fetchedCount = response.data.count;

             // --- Client-side filtering/sorting (fallback if API lacks support) ---
             let processedCharacters = fetchedCharacters;

             // Client-side category filtering
             if (selectedCategory !== 'All' /* && !params.category */) {
                 processedCharacters = processedCharacters.filter(char => char.category === selectedCategory);
             }

             // Client-side search (name and tags)
             if (debouncedSearchTerm /* && !params.search */) {
                processedCharacters = processedCharacters.filter(char =>
                    char.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    char.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                );
             }

             // Client-side sorting
             if (true /* !params.sort_by */) {
                 processedCharacters.sort((a, b) => {
                     let compareA: any = 0;
                     let compareB: any = 0;

                     switch (sortBy) {
                         case 'updatedAt': // Assuming API provides updatedAt or createdAt
                             compareA = a.updatedAt ? parseISO(a.updatedAt).getTime() : (a.createdAt ? parseISO(a.createdAt).getTime() : 0);
                             compareB = b.updatedAt ? parseISO(b.updatedAt).getTime() : (b.createdAt ? parseISO(b.createdAt).getTime() : 0);
                             break;
                         case 'averageRating':
                             compareA = a.averageRating ?? 0;
                             compareB = b.averageRating ?? 0;
                             break;
                         case 'popularityScore': // Needs field from API
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
            // Update total count based on API response or filtered length if client-side filtering is heavy
            setTotalCount(fetchedCount); // Use API count ideally
            setCurrentPage(pageToFetch);
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
    }, [currentPage, selectedCategory, sortBy, sortDirection, debouncedSearchTerm]); // Dependencies


    useEffect(() => {
        fetchCharacters(false); // Initial fetch or fetch when filters change
    }, [fetchCharacters]); // Relies on the memoized callback


    const handleSortChange = (newSortBy: SortOption) => {
        if (sortBy === newSortBy) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(newSortBy);
            setSortDirection('desc'); // Default to descending for new field
        }
        // Fetching will be triggered by useEffect dependency change
    };

    const renderSkeleton = (count = CHARS_PER_PAGE) => (
        Array.from({ length: count }).map((_, index) => (
            <Card key={index} className="overflow-hidden border-transparent shadow-none animate-pulse">
                <CardHeader className="p-0">
                    <Skeleton className="aspect-[3/2] w-full bg-muted rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-full bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardContent>
                <CardFooter className="p-4 flex justify-between items-center">
                    <Skeleton className="h-6 w-16 bg-muted rounded-full" />
                    <Skeleton className="h-9 w-24 bg-muted rounded-md" />
                </CardFooter>
            </Card>
        ))
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Discover Characters</h1>

            {/* Filters and Search Bar */}
            <div className="mb-8 p-4 border rounded-lg bg-card shadow sticky top-16 z-30 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search name or tag..."
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto flex-wrap justify-center">
                     <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CharacterCategory | 'All')}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                             <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
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
                        handleSortChange(newSort);
                    }}>
                         <SelectTrigger className="w-full sm:w-[180px]">
                             <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Adjust sort options based on API/client capabilities */}
                            <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                            <SelectItem value="updatedAt-asc">Oldest</SelectItem>
                             <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                             <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                             <SelectItem value="averageRating-desc">Highest Rated</SelectItem>
                            {/* <SelectItem value="popularityScore-desc">Most Popular</SelectItem> */}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                 <Alert variant="destructive" className="mb-6 max-w-3xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Characters</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Character Grid */}
            {loading && characters.length === 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {renderSkeleton()}
                 </div>
            ) : !loading && characters.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                    <p className="text-lg font-medium">No Characters Found</p>
                    <p>Try adjusting your search or filters.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char) => (
                            <Card key={char.id} className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col group transform hover:-translate-y-1 border border-transparent hover:border-primary/20">
                                <CardHeader className="p-0 relative">
                                    <Link href={`/character/${char.id}`} className="block aspect-[3/2] relative bg-muted overflow-hidden rounded-t-lg">
                                        <Image
                                             data-ai-hint={`${char.category || ''} character ${char.tags?.join(' ') || ''}`}
                                            src={char.image_url || `https://picsum.photos/seed/${char.id}/400/267`} // Adjusted size for 3:2
                                            alt={char.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                            style={{ objectFit: 'cover' }}
                                            className="transition-transform duration-300 ease-in-out group-hover:scale-105" // Zoom effect
                                        />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </Link>
                                     {char.averageRating && char.averageRating > 0 && (
                                         <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 py-1 px-2 bg-background/80 backdrop-blur-sm">
                                             <Star className="h-3 w-3 text-yellow-500 fill-yellow-400" />
                                             <span className="text-xs font-semibold">{char.averageRating.toFixed(1)}</span>
                                         </Badge>
                                     )}
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg mb-1 truncate group-hover:text-primary transition-colors">
                                       <Link href={`/character/${char.id}`} className="hover:underline">
                                         {char.name}
                                       </Link>
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{char.description || 'No description available.'}</p>
                                    <div className="flex flex-wrap gap-1 mt-auto">
                                        {char.category && <Badge variant="outline" className="text-xs">{char.category}</Badge>}
                                         {char.tags?.slice(0, 2).map(tag => ( // Show limited tags
                                             <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                         ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 border-t bg-card">
                                    <Button asChild size="sm" className="w-full">
                                        <Link href={`/character/${char.id}/chat`}>Chat Now</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                         {/* Skeleton placeholders while loading more */}
                         {loadingMore && renderSkeleton(4)} {/* Show fewer skeletons for load more */}
                    </div>

                     {/* Load More Button / Indicator */}
                     <div className="mt-10 text-center">
                         {loadingMore ? (
                             <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                         ) : hasMore ? (
                             <Button
                                onClick={() => fetchCharacters(true)}
                                variant="outline"
                            >
                                Load More Characters
                            </Button>
                        ) : (
                           characters.length > 0 && <p className="text-muted-foreground">You've reached the end!</p>
                        )}
                     </div>
                </>
            )}
        </div>
    );
}
