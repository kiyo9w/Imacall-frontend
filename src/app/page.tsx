'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bot, Sparkles, Pencil, ChevronRight, Palette, Loader2, AlertCircle, Brain, MessageSquare, Wand2, Shapes, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { CharacterPublic, PaginatedResponse } from '@/types/character';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Showcase card component with enhanced animations
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
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 flex flex-col justify-end">
        <p className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">{character.name}</p>
        <p className="text-xs text-white/70 truncate">{character.description || 'AI Character'}</p>
      </div>
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <ChevronRight className="h-6 w-6 text-primary animate-pulse" />
      </div>
    </Card>
  );
}

// Grid Bolt Component - Deterministic Movement
const GRID_SIZE = 40;
const UPDATE_INTERVAL = 100; // Adjusted for slightly faster deterministic movement
const IMAGE_SIZE = 32;

function GridBolt() {
  const [position, setPosition] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
  const [cursor, setCursor] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
  const lastUpdateTime = useRef(Date.now());
  const animationFrameId = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Initialization & Mouse Tracking
  useEffect(() => {
    const initialX = Math.floor((window.innerWidth / 2 - IMAGE_SIZE / 2) / GRID_SIZE) * GRID_SIZE + (GRID_SIZE - IMAGE_SIZE) / 2;
    const initialY = Math.floor((window.innerHeight / 2 - IMAGE_SIZE / 2) / GRID_SIZE) * GRID_SIZE + (GRID_SIZE - IMAGE_SIZE) / 2;
    setPosition({ x: initialX, y: initialY });
    setCursor({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setIsInitialized(true);
    const timer = setTimeout(() => setIsVisible(true), 100);
    const handleMouseMove = (event: MouseEvent) => {
      const newCursorPos = { x: event.clientX, y: event.clientY };
      // Log captured cursor position
      // console.log("Mouse Move Event - Cursor:", newCursorPos);
      setCursor(newCursorPos);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timer);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    // Ensure loop continues
    animationFrameId.current = requestAnimationFrame(animate);

    if (!isInitialized || position.x === null || position.y === null || cursor.x === null || cursor.y === null) {
        // console.log("Animate: Waiting for initialization or state...");
        return; // Wait for initialization
    }

    const now = Date.now();
    if (now - lastUpdateTime.current >= UPDATE_INTERVAL) {
      // Log state values at the start of the calculation
      // console.log(`Animate Tick @ ${now}: Cursor=(${cursor.x}, ${cursor.y}), CurrentPos=(${position.x}, ${position.y})`);

      setPosition(prevPos => {
        // Defend against null prevPos just in case
        if (prevPos.x === null || prevPos.y === null) {
          console.warn("Animate: prevPos is null inside setPosition");
          return prevPos;
        }

        const targetX = cursor.x as number;
        const targetY = cursor.y as number;

        let currentGridX = Math.floor((prevPos.x + IMAGE_SIZE / 2) / GRID_SIZE) * GRID_SIZE;
        let currentGridY = Math.floor((prevPos.y + IMAGE_SIZE / 2) / GRID_SIZE) * GRID_SIZE;

        const possibleMoves: { dx: number, dy: number, dist: number, name: string }[] = [];
        const moves = [
            { dx: GRID_SIZE, dy: 0, name: 'Right' }, { dx: -GRID_SIZE, dy: 0, name: 'Left' },
            { dx: 0, dy: GRID_SIZE, name: 'Down' }, { dx: 0, dy: -GRID_SIZE, name: 'Up' }
        ];

        moves.forEach(move => {
            const potentialGridX = currentGridX + move.dx;
            const potentialGridY = currentGridY + move.dy;
            const potentialCenterX = potentialGridX + GRID_SIZE / 2;
            const potentialCenterY = potentialGridY + GRID_SIZE / 2;

            if (potentialGridX >= 0 && potentialGridX <= window.innerWidth - GRID_SIZE && potentialGridY >= 0 && potentialGridY <= window.innerHeight - GRID_SIZE) {
                const newDx = targetX - potentialCenterX;
                const newDy = targetY - potentialCenterY;
                possibleMoves.push({ ...move, dist: Math.sqrt(newDx * newDx + newDy * newDy) });
             }
        });

        let nextGridX = currentGridX;
        let nextGridY = currentGridY;
        let chosenMoveInfo = "None";

        if (possibleMoves.length > 0) {
            possibleMoves.sort((a, b) => a.dist - b.dist);
            const bestMove = possibleMoves[0];
            const chosenMove = bestMove; // Deterministic move

            nextGridX = currentGridX + chosenMove.dx;
            nextGridY = currentGridY + chosenMove.dy;
            chosenMoveInfo = `${chosenMove.name} (dist: ${chosenMove.dist.toFixed(2)})`;
        }

        let nextX = nextGridX + (GRID_SIZE - IMAGE_SIZE) / 2;
        let nextY = nextGridY + (GRID_SIZE - IMAGE_SIZE) / 2;

        nextX = Math.max(0, Math.min(window.innerWidth - IMAGE_SIZE, nextX));
        nextY = Math.max(0, Math.min(window.innerHeight - IMAGE_SIZE, nextY));

        // Log calculation results before returning new state
        // console.log(` -> Prev=(${prevPos.x}, ${prevPos.y}), Target=(${targetX}, ${targetY}), PossibleMoves:`, possibleMoves.map(m=>`${m.name}(${m.dist.toFixed(1)})`).join(', '));
        // console.log(` -> Chosen: ${chosenMoveInfo}, NextGrid=(${nextGridX}, ${nextGridY}), NextPos=(${nextX.toFixed(1)}, ${nextY.toFixed(1)})`);

        // Only return new state if position actually changes to prevent potential loops
        if (nextX !== prevPos.x || nextY !== prevPos.y) {
             return { x: nextX, y: nextY };
        } else {
            // console.log(" -> Position unchanged.");
            return prevPos; // No change needed
        }
      });
      lastUpdateTime.current = now;
    }

    // Moved requestAnimationFrame call to the top of the function
  }, [isInitialized, cursor.x, cursor.y]); // Keep dependencies minimal and correct

  // Start/Stop Animation Loop
  useEffect(() => {
    if (isInitialized) {
        console.log("GridBolt: Initialized, starting animation loop.");
        animationFrameId.current = requestAnimationFrame(animate);
    } else {
        console.log("GridBolt: Not initialized yet.");
    }

    // Cleanup function remains the same in the initialization useEffect
  }, [animate, isInitialized]);

  if (!isVisible || position.x === null || position.y === null) {
    // console.log("GridBolt: Not visible or position is null.");
    return null;
  }

  // console.log(`GridBolt: Rendering at (${position.x}, ${position.y})`);
  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none z-0">
      {/* Pikachu Image Bolt */}
      <Image
        src="/resources/pikachu.png" // Assuming image is in public/resources/
        alt="Following Bolt"
        width={IMAGE_SIZE}
        height={IMAGE_SIZE}
        unoptimized // Optional: Prevent Next.js image optimization if causing issues
        style={{
          position: 'absolute',
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: 1, // Image above highlight
          // transition: '...', // No transition for pure JS movement
        }}
      />
      {/* Highlight Element */}
      <div
        className="grid-bolt-highlight"
         style={{
          position: 'absolute',
          // Position highlight based on the center of the *image* position
          top: `${position.y + IMAGE_SIZE / 2}px`,
          left: `${position.x + IMAGE_SIZE / 2}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 0, // Highlight behind image
        }}
      />
    </div>
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
        const response = await apiClient.get<PaginatedResponse<CharacterPublic>>(
          '/characters/',
          {
            params: {
              limit: 6,
              sort_by: 'popularity_score',
              sort_dir: 'desc',
            }
          }
        );
        setFeaturedCharacters(response.data.data);
      } catch (err) {
        console.error("Error fetching featured characters:", err);
        setFetchError("Could not load character showcase.");
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
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 relative overflow-hidden isolate min-h-[calc(100vh-8rem)] w-full">
      {/* Background Elements Container (Lower z-index) */}
      <div className="absolute inset-0 -z-20"> {/* Lowered z-index further */}
        {/* Grid Pattern */}
        <div className="grid-background"></div>
      </div>

      {/* Interactive Grid Bolt Component (Higher z-index than grid, lower than cards/content) */}
      <GridBolt />

      {/* Animated Lines - Zap Effect (Same level as bolt or slightly behind) */}
      <div className="absolute inset-0 overflow-hidden opacity-20 -z-10"> {/* Adjusted z-index */}
        <div className="absolute inset-0 rotate-45">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent"
              style={{
                top: `${i * 25}%`,
                animationDelay: `${i * 0.2}s`,
                animation: 'moveLines 8s linear infinite'
              }}
            />
          ))}
        </div>
      </div>

      {/* Decorative Character Cards (Kept at -z-10 relative to main content) */}
      <div className="absolute inset-0 -z-10 opacity-50 dark:opacity-30 pointer-events-none">
        {loadingChars ? (
          <div className="absolute inset-0 flex items-center justify-center">
          </div>
        ) : fetchError ? (
            <div className="absolute top-4 right-4 max-w-xs">
                <Alert variant="destructive" className="bg-destructive/20 border-destructive/40 text-xs">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            </div>
        ) : (
          featuredCharacters.map((char, index) => (
            <CharacterShowcaseCard
              key={char.id}
              character={char}
              className="animate-float"
               style={{
                 top: cardPositions[index]?.top,
                 left: cardPositions[index]?.left,
                 right: cardPositions[index]?.right,
                 bottom: cardPositions[index]?.bottom,
                 transform: `rotate(${cardPositions[index]?.rotate || '0deg'})`,
                 animationDelay: `${cardPositions[index]?.delay || 0}ms`,
                 animationDuration: `${6 + Math.random() * 4}s`,
                 '--initial-rotate': cardPositions[index]?.rotate,
               } as React.CSSProperties}
            />
          ))
        )}
      </div>

      {/* Main Content (Highest z-index) */}
      <div className="relative z-10 flex flex-col items-center max-w-screen-2xl px-4 md:px-8">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 text-primary-foreground/90 text-sm animate-in fade-in slide-in-from-bottom-4 shadow-lg mb-6">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-primary ">Experience the Next Generation of AI Characters</span>
        </div>
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

      {/* Feature Cards Section */}
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

      {/* Add keyframes for animations */}
      <style jsx>{`
        /* Grid background */
        .grid-background {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(59, 130, 246, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.07) 1px, transparent 1px);
          background-size: ${GRID_SIZE}px ${GRID_SIZE}px;
        }

        .grid-bolt-highlight {
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 65%);
          border-radius: 50%;
          z-index: 0;
        }

        /* Line animation */
        @keyframes moveLines {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Gradient animation */
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient {
          animation: gradient 6s ease infinite;
        }

        /* Floating animation */
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--initial-rotate, 0deg)); }
          50% { transform: translateY(-10px) rotate(calc(var(--initial-rotate, 0deg) + 2deg)); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
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
        "p-6 bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-2 hover:border-primary/40",
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