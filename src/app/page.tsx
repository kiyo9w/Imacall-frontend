import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <Image
         data-ai-hint="logo robot character"
         src="https://picsum.photos/seed/echologo/150/150"
         alt="EchoVerse Logo"
         width={150}
         height={150}
         className="rounded-full mb-6 shadow-md"
      />
      <h1 className="text-4xl font-bold mb-4 text-primary">Welcome to EchoVerse</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl">
        Create, discover, and interact with unique AI characters through text and voice. Explore a universe of personalities waiting to chat.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/characters">Explore Characters</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/account/characters/new">Create Your Own</Link>
        </Button>
      </div>
       <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
         <div className="p-6 border rounded-lg shadow-sm">
           <h3 className="text-xl font-semibold mb-2 text-primary">Discover</h3>
           <p className="text-muted-foreground">Browse a growing library of public AI characters with diverse personalities and backstories.</p>
         </div>
         <div className="p-6 border rounded-lg shadow-sm">
           <h3 className="text-xl font-semibold mb-2 text-primary">Interact</h3>
           <p className="text-muted-foreground">Engage in dynamic conversations via text chat or immersive voice calls.</p>
         </div>
         <div className="p-6 border rounded-lg shadow-sm">
           <h3 className="text-xl font-semibold mb-2 text-primary">Create</h3>
           <p className="text-muted-foreground">Bring your own characters to life with our intuitive creation tools.</p>
         </div>
       </div>
    </div>
  );
}
