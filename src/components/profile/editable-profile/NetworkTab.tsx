'use client';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Briefcase, GraduationCap, Network, User } from 'lucide-react';

export function NetworkTab() {
  return (
    <TabsContent value="network">
      <Card className="p-8 border-2">
        <div className="text-center mb-8">
          <Network className="w-16 h-16 mx-auto mb-4 text-[#7A9278]" />
          <h3 className="text-2xl font-display font-semibold mb-2">Living Network</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Your network is fluid and dynamic. Connections that no longer hold mutual value
            naturally dissolve, ensuring your network always reflects authentic, active
            relationships.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-muted/20 rounded-xl border border-transparent hover:border-[#7A9278]/20 hover:bg-[#7A9278]/5 transition-colors group">
            <User className="w-6 h-6 mx-auto mb-2 text-[#7A9278] group-hover:scale-110 transition-transform" />
            <p className="text-sm text-muted-foreground mb-1">People</p>
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Active connections</p>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-xl border border-transparent hover:border-[#C67B5C]/20 hover:bg-[#C67B5C]/5 transition-colors group">
            <Briefcase className="w-6 h-6 mx-auto mb-2 text-[#C67B5C] group-hover:scale-110 transition-transform" />
            <p className="text-sm text-muted-foreground mb-1">Organizations</p>
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Active connections</p>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-xl border border-transparent hover:border-[#5C8B89]/20 hover:bg-[#5C8B89]/5 transition-colors group">
            <GraduationCap className="w-6 h-6 mx-auto mb-2 text-[#5C8B89] group-hover:scale-110 transition-transform" />
            <p className="text-sm text-muted-foreground mb-1">Institutions</p>
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Active connections</p>
          </div>
        </div>
        <div className="text-center">
          <Button className="rounded-full" style={{ backgroundColor: 'rgb(122, 146, 120)' }}>
            <Network className="w-4 h-4 mr-2" />
            Visualize Network Graph
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            See how your connections relate to each other and discover new collaboration
            opportunities
          </p>
        </div>
      </Card>
    </TabsContent>
  );
}
