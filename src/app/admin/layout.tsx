'use client';

import AdminRoute from '@/components/auth/AdminRoute';
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Bot, Cpu } from 'lucide-react'; // Added Cpu icon
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/characters', label: 'Characters', icon: Bot },
        { href: '/admin/config', label: 'AI Config', icon: Cpu }, // Added Config link
    ];

    return (
        <AdminRoute>
            <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
                {/* Admin Sidebar/Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <Card className="shadow-lg sticky top-24 border border-border/40 rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/40 pb-4">
                            <CardTitle className="text-xl">Admin Panel</CardTitle>
                            <CardDescription>Manage application settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                             {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Button
                                        key={item.href}
                                        variant={isActive ? 'secondary' : 'ghost'}
                                        className={cn(
                                            "w-full justify-start text-sm",
                                            isActive && "font-semibold"
                                        )}
                                        asChild
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="mr-2 h-4 w-4" /> {item.label}
                                        </Link>
                                    </Button>
                                );
                            })}
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

    