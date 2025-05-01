'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Character, CharacterCategory, CharacterStatus } from '@/types/character';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Search, Filter, ArrowUpDown, ArrowDown, ArrowUp, Bot, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce'; // Simple debounce hook
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { AlertCircle } from 'lucide-react'; // Import AlertCircle icon


const CATEGORIES: CharacterCategory[] = ['Fantasy', 'Sci-Fi', 'Historical', 'Anime', 'Celebrity', 'Game Character', 'Assistant', 'Custom'];
const CHARS_PER_PAGE = 12;

export default function CharactersPage() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CharacterCategory | 'All'>('All');
    const [sortBy, setSortBy] = useState<'createdAt' | 'popularityScore' | 'averageRating'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search input

    const fetchCharacters = async (loadMore = false) => {
        if (!loadMore) {
            setLoading(true);
            setCharacters([]); // Reset characters when filters/sort change
            setLastVisible(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            let characterQuery = query(
                collection(db, 'characters'),
                where('status', '==', 'Approved' as CharacterStatus),
                where('isPublic', '==', true)
            );

            // Apply category filter
            if (selectedCategory !== 'All') {
                characterQuery = query(characterQuery, where('category', '==', selectedCategory));
            }

            // Apply sorting
            characterQuery = query(characterQuery, orderBy(sortBy, sortDirection), limit(CHARS_PER_PAGE));

            // Pagination for loading more
            if (loadMore && lastVisible) {
                characterQuery = query(characterQuery, startAfter(lastVisible));
            }

            const querySnapshot = await getDocs(characterQuery);
            const fetchedCharacters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));

            // Search term filtering (client-side after fetch - consider server-side for large datasets)
             const filteredCharacters = debouncedSearchTerm
               ? fetchedCharacters.filter(char =>
                   char.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                   char.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                 )
               : fetchedCharacters;


            setCharacters(prev => loadMore ? [...prev, ...filteredCharacters] : filteredCharacters);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length === CHARS_PER_PAGE);

        } catch (err) {
            console.error("Error fetching characters:", err);
            setError("Failed to load characters. Please try again later.");
        } finally {
             setLoading(false);
             setLoadingMore(false);
        }
    };

    // Fetch characters initially and whenever filters/sort/search change
    useEffect(() => {
        fetchCharacters();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, sortBy, sortDirection, debouncedSearchTerm]); // Dependency includes debounced term


    const handleSortChange = (newSortBy: typeof sortBy) => {
        if (sortBy === newSortBy) {
            // Toggle direction if same field is clicked
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            // Default to descending for new field
            setSortBy(newSortBy);
            setSortDirection('desc');
        }
    };

    const renderSkeleton = () => (
        Array.from({ length: CHARS_PER_PAGE }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
                <CardHeader className="p-0">
                    <Skeleton className="h-40 w-full bg-muted" />
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
                        placeholder="Search by name or tag..."
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                     <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CharacterCategory | 'All')}>
                        <SelectTrigger className="w-full md:w-[180px]">
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

                    {/* Sorting Dropdown/Button */}
                    <Select value={`${sortBy}-${sortDirection}`} onValueChange={(value) => {
                        const [newSort, newDir] = value.split('-') as [typeof sortBy, typeof sortDirection];
                        setSortBy(newSort);
                        setSortDirection(newDir);
                    }}>
                         <SelectTrigger className="w-full md:w-[200px]">
                             <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt-desc">Newest First</SelectItem>
                            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                            <SelectItem value="popularityScore-desc">Most Popular</SelectItem>
                            {/* <SelectItem value="popularityScore-asc">Least Popular</SelectItem> */}
                            <SelectItem value="averageRating-desc">Highest Rated</SelectItem>
                            {/* <SelectItem value="averageRating-asc">Lowest Rated</SelectItem> */}
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
            {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {renderSkeleton()}
                 </div>
            ) : characters.length === 0 ? (
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
                                    <Link href={`/character/${char.id}`} className="block aspect-[3/2] relative">
                                        <Image
                                             data-ai-hint={`${char.category} character ${char.tags?.join(' ')}`}
                                            src={char.imageUrl || `https://picsum.photos/seed/${char.id}/300/200`}
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
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{char.description}</p>
                                    <Badge variant="outline">{char.category}</Badge>
                                </CardContent>
                                <CardFooter className="p-4 border-t">
                                    <Button asChild size="sm" className="w-full">
                                        <Link href={`/character/${char.id}/chat`}>Chat Now</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                     {/* Load More Button */}
                     {hasMore && (
                        <div className="mt-8 text-center">
                            <Button
                                onClick={() => fetchCharacters(true)}
                                disabled={loadingMore}
                                variant="outline"
                            >
                                {loadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : 'Load More'}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
