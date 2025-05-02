'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bot, Sparkles, Pencil, ChevronRight, Palette, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { CharacterPublic, PaginatedResponse } from '@/types/character';
import { Card, CardContent } from '@/components/ui/card'; // Import Card for showcase
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Simplified card for home page showcase
function CharacterShowcaseCard({ character, className, style }: { character: CharacterPublic; className?: string; style?: React.CSSProperties }) {
  return (
    <Card className={cn("absolute overflow-hidden rounded-xl shadow-xl border border-border/20 bg-card/60 backdrop-blur-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl w-40 h-56 sm:w-48 sm:h-64 group", className)} style={style}>
      <Image
        data-ai-hint={`${character.category || ''} character portrait ${character.tags?.join(' ') || ''}`}
        src={character.image_url || `https://picsum.photos/seed/${character.id}/200/300`}
        alt={character.name}
        fill
        sizes="(max-width: 640px) 100px, 200px"
        style={{ objectFit: 'cover' }}
        className="transition-transform duration-500 ease-in-out group-hover:scale-110"
        priority={false} // Lower priority for decorative images
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 flex flex-col justify-end">
        <p className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">{character.name}</p>
        <p className="text-xs text-white/70 truncate">{character.description || 'AI Character'}</p>
      </div>
       {/* Subtle interaction hint */}
       <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
         <ChevronRight className="h-6 w-6 text-primary animate-pulse" />
       </div>
    </Card>
  );
}


export default function Home() {
  const [featuredCharacters, setFeaturedCharacters] = useState<CharacterPublic[]>([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingChars(true);
      setFetchError(null);
      try {
        // Fetch a few characters, e.g., most popular or featured (if API supports)
        const response = await apiClient.get<PaginatedResponse<CharacterPublic>>(
          '/characters/',
          {
            params: {
              limit: 6, // Fetch a few characters for decoration
              sort_by: 'popularity_score', // Example: sort by popularity
              sort_dir: 'desc',
            }
          }
        );
        setFeaturedCharacters(response.data.data);
      } catch (err) {
        console.error("Error fetching featured characters:", err);
        setFetchError("Could not load character showcase.");
        // Don't block the main page content if showcase fails
      } finally {
        setLoadingChars(false);
      }
    };

    fetchFeatured();
  }, []);

  const cardPositions = [
    { top: '10%', left: '5%', rotate: '-15deg', delay: 0 },
    { top: '25%', right: '8%', rotate: '10deg', delay: 100 },
    { bottom: '15%', left: '15%', rotate: '8deg', delay: 200 },
    { bottom: '5%', right: '20%', rotate: '-12deg', delay: 300 },
    { top: '40%', left: '25%', rotate: '5deg', delay: 400 },
    { top: '5%', right: '30%', rotate: '-8deg', delay: 500 },
  ];


  return (
     // Increased min-height for more space
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 relative overflow-hidden isolate min-h-[calc(100vh-8rem)]">
      {/* Animated Gradient Background - Defined in globals.css */}

       {/* Decorative Character Cards - Positioned Absolutely */}
       <div className="absolute inset-0 -z-10 opacity-50 dark:opacity-30 pointer-events-none">
         {loadingChars ? (
            // Optional: add subtle loading state for cards if desired
            <div className="absolute inset-0 flex items-center justify-center">
               {/* <Loader2 className="h-8 w-8 animate-spin text-primary/50" /> */}
            </div>
         ) : fetchError ? (
             <div className="absolute top-4 right-4 max-w-xs">
                 <Alert variant="destructive" className="bg-destructive/20 border-destructive/40 text-xs">
                     {/* <AlertCircle className="h-3 w-3" /> */}
                     {/* <AlertTitle>Showcase Error</AlertTitle> */}
                     <AlertDescription>{fetchError}</AlertDescription>
                 </Alert>
             </div>
         ) : (
          featuredCharacters.map((char, index) => (
            <CharacterShowcaseCard
              key={char.id}
              character={char}
              className="animate-float" // Apply floating animation
               style={{
                 top: cardPositions[index]?.top,
                 left: cardPositions[index]?.left,
                 right: cardPositions[index]?.right,
                 bottom: cardPositions[index]?.bottom,
                 transform: `rotate(${cardPositions[index]?.rotate || '0deg'})`,
                 animationDelay: `${cardPositions[index]?.delay || 0}ms`,
                 animationDuration: `${6 + Math.random() * 4}s`, // Randomize duration slightly
               }}
            />
          ))
        )}
      </div>

      {/* Main Content - Increased z-index */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Gradient Text Title */}
        <h1 className={cn(
          "text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-transparent bg-clip-text",
          "bg-gradient-to-r from-primary via-teal-400 dark:via-teal-500 to-accent dark:to-violet-500",
          "animate-gradient bg-[length:200%_auto]"
        )}>
          Welcome to Imacall
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl md:max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 text-shadow-lg">
           Dive into a universe crafted by AI. Create, discover, and interact with unique characters through immersive text and voice conversations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/40 transition-shadow duration-300 group transform hover:scale-105 active:scale-100">
            <Link href="/characters">
              Explore Characters <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow hover:shadow-md transition-shadow border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 group transform hover:scale-105 active:scale-100 backdrop-blur-sm bg-background/30">
             <Link href="/account/characters/new">
                <Pencil className="mr-2 h-5 w-5 transition-transform group-hover:rotate-[-10deg]" /> Create Your Own
             </Link>
          </Button>
        </div>
      </div>

      {/* Feature Cards Section - Keep as is or enhance further */}
      <div className="relative z-10 mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
        <FeatureCard
          icon={<Sparkles className="h-8 w-8 text-primary" />}
          title="Discover"
          description="Browse a growing library of public AI characters with diverse personalities and backstories."
          delay={100}
        />
        <FeatureCard
          icon={<Bot className="h-8 w-8 text-accent" />}
          title="Interact"
          description="Engage in dynamic conversations via text chat or immersive voice calls (coming soon)."
          delay={200}
        />
        <FeatureCard
          icon={<Palette className="h-8 w-8 text-teal-500" />} // Use a different color/icon if needed
          title="Create & Customize"
          description="Bring your own characters to life with our intuitive creation tools and share them."
          delay={300}
        />
      </div>

      {/* Add keyframes for gradient and float animation - Can be moved to globals.css */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
        @keyframes float {
           0%, 100% { transform: translateY(0) rotate(var(--initial-rotate, 0deg)); }
           50% { transform: translateY(-10px) rotate(calc(var(--initial-rotate, 0deg) + 2deg)); } /* Subtle lift and tilt */
         }
         .animate-float {
           animation: float 6s ease-in-out infinite;
           /* Store initial rotation in a CSS variable if needed */
           /* --initial-rotate: defined inline via style prop */
         }
      `}</style>
    </div>
  );
}

// Enhanced Feature Card component
function FeatureCard({ icon, title, description, delay = 0 }: { icon: React.ReactNode; title: string; description: string; delay?: number }) {
  return (
    <div
      className={cn(
        "p-6 bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-2 hover:border-primary/40", // More rounded, more blur
        "animate-in fade-in slide-in-from-bottom-5 duration-500"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-5 p-4 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-full ring-1 ring-inset ring-border/30 shadow-inner">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-foreground text-shadow-md">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
