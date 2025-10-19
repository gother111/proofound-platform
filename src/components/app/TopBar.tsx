'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
        style={{ backgroundColor: '#FDFCFA', borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7A9278] to-[#5C8B89] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">P</span>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#2D3330' }}>
            Dashboard
          </h1>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-9 h-9 w-full" />
          </div>
        </div>

        {/* Right: Customize + Avatar */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)}>
            Customize
          </Button>
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <CustomizeModal open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </>
  );
}
