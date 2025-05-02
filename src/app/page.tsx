'use client'; // Add this directive

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bot, Sparkles, Pencil, ChevronRight, Palette } from 'lucide-react'; // Added Palette icon
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 relative overflow-hidden isolate min-h-[calc(100vh-12rem)]"> {/* Ensure min height */}
      {/* Enhanced Background - Subtle Gradient Mesh */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden opacity-70 dark:opacity-50"
      >
        <svg
          className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200 dark:stroke-gray-700 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="e813992c-7d03-4cc4-a2bd-151760b470a0"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-50 dark:fill-gray-900/30">
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)" />
        </svg>
        {/* Main gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-accent/5 to-background opacity-50 dark:from-primary/10 dark:via-accent/10 dark:to-background" />
      </div>


      {/* Animated Gradient Text Title */}
      <h1 className={cn(
        "text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-transparent bg-clip-text",
        "bg-gradient-to-r from-primary via-teal-400 dark:via-teal-500 to-accent dark:to-violet-500",
        "animate-gradient bg-[length:200%_auto]"
      )}>
        Welcome to Imacall
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl md:max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 text-shadow">
        Create, discover, and interact with unique AI characters through text and voice. Explore a universe of personalities waiting to chat.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <Button asChild size="lg" className="shadow-lg hover:shadow-primary/30 transition-shadow duration-300 group transform hover:scale-105 active:scale-100">
          <Link href="/characters">
            Explore Characters <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="shadow hover:shadow-md transition-shadow border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 group transform hover:scale-105 active:scale-100">
          <Link href="/account/characters/new">
            <Pencil className="mr-2 h-5 w-5 transition-transform group-hover:rotate-[-10deg]" /> Create Your Own
          </Link>
        </Button>
      </div>
      {/* Feature Cards Section with animation */}
      <div className="mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
        <FeatureCard
          icon={<Sparkles className="h-8 w-8 text-primary" />}
          title="Discover"
          description="Browse a growing library of public AI characters with diverse personalities and backstories."
          delay={100} // Stagger animation
        />
        <FeatureCard
          icon={<Bot className="h-8 w-8 text-accent" />}
          title="Interact"
          description="Engage in dynamic conversations via text chat or immersive voice calls (coming soon)."
          delay={200} // Stagger animation
        />
        <FeatureCard
          icon={<Palette className="h-8 w-8 text-secondary-foreground" />} // Changed icon
          title="Create & Customize"
          description="Bring your own characters to life with our intuitive creation tools and share them."
          delay={300} // Stagger animation
        />
      </div>

      {/* Add keyframes for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </div>
  );
}

// Enhanced Feature Card component with animation
function FeatureCard({ icon, title, description, delay = 0 }: { icon: React.ReactNode; title: string; description: string; delay?: number }) {
  return (
    <div
      className={cn(
        "p-6 bg-card/70 dark:bg-card/50 backdrop-blur-lg border border-border/40 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-2 hover:border-primary/30",
        "animate-in fade-in slide-in-from-bottom-5 duration-500" // Base animation
      )}
      style={{ animationDelay: `${delay}ms` }} // Apply stagger delay
    >
      <div className="mb-5 p-3 bg-primary/10 dark:bg-primary/20 rounded-full">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-foreground text-shadow">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
