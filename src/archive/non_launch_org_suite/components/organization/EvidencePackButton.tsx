/**
 * Evidence Pack Download Button
 *
 * Allows organizations to export candidate evidence packs as PDF
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api/fetch';

interface EvidencePackButtonProps {
  candidateId: string;
  candidateName: string;
  assignmentId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function EvidencePackButton({
  candidateId,
  candidateName,
  assignmentId,
  variant = 'outline',
  size = 'default',
}: EvidencePackButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);

      console.log('evidence_pack.download.start', {
        candidateId,
        assignmentId,
      });

      // Fetch PDF
      const response = await apiFetch(
        `/api/evidence-pack/${candidateId}?assignmentId=${assignmentId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate evidence pack');
      }

      // Get blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evidence-pack-${candidateName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Evidence pack downloaded',
        description: 'PDF has been saved to your downloads',
      });

      console.log('evidence_pack.download.success', {
        candidateId,
        assignmentId,
      });
    } catch (error) {
      console.error('evidence_pack.download.failed', {
        candidateId,
        assignmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: 'Failed to download evidence pack',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating} variant={variant} size={size}>
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Download Evidence Pack
        </>
      )}
    </Button>
  );
}
