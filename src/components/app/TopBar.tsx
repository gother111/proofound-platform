'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/actions/auth';
import { CustomizeModal } from '@/components/dashboard/CustomizeModal';

interface TopBarProps {
  userName?: string;
  userInitials?: string;
}

export function TopBar({ userName = 'User', userInitials = 'U' }: TopBarProps) {
  const [customizeOpen, setCustomizeOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 h-14 px-4 border-b flex items-center justify-between gap-4"
        style={{
          backgroundColor: '#FDFCFA',
          borderColor: 'rgba(232, 230, 221, 0.6)',
        }}
      >
        {/* Left: Logo + Proofound + Separator + Title */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(to bottom right, #1C4D3A, #5C8B89)' }}
            >
              <span className="text-white text-xs font-semibold">P</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: '#2D3330' }}>
              Proofound
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <h2 className="text-base" style={{ color: '#2D3330' }}>
            Dashboard
          </h2>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xs">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border w-full"
            style={{
              backgroundColor: 'white',
              borderColor: 'rgba(232, 230, 221, 0.6)',
            }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: '#6B6760' }} />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: '#2D3330' }}
            />
          </div>
        </div>

        {/* Right: Customize + Avatar */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizeOpen(true)}
            className="text-xs h-8 focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2"
            style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
          >
            Customize
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open profile menu"
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback
                    className="text-xs font-medium"
                    style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
            >
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">Signed in</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    Log out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CustomizeModal open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </>
  );
}
