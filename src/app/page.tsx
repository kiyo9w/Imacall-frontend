import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bot, Sparkles, Pencil, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { cn } from '@/lib/utils'; // Import cn

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 relative overflow-hidden isolate">
       {/* Enhanced Background - Subtle Gradient Mesh or Abstract Shape */}
        <div
           aria-hidden="true"
           className="absolute inset-0 -z-10 overflow-hidden"
         >
           <div className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 blur-3xl dark:from-primary/20 dark:via-accent/10 dark:to-secondary/20 opacity-60" />
         </div>

      <Image
         data-ai-hint="logo robot character call center communication modern sleek"
         src="https://picsum.photos/seed/imacalllogo3/180/180" // Slightly larger, different seed
         alt="Imacall Logo"
         width={180}
         height={180}
         className="rounded-full mb-8 shadow-xl border-4 border-background/80 backdrop-blur-sm animate-in fade-in zoom-in-90 duration-500" // Added animation
         priority
      />
       {/* Animated Gradient Text */}
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary via-teal-400 dark:via-teal-500 to-accent dark:to-violet-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
        Welcome to Imacall
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl md:max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        Create, discover, and interact with unique AI characters through text and voice. Explore a universe of personalities waiting to chat.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <Button asChild size="lg" className="shadow-lg hover:shadow-primary/30 transition-shadow group">
          <Link href="/characters">
            Explore Characters <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="shadow hover:shadow-md transition-shadow border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 group">
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
           icon={<Bot className="h-8 w-8 text-primary" />}
           title="Interact"
           description="Engage in dynamic conversations via text chat or immersive voice calls (coming soon)."
           delay={200} // Stagger animation
         />
         <FeatureCard
           icon={<Pencil className="h-8 w-8 text-primary" />}
           title="Create"
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
         "p-6 bg-card/80 backdrop-blur-md border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-2",
         "animate-in fade-in slide-in-from-bottom-5 duration-500" // Base animation
       )}
       style={{ animationDelay: `${delay}ms` }} // Apply stagger delay
     >
      <div className="mb-5 p-3 bg-primary/10 rounded-full">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
