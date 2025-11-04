/**
 * Read Receipt Component
 *
 * Shows read/delivered/sent status for messages
 */

'use client';

import { Check, CheckCheck, Clock } from 'lucide-react';

interface ReadReceiptProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp?: Date;
}

export function ReadReceipt({ status, timestamp }: ReadReceiptProps) {
  const getIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-[#A8B69D]" />;
      case 'sent':
        return <Check className="w-3 h-3 text-[#6B6760]" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-[#6B6760]" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-[#1C4D3A]" />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return timestamp
          ? `Read ${timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}`
          : 'Read';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-1 text-xs text-[#6B6760]">
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </div>
  );
}

