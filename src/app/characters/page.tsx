'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { CharacterPublic, CharacterCategory, PaginatedResponse } from '@/types/character';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Search, ArrowUpDown, Bot, Loader2, AlertCircle, ListFilter, Users } from 'lucide-react'; // Added Users icon
import { useDebounce } from '@/hooks/use-debounce';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios';
import { parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components


const CATEGORIES = Object.values(CharacterCategory);
const CHARS_PER_PAGE = 12;

// Updated sort options based on schema
type SortOption = 'updatedAt' | 'popularity_score' | 'averageRating' | 'name';
type SortDirection = 'desc' | 'asc';

export default function CharactersPage() {
    const [characters, setCharacters] = useState<CharacterPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CharacterCategory | 'All'>('All');
    const [sortBy, setSortBy] = useState<SortOption>('popularity_score'); // Default sort by popularity
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchCharacters = useCallback(async (loadMore = false) => {
        const pageToFetch = loadMore ? currentPage + 1 : 0;
        if (!loadMore) {
            setLoading(true);
            setCharacters([]);
            setCurrentPage(0);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
             const params: Record<string, any> = {
                skip: pageToFetch * CHARS_PER_PAGE,
                limit: CHARS_PER_PAGE,
                category: selectedCategory === 'All' ? undefined : selectedCategory,
                search: debouncedSearchTerm || undefined,
                sort_by: sortBy,
                sort_dir: sortDirection,
            };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await apiClient.get<PaginatedResponse<CharacterPublic>>(
                '/characters/', // Public approved characters endpoint
                { params }
            );

            const fetchedCharacters = response.data.data;
            const fetchedCount = response.data.count;

            // No client-side filtering/sorting needed if API handles it
            const processedCharacters = fetchedCharacters;

            setCharacters(prev => loadMore ? [...prev, ...processedCharacters] : processedCharacters);
            setTotalCount(fetchedCount);
            setCurrentPage(pageToFetch);
            const currentTotalDisplayed = loadMore ? characters.length + processedCharacters.length : processedCharacters.length;
            setHasMore(currentTotalDisplayed < fetchedCount);

        } catch (err) {
            console.error("Error fetching characters:", err);
            let errorMsg = "Failed to load characters. Please try again later.";
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                errorMsg = "Authentication error. Please log in again.";
            }
            setError(errorMsg);
        } finally {
             setLoading(false);
             setLoadingMore(false);
        }
    }, [currentPage, selectedCategory, sortBy, sortDirection, debouncedSearchTerm, characters.length]);


    useEffect(() => {
        fetchCharacters(false);
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, sortBy, sortDirection, debouncedSearchTerm]);


    const handleSortChange = (newSortBy: SortOption) => {
        if (sortBy === newSortBy) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(newSortBy);
            setSortDirection('desc'); // Default desc for new field
        }
    };

     const renderSkeleton = (count = CHARS_PER_PAGE) => (
        Array.from({ length: count }).map((_, index) => (
            <Card key={index} className="overflow-hidden border-border/40 shadow-sm animate-pulse flex flex-col bg-card/80 rounded-xl">
                <CardHeader className="p-0">
                    <Skeleton className="aspect-[3/2] w-full bg-muted rounded-t-xl" />
                </CardHeader>
                <CardContent className="p-4 space-y-2 flex-grow">
                    <Skeleton className="h-5 w-3/4 bg-muted rounded" />
                    <Skeleton className="h-4 w-full bg-muted rounded" />
                    <Skeleton className="h-4 w-1/2 bg-muted rounded" />
                     <div className="flex gap-1 pt-2">
                         <Skeleton className="h-5 w-16 bg-muted rounded-full" />
                         <Skeleton className="h-5 w-20 bg-muted rounded-full" />
                     </div>
                </CardContent>
                <CardFooter className="p-4 border-t border-border/40 bg-muted/30">
                    <Skeleton className="h-9 w-full bg-muted rounded-lg" />
                </CardFooter>
            </Card>
        ))
    );


    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center bg-gradient-to-r from-primary via-teal-400 dark:via-teal-300 to-accent dark:to-violet-400 bg-clip-text text-transparent animate-in fade-in-0 slide-in-from-top-4 duration-700">
                Explore AI Characters
            </h1>

            {/* Filters Bar */}
            <div className="mb-10 p-4 border border-border/40 rounded-xl bg-card/90 backdrop-blur-lg shadow-lg sticky top-[72px] z-30 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search name or tag..."
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full rounded-lg bg-background/80 focus:bg-background"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto flex-wrap justify-center">
                     <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CharacterCategory | 'All')}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-lg">
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
                         setSortBy(newSort);
                         setSortDirection(newDir);
                     }}>
                         <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                             <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="popularity_score-desc">Most Popular</SelectItem>
                            <SelectItem value="updatedAt-desc">Most Recent</SelectItem>
                            <SelectItem value="averageRating-desc">Highest Rated</SelectItem>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            <SelectItem value="updatedAt-asc">Oldest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                 <Alert variant="destructive" className="mb-8 max-w-3xl mx-auto shadow-lg border-destructive/40 bg-destructive/10">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Oops! Something went wrong.</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                     <Button onClick={() => fetchCharacters(false)} variant="secondary" size="sm" className="mt-4">Retry</Button>
                </Alert>
            )}

            {/* Character Grid */}
            <TooltipProvider>
                 {loading && characters.length === 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {renderSkeleton()}
                     </div>
                 ) : !loading && characters.length === 0 ? (
                     <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                        <Bot className="h-16 w-16 text-primary/30" />
                        <p className="text-xl font-semibold">No Characters Found</p>
                        <p>Try adjusting your search or filter criteria.</p>
                         <Button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} variant="outline">Clear Filters</Button>
                    </div>
                 ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {characters.map((char) => (
                                <Card key={char.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col group transform hover:-translate-y-1 border border-border/40 hover:border-primary/30 rounded-xl bg-card">
                                    <CardHeader className="p-0 relative">
                                        <Link href={`/character/${char.id}`} className="block aspect-[3/2] relative bg-gradient-to-br from-muted via-secondary to-muted overflow-hidden rounded-t-xl group">
                                            <Image
                                                 data-ai-hint={`${char.category || ''} character ${char.tags?.join(' ') || ''}`}
                                                src={char.image_url || `https://picsum.photos/seed/${char.id}/400/267`}
                                                alt={char.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                                style={{ objectFit: 'cover' }}
                                                className="transition-transform duration-500 ease-in-out group-hover:scale-105"
                                            />
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                                 <h3 className="text-lg font-semibold text-white line-clamp-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">{char.name}</h3>
                                             </div>
                                        </Link>
                                        {/* Rating & Popularity Badges */}
                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                                            {(char.averageRating !== undefined && char.averageRating !== null && char.averageRating > 0) && (
                                                 <Tooltip>
                                                    <TooltipTrigger asChild>
                                                         <Badge variant="secondary" className="flex items-center gap-1 py-1 px-2.5 bg-background/80 backdrop-blur-sm rounded-full shadow">
                                                             <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
                                                             <span className="text-xs font-semibold">{char.averageRating.toFixed(1)}</span>
                                                         </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Average Rating</p>
                                                    </TooltipContent>
                                                 </Tooltip>
                                             )}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="secondary" className="flex items-center gap-1 py-1 px-2.5 bg-background/80 backdrop-blur-sm rounded-full shadow">
                                                        <Users className="h-3.5 w-3.5 text-primary/80" />
                                                        <span className="text-xs font-semibold">{char.popularity_score}</span>
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Popularity Score</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow flex flex-col">
                                        <CardTitle className="text-lg mb-1.5 group-hover:text-primary transition-colors duration-200">
                                           <Link href={`/character/${char.id}`} className="hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm focus:ring-offset-2 line-clamp-1">
                                             {char.name}
                                           </Link>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-3">{char.description || 'No description available.'}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-border/20">
                                            {char.category && <Badge variant="outline" className="text-xs font-normal border-dashed">{char.category}</Badge>}
                                             {char.tags?.slice(0, 2).map(tag => (
                                                 <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                                             ))}
                                              {/* Indicate if more tags exist */}
                                              {char.tags && char.tags.length > 2 && <Badge variant="ghost" className="text-xs font-normal text-muted-foreground p-0 h-auto">...</Badge>}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-3 border-t bg-muted/20">
                                         <Button asChild size="sm" className="w-full rounded-lg group/btn">
                                            <Link href={`/character/${char.id}/chat`}>
                                                 Chat <Bot className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1"/>
                                             </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                             {loadingMore && renderSkeleton(4)}
                        </div>

                         {/* Load More Button / Indicator */}
                         <div className="mt-12 text-center">
                             {loadingMore ? (
                                 <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                             ) : hasMore ? (
                                 <Button
                                    onClick={() => fetchCharacters(true)}
                                    variant="outline"
                                    className="shadow hover:shadow-md"
                                >
                                    Load More Characters
                                </Button>
                            ) : (
                               characters.length > 0 && <p className="text-muted-foreground italic">You've reached the end!</p>
                            )}
                         </div>
                    </>
                )}
            </TooltipProvider>
        </div>
    );
}