'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, Wand2, Clock3 } from 'lucide-react';

interface ModeSelectorProps {
  onSelect: (mode: 'guided' | 'explore') => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Choose Your Approach</h2>
        <p className="text-muted-foreground">
          Pick the path that fits your pace. Guided takes about 2–3 minutes; Explore is fastest if
          you already know what to add.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onSelect('guided')}
        >
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="secondary">Recommended</Badge>
              <Badge variant="outline" className="gap-1">
                <Clock3 className="h-3 w-3" />
                ~2–3 mins
              </Badge>
            </div>
            <CardTitle>Guided Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Step-by-step help with examples so you can add the right skills with confidence.
            </p>
            <ul className="text-sm space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>•</span> Smart suggestions based on your journey
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>•</span> Step-by-step prompts with definitions
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>•</span> Proof and verification reminders built-in
              </li>
            </ul>
            <Button className="w-full">Start Guided Mode</Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onSelect('explore')}
        >
          <CardHeader>
            <div className="p-2 bg-amber-100 rounded-lg w-fit mb-2">
              <Compass className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="gap-1">
                <Clock3 className="h-3 w-3" />
                Fastest
              </Badge>
            </div>
            <CardTitle>Explore Freely</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse the full skill library and add skills at your own pace. Great if you already
              know the exact terms.
            </p>
            <ul className="text-sm space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span aria-hidden>•</span> Full skill library access (18,708 skills)
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>•</span> Advanced search and filters
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>•</span> Best for power users who know their keywords
              </li>
            </ul>
            <Button variant="outline" className="w-full">
              Explore skills
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
