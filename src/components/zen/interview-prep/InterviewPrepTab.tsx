'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, FileText, Video } from 'lucide-react';

/**
 * InterviewPrepTab
 * Lightweight placeholder for interview prep resources until full feature arrives.
 * Keeps the Zen Hub page from failing on missing imports and gives users a clear status.
 */
export function InterviewPrepTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border border-[#E8E6DD] bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D3330]">
            <Sparkles className="h-4 w-4 text-[#1C4D3A]" />
            Interview prep is coming soon
          </CardTitle>
          <CardDescription className="text-[#6B6760]">
            We’re finalizing guided practice, scripts, and mock interview drills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[#2D3330]">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#1C4D3A] text-[#1C4D3A]">
              Beta
            </Badge>
            <span>Sign up to be notified when the full experience launches.</span>
          </div>
          <Button
            size="sm"
            className="bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
            disabled
            title="Coming soon"
          >
            Notify me (coming soon)
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-[#E8E6DD] bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D3330]">
            <FileText className="h-4 w-4 text-[#1C4D3A]" />
            Quick prep checklist
          </CardTitle>
          <CardDescription className="text-[#6B6760]">
            Use this lightweight checklist until the full module ships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#2D3330]">
          <ul className="list-disc list-inside space-y-1">
            <li>Review top 3 accomplishments with metrics</li>
            <li>Prepare a 60–90s “tell me about yourself” arc</li>
            <li>Draft 3 stories (challenge/action/result) for key skills</li>
            <li>List 3 thoughtful questions for the team</li>
            <li>Do a quick mic/camera check before the call</li>
          </ul>
          <div className="flex items-center gap-2 pt-2">
            <Video className="h-4 w-4 text-[#1C4D3A]" />
            <span>Mock interview videos will appear here soon.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
