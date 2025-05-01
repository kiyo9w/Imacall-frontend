import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Bot, Sparkles, Pencil } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 relative overflow-hidden">
       {/* Optional: Subtle background gradient or pattern */}
       {/* <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div> */}

      <Image
         data-ai-hint="logo robot character call center communication"
         src="https://picsum.photos/seed/imacalllogo2/160/160" // Slightly larger image
         alt="Imacall Logo"
         width={160}
         height={160}
         className="rounded-full mb-8 shadow-lg border-4 border-background" // Added border
         priority // Prioritize loading logo
      />
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary via-teal-500 to-accent text-transparent bg-clip-text">
        Welcome to Imacall
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl md:max-w-2xl px-4">
        Create, discover, and interact with unique AI characters through text and voice. Explore a universe of personalities waiting to chat.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/characters">
            <Sparkles className="mr-2 h-5 w-5" /> Explore Characters
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow border-primary/50 text-primary hover:bg-primary/5">
          <Link href="/account/characters/new">
            <Pencil className="mr-2 h-5 w-5" /> Create Your Own
          </Link>
        </Button>
      </div>
       <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full px-4">
         <FeatureCard
           icon={<Sparkles className="h-8 w-8 text-primary" />}
           title="Discover"
           description="Browse a growing library of public AI characters with diverse personalities and backstories."
         />
         <FeatureCard
           icon={<Bot className="h-8 w-8 text-primary" />}
           title="Interact"
           description="Engage in dynamic conversations via text chat or immersive voice calls (coming soon)."
         />
         <FeatureCard
           icon={<Pencil className="h-8 w-8 text-primary" />}
           title="Create"
           description="Bring your own characters to life with our intuitive creation tools and share them."
         />
       </div>
    </div>
  );
}

// Simple Feature Card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
