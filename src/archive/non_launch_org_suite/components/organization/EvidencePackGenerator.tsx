'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface EvidencePackGeneratorProps {
  orgId: string;
  orgName: string;
  hasImpactData: boolean;
}

export function EvidencePackGenerator({
  orgId,
  orgName,
  hasImpactData,
}: EvidencePackGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    toast.info('Preparing Evidence Pack...');

    try {
      // Call the evidence pack API endpoint
      const response = await fetch(`/api/organizations/${orgId}/evidence-pack`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate Evidence Pack');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${orgName.replace(/\s+/g, '-')}-evidence-pack-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Evidence Pack generated successfully!');
    } catch (error) {
      console.error('Error generating Evidence Pack:', error);
      toast.error('Failed to generate Evidence Pack');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-proofound-stone dark:border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence Pack
            </CardTitle>
            <CardDescription className="mt-1">
              Generate a comprehensive PDF report of your organization&apos;s impact
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasImpactData ? (
          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-2">
              Add impact entries to generate an Evidence Pack
            </p>
            <p className="text-xs text-muted-foreground">
              The Evidence Pack compiles all your impact data into a professional PDF report
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">What&apos;s included:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest mt-0.5 flex-shrink-0" />
                  <span>Organization overview and mission</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest mt-0.5 flex-shrink-0" />
                  <span>All impact entries with metrics and timeframes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest mt-0.5 flex-shrink-0" />
                  <span>Beneficiary data and outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest mt-0.5 flex-shrink-0" />
                  <span>Professional formatting for sharing with stakeholders</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating || !hasImpactData}
              className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Evidence Pack
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              The PDF will be downloaded to your device
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
