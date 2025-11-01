import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { width: 28, height: 28 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

/**
 * Reusable Logo component for Proofound brand
 * Uses Next.js Image component for optimized loading
 */
export function Logo({ className, width, height, size = 'sm' }: LogoProps) {
  // Use explicit width/height if provided, otherwise use size prop
  const dimensions = width && height ? { width, height } : sizeMap[size];

  return (
    <Image
      src="/logo.png"
      alt="Proofound Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={cn('object-contain', className)}
      priority
    />
  );
}

