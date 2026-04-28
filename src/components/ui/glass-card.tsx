'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * GlassCard Component
 *
 * An elevated, frosted-glass variant of the standard Card component.
 * Features an animated gradient border on hover and subtle noise texture
 * to enhance the Japandi aesthetic for premium dashboard widgets.
 */

interface GlassCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, interactive = false, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden group',
          'bg-white/80 dark:bg-background/80 backdrop-blur-md',
          'border-border/50 dark:border-border/20',
          'shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(28,77,58,0.04)]',
          interactive &&
            'hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,77,58,0.08)] transition-all duration-300 cursor-pointer',
          className
        )}
        {...props}
      >
        {/* Animated Gradient Border (visible on hover if interactive, or always subtle) */}
        {interactive && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl p-[1px] bg-gradient-to-br from-proofound-forest/30 via-transparent to-proofound-terracotta/30"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-background/40 rounded-xl backdrop-blur-[2px]" />
          </div>
        )}

        {/* Noise Texture Overlay for material realism */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("/noise.png")' }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 w-full h-full">{children}</div>
      </Card>
    );
  }
);

GlassCard.displayName = 'GlassCard';

/**
 * Motion variant for animated entry
 */
type MotionGlassCardProps = GlassCardProps & Omit<HTMLMotionProps<'div'>, 'ref'>;

const MotionGlassCardRender = React.forwardRef<HTMLDivElement, GlassCardProps>((props, ref) => (
  <GlassCard ref={ref} {...props} />
));
MotionGlassCardRender.displayName = 'MotionGlassCardRender';

export const MotionGlassCard = motion(MotionGlassCardRender);
MotionGlassCard.displayName = 'MotionGlassCard';
