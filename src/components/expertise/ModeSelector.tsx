'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, Wand2 } from 'lucide-react';

interface ModeSelectorProps {
  onSelect: (mode: 'guided' | 'explore') => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Choose Your Approach</h2>
        <p className="text-muted-foreground">How would you like to build your expertise profile?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onSelect('guided')}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            <CardTitle>Guided Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We&apos;ll help you discover relevant skills based on your background and goals.
            </p>
            <ul className="text-sm space-y-2 mb-4">
              <li> Smart suggestions based on your journey</li>
              <li> Step-by-step skill building</li>
              <li> Curated recommendations</li>
            </ul>
            <Button className="w-full">Start Guided Mode</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onSelect('explore')}>
          <CardHeader>
            <div className="p-2 bg-amber-100 rounded-lg w-fit mb-2">
              <Compass className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle>Explore Freely</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse the full taxonomy and add skills at your own pace.
            </p>
            <ul className="text-sm space-y-2 mb-4">
              <li> Full taxonomy access (18,708 skills)</li>
              <li> Advanced search and filters</li>
              <li> Self-directed discovery</li>
            </ul>
            <Button variant="outline" className="w-full">Explore Taxonomy</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
