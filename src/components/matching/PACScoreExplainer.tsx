/**
 * PAC Score Explainer Component
 *
 * PRD Part 4 (F3): Display Purpose-Alignment Contribution breakdown
 * Shows values overlap + causes overlap to explain "why this match"
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, Heart, Target, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PACScoreExplainerProps {
  pacScore: number; // 0-1, total PAC score
  valuesOverlap: number; // 0-1, Jaccard similarity for values
  causesOverlap: number; // 0-1, Jaccard similarity for causes
  sharedValues?: string[]; // Values in common
  sharedCauses?: string[]; // Causes in common
  totalValues?: number; // Total unique values across both
  totalCauses?: number; // Total unique causes across both
  trigger?: React.ReactNode; // Custom trigger button
}

export function PACScoreExplainer({
  pacScore,
  valuesOverlap,
  causesOverlap,
  sharedValues = [],
  sharedCauses = [],
  totalValues = 0,
  totalCauses = 0,
  trigger,
}: PACScoreExplainerProps) {
  const [open, setOpen] = useState(false);

  // Calculate percentages
  const pacPercent = Math.round(pacScore * 100);
  const valuesPercent = Math.round(valuesOverlap * 100);
  const causesPercent = Math.round(causesOverlap * 100);

  // Default trigger if none provided
  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-xs gap-1" style={{ color: '#1C4D3A' }}>
      <Info className="w-3.5 h-3.5" />
      Why this match?
    </Button>
  );

  const isDesktop = useResponsiveModalMode(open);

  const renderModalContentBody = () => (
    <>
      <div className="space-y-6 py-4 px-4 md:px-0">
        <DialogHeader className="md:px-0 px-2 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" style={{ color: '#1C4D3A' }} />
            Purpose-Alignment Contribution (PAC)
          </DialogTitle>
        </DialogHeader>

        {/* Overall PAC Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall PAC Score</span>
            <span className="text-2xl font-semibold" style={{ color: '#1C4D3A' }}>
              {pacPercent}%
            </span>
          </div>
          <Progress value={pacPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Measures how well your purpose aligns with this opportunity
          </p>
        </div>

        {/* Values Overlap */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4" style={{ color: '#C76B4A' }} />
            <h4 className="font-medium text-sm text-foreground">Values Alignment</h4>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Overlap</span>
            <span className="text-sm font-semibold" style={{ color: '#C76B4A' }}>
              {valuesPercent}%
            </span>
          </div>
          <Progress value={valuesPercent} className="h-1.5 mb-3" />

          {sharedValues.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Shared values:</p>
              <div className="flex flex-wrap gap-1.5">
                {sharedValues.map((value, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-proofound-terracotta/10 text-proofound-terracotta border-[#C76B4A]/20"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {value}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {sharedValues.length} of {totalValues} values in common
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No values overlap data available</p>
          )}
        </div>

        {/* Causes Overlap */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" style={{ color: '#1C4D3A' }} />
            <h4 className="font-medium text-sm text-foreground">Causes Alignment</h4>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Overlap</span>
            <span className="text-sm font-semibold" style={{ color: '#1C4D3A' }}>
              {causesPercent}%
            </span>
          </div>
          <Progress value={causesPercent} className="h-1.5 mb-3" />

          {sharedCauses.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Shared causes:</p>
              <div className="flex flex-wrap gap-1.5">
                {sharedCauses.map((cause, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-proofound-forest/10 text-proofound-forest border-proofound-forest/20"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {cause}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {sharedCauses.length} of {totalCauses} causes in common
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No causes overlap data available</p>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-japandi-bg rounded-lg p-4 border border-proofound-stone">
          <p className="text-xs leading-relaxed text-foreground">
            <strong className="font-semibold">How PAC is calculated:</strong>
            <br />
            PAC uses <em>Jaccard similarity</em> to measure the overlap between your values and
            causes with those of this opportunity. Higher overlap means stronger alignment with your
            purpose.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2 pb-4 md:pb-0 px-4 md:px-0">
        <Button
          onClick={() => setOpen(false)}
          style={{ backgroundColor: '#1C4D3A' }}
          className="text-white w-full md:w-auto"
        >
          Got it
        </Button>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent className="max-w-lg p-6">{renderModalContentBody()}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
      <DrawerContent>
        <div className="overflow-y-auto w-full">{renderModalContentBody()}</div>
      </DrawerContent>
    </Drawer>
  );
}
