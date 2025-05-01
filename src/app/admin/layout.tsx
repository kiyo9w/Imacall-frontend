import AdminRoute from '@/components/auth/AdminRoute';
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Bot } from 'lucide-react'; // Icons for navigation

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
         {/* Admin Sidebar/Navigation */}
         <aside className="lg:w-64 flex-shrink-0">
            <Card className="shadow-lg sticky top-24">
                <CardHeader>
                    <CardTitle className="text-xl">Admin Panel</CardTitle>
                    <CardDescription>Manage users and characters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4" /> Users
                        </Link>
                     </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/admin/characters">
                            <Bot className="mr-2 h-4 w-4" /> Characters
                        </Link>
                     </Button>
                    {/* Add more admin links here */}
                </CardContent>
            </Card>
         </aside>

         {/* Main Admin Content Area */}
         <main className="flex-1">
           {children}
         </main>
      </div>
    </AdminRoute>
  );
}
