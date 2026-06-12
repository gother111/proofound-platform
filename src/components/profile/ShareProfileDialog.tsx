/**
 * Share Profile Dialog
 *
 * Allows users to share the launch Public Page or Organization Trust Page
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Share2,
  Copy,
  CheckCircle2,
  Code,
  ExternalLink,
  Link as LinkIcon,
  MessageSquareText,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateEmbedCodeFromUrl, generateShareText } from '@/lib/profile/snippet-generator';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type ProfileType = 'individual' | 'organization';

const INDIVIDUAL_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  headline: 'Headline',
  bio: 'Biography',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  location: 'Location',
  profileImage: 'Photo',
};

const ORGANIZATION_FIELD_LABELS: Record<string, string> = {
  displayName: 'Organization Name',
  tagline: 'Tagline',
  mission: 'Mission',
  vision: 'Vision',
  website: 'Website',
  locations: 'Locations',
  logo: 'Logo',
  coverImage: 'Cover Image',
  causes: 'Causes',
  workCulture: 'Work Culture',
  impact: 'Impact',
  foundedDate: 'Founded Date',
  type: 'Organization Type',
};

function getDefaultFields(profileType: ProfileType) {
  if (profileType === 'organization') {
    return {
      displayName: true,
      tagline: true,
      mission: true,
      vision: true,
      website: true,
      locations: true,
      logo: true,
      coverImage: false,
      causes: true,
      workCulture: false,
      impact: false,
      foundedDate: true,
      type: true,
    } as Record<string, boolean | number>;
  }

  return {
    name: true,
    headline: true,
    bio: true,
    skills: true,
    topSkills: 5,
    experience: false,
    education: false,
    location: true,
    profileImage: true,
  } as Record<string, boolean | number>;
}

interface ShareProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userHeadline?: string;
  profileType?: ProfileType;
  orgId?: string;
  publicPagePath?: string | null;
}

type CopyFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const SHARE_LINK_RETRY_COPY: Record<ProfileType, string> = {
  individual:
    'Public Page link could not be created. Your sharing options are still here; please try again.',
  organization:
    'Organization Trust Page link could not be created. Your sharing options are still here; please try again.',
};

export function ShareProfileDialog({
  isOpen,
  onClose,
  userName,
  userHeadline,
  profileType = 'individual',
  publicPagePath,
}: ShareProfileDialogProps) {
  const isDesktop = useResponsiveModalMode(isOpen);
  const [fields, setFields] = useState<Record<string, boolean | number>>(
    getDefaultFields(profileType)
  );

  const theme = 'light' as const;
  const [format, setFormat] = useState<'card' | 'mini' | 'full'>('card');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState<{
    url: string;
    shareToken: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);

  const { toast } = useToast();
  const fieldLabels = useMemo(
    () => (profileType === 'organization' ? ORGANIZATION_FIELD_LABELS : INDIVIDUAL_FIELD_LABELS),
    [profileType]
  );

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const handleFieldToggle = (field: string) => {
    setFields((prev) => {
      if (typeof prev[field] !== 'boolean') {
        return prev;
      }
      return { ...prev, [field]: !prev[field] };
    });
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationError(null);

      if (!publicPagePath) {
        toast({
          title:
            profileType === 'organization'
              ? 'Organization Trust Page not ready'
              : 'Public Page not ready',
          description: 'Complete the required proof and visibility steps before sharing.',
          variant: 'destructive',
        });
        return;
      }

      const publicUrl = new URL(publicPagePath, window.location.origin).toString();

      setGeneratedSnippet({
        url: publicUrl,
        shareToken: publicPagePath,
      });

      toast({
        title: 'Shareable link created',
        description:
          profileType === 'organization'
            ? 'Your Organization Trust Page link is ready to share'
            : 'Your Public Page link is ready to share',
      });
    } catch (error) {
      dispatchClientDiagnostic('profile.snippet.generate_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setGenerationError(SHARE_LINK_RETRY_COPY[profileType]);
      toast({
        title: 'Share link not created',
        description: SHARE_LINK_RETRY_COPY[profileType],
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    try {
      setCopyFeedback(null);
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setCopyFeedback({ kind: 'success', message: `${label} copied to clipboard.` });
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopied(null);
        setCopyFeedback(null);
        copyResetTimerRef.current = null;
      }, 2000);
      toast({
        title: 'Copied to clipboard',
        description: `${label} copied`,
      });
    } catch (error) {
      dispatchClientErrorDiagnostic('profile.share_dialog.copy_failed', error);
      setCopied(null);
      setCopyFeedback({
        kind: 'error',
        message: `${label} could not be copied. Select the text manually or try again.`,
      });
      toast({
        title: 'Copy did not work',
        description: 'The share text stayed visible so you can copy it manually or retry.',
        variant: 'destructive',
      });
    }
  };

  const shareTexts = generateShareText({ name: userName, headline: userHeadline });
  const embedCode = generatedSnippet ? generateEmbedCodeFromUrl(generatedSnippet.url, format) : '';

  const renderDialogContentBody = () => (
    <>
      {!generatedSnippet ? (
        <div className="space-y-6">
          {/* Fields Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">What to Share</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(fieldLabels).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={Boolean(fields[key])}
                    onCheckedChange={() => handleFieldToggle(key)}
                  />
                  <Label htmlFor={key} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Format</Label>
            <RadioGroup value={format} onValueChange={(v: any) => setFormat(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mini" id="mini" />
                <Label htmlFor="mini" className="cursor-pointer">
                  Mini (Compact badge)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer">
                  Card (Standard Public Page card)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">
                  Full (Complete proof view)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="mb-1 block text-base font-semibold">Theme</Label>
            <p className="text-sm text-muted-foreground">
              Public Page embeds use the global Japandi light theme by default.
            </p>
          </div>

          {/* Expiration */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Expiration (Optional)</Label>
            <Input
              type="number"
              placeholder="Days until link expires (leave empty for no expiration)"
              value={expiresInDays || ''}
              onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
              min={1}
              max={365}
            />
          </div>

          {generationError ? (
            <p
              className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
              role="alert"
              aria-live="assertive"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{generationError}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="embed">
              <Code className="h-4 w-4 mr-2" />
              Embed
            </TabsTrigger>
            <TabsTrigger value="outreach">
              <MessageSquareText className="h-4 w-4 mr-2" />
              Outreach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 mt-4">
            <div>
              <Label>Shareable URL</Label>
              <div className="flex gap-2 mt-2">
                <Input value={generatedSnippet.url} readOnly />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={
                    copied === 'Shareable URL' ? 'Shareable URL copied' : 'Copy shareable URL'
                  }
                  onClick={() => void handleCopy(generatedSnippet.url, 'Shareable URL')}
                >
                  {copied === 'Shareable URL' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                className="mt-2 w-full"
                variant="outline"
                onClick={() => window.open(generatedSnippet.url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-3 mt-4">
            <div>
              <Label>HTML Embed Code</Label>
              <div className="mt-2 space-y-2">
                <textarea
                  className="w-full h-32 p-3 text-xs font-mono rounded border"
                  value={embedCode}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy(embedCode, 'Embed code')}
                  className="w-full"
                >
                  {copied === 'Embed code' ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy Embed Code
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outreach" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div>
                <Label>Proof-safe outreach copy</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={shareTexts.outreach} readOnly />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={
                      copied === 'Outreach copy' ? 'Outreach copy copied' : 'Copy outreach copy'
                    }
                    onClick={() => void handleCopy(shareTexts.outreach, 'Outreach copy')}
                  >
                    {copied === 'Outreach copy' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {copyFeedback ? (
            <p
              className={
                copyFeedback.kind === 'error'
                  ? 'mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900'
                  : 'mt-3 text-xs leading-5 text-proofound-forest'
              }
              role={copyFeedback.kind === 'error' ? 'alert' : 'status'}
              aria-live={copyFeedback.kind === 'error' ? 'assertive' : 'polite'}
            >
              {copyFeedback.kind === 'error' ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : null}
              <span>{copyFeedback.message}</span>
            </p>
          ) : null}
        </Tabs>
      )}
    </>
  );

  const titleAndDescription = (
    <>
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        <span className="font-semibold text-lg">
          Share Your {profileType === 'organization' ? 'Organization Trust Page' : 'Public Page'}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Create a shareable link, embed code, or proof-safe outreach copy for your{' '}
        {profileType === 'organization' ? 'organization trust page' : 'public page'}
      </p>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle asChild>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Your{' '}
                {profileType === 'organization' ? 'Organization Trust Page' : 'Public Page'}
              </div>
            </DialogTitle>
            <DialogDescription>
              Create a shareable link, embed code, or proof-safe outreach copy for your{' '}
              {profileType === 'organization' ? 'organization trust page' : 'public page'}
            </DialogDescription>
          </DialogHeader>

          {renderDialogContentBody()}

          <DialogFooter>
            {!generatedSnippet ? (
              <>
                <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating || !publicPagePath}>
                  {isGenerating
                    ? 'Generating...'
                    : publicPagePath
                      ? 'Generate Shareable Link'
                      : 'Public Page Not Ready'}
                </Button>
              </>
            ) : (
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">{titleAndDescription}</DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">{renderDialogContentBody()}</div>
        <DrawerFooter className="pt-2">
          {!generatedSnippet ? (
            <>
              <Button onClick={handleGenerate} disabled={isGenerating || !publicPagePath}>
                {isGenerating
                  ? 'Generating...'
                  : publicPagePath
                    ? 'Generate Shareable Link'
                    : 'Public Page Not Ready'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
