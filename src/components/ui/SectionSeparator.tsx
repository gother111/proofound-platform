'use client';

import React from 'react';

interface SectionSeparatorProps {
  className?: string;
  fill?: string;
  direction?: 'up' | 'down';
}

export default function SectionSeparator({
  className = '',
  fill = '#F7F6F1',
  direction = 'up',
}: SectionSeparatorProps) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${className}`}>
      <svg
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]"
        style={{ transform: direction === 'down' ? 'rotate(180deg)' : 'none' }}
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          fill={fill}
          className="opacity-20"
        ></path>
        <path
          d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
          fill={fill}
        ></path>
      </svg>
    </div>
  );
}
