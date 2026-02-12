'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, Search, ChevronRight, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebar } from './AdminSidebar';

interface AdminHeaderProps {
  adminEmail?: string;
  adminRole?: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AdminHeader({ adminEmail, adminRole, collapsed, setCollapsed }: AdminHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate breadcrumbs from pathname
  const breadcrumbs = pathname
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment, index, array) => {
      const href = '/' + array.slice(0, index + 1).join('/');
      const isLast = index === array.length - 1;
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { href, title, isLast };
    });

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-3 md:px-6 transition-all duration-200',
        scrolled && 'shadow-sm',
        collapsed ? 'md:pl-20' : 'md:pl-64'
      )}
    >
      {/* Mobile Sidebar Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            aria-label="Open admin navigation"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <AdminSidebar adminEmail={adminEmail} adminRole={adminRole} mobile />
        </SheetContent>
      </Sheet>

      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.title}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.title}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search (Optional placeholder) */}
      <div className="hidden md:flex relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-9 h-9 bg-muted/50 border-none focus-visible:bg-background focus-visible:ring-1"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border-2 border-background" />
      </Button>

      {/* User Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label="Open admin profile menu"
          >
            <Avatar className="h-8 w-8 border">
              <AvatarImage alt={adminEmail || 'Admin'} />
              <AvatarFallback className="bg-[#1C4D3A] text-white">
                {(adminEmail || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Admin User</p>
              <p className="text-xs leading-none text-muted-foreground">{adminEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <Link href="/app/i/home" className="w-full">
              Exit Admin
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
