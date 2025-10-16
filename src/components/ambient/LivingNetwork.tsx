'use client';

/**
 * LivingNetwork - Enhanced Ambient Animation Component
 *
 * ⚠️ DO NOT IMPORT BY DEFAULT
 * Only enable this component if NEXT_PUBLIC_ENABLE_AMBIENT=1
 *
 * This provides additional background animations beyond the base NetworkBackground.
 * Use sparingly as it adds rendering overhead.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Blob {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

export function LivingNetwork() {
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [nodeColors, setNodeColors] = useState({
    sage: '#7A9278',
    terracotta: '#C67B5C',
    teal: '#5C8B89',
  });

  // Read colors from CSS variables
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styles = getComputedStyle(document.documentElement);
      const sage = styles.getPropertyValue('--brand-sage').trim();
      const terracotta = styles.getPropertyValue('--brand-terracotta').trim();
      const teal = styles.getPropertyValue('--brand-teal').trim();

      if (sage && terracotta && teal) {
        setNodeColors({ sage, terracotta, teal });
      }
    }
  }, []);

  // Initialize blobs
  useEffect(() => {
    const colors = [nodeColors.sage, nodeColors.terracotta, nodeColors.teal];
    const initialBlobs: Blob[] = [];

    for (let i = 0; i < 5; i++) {
      initialBlobs.push({
        id: `blob-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 200 + Math.random() * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 10 + Math.random() * 10,
      });
    }

    setBlobs(initialBlobs);
  }, [nodeColors]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: blob.size,
            height: blob.size,
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            backgroundColor: blob.color,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Usage Example:
 *
 * // In your page component (e.g., app/page.tsx)
 * const enableAmbient = process.env.NEXT_PUBLIC_ENABLE_AMBIENT === '1';
 *
 * export default function Page() {
 *   return (
 *     <div>
 *       {enableAmbient && <LivingNetwork />}
 *       <YourContent />
 *     </div>
 *   );
 * }
 *
 * // To enable, add to .env.local:
 * NEXT_PUBLIC_ENABLE_AMBIENT=1
 */
