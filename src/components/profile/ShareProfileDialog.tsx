/**
 * Share Profile Dialog
 *
 * Allows users to create shareable profile snippets
 */

'use client';

import React, { useMemo, useState } from 'react';
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
  Twitter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateEmbedCodeFromUrl, generateShareText } from '@/lib/profile/snippet-generator';
import { apiFetch } from '@/lib/api/fetch';
import { useMediaQuery } from '@/hooks/use-media-query';

type ProfileType = 'individual' | 'organization';

const INDIVIDUAL_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  headline: 'Headline',
  bio: 'Biography',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  location: 'Location',
  profileImage: 'Profile Image',
  values: 'Values',
  causes: 'Causes',
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
    values: true,
    causes: true,
  } as Record<string, boolean | number>;
}

interface ShareProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userHeadline?: string;
  profileType?: ProfileType;
  orgId?: string;
}

export function ShareProfileDialog({
  isOpen,
  onClose,
  userName,
  userHeadline,
  profileType = 'individual',
  orgId,
}: ShareProfileDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [fields, setFields] = useState<Record<string, boolean | number>>(
    getDefaultFields(profileType)
  );

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [format, setFormat] = useState<'card' | 'mini' | 'full'>('card');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState<{
    url: string;
    shareToken: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { toast } = useToast();
  const fieldLabels = useMemo(
    () => (profileType === 'organization' ? ORGANIZATION_FIELD_LABELS : INDIVIDUAL_FIELD_LABELS),
    [profileType]
  );

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

      if (profileType === 'organization' && !orgId) {
        throw new Error('Organization context is required to generate a share link');
      }

      const response = await apiFetch('/api/profile/snippet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields,
          theme,
          format,
          expiresInDays,
          profileType,
          orgId: profileType === 'organization' ? orgId : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create snippet');
      }

      const data = await response.json();

      setGeneratedSnippet({
        url: data.snippet.url,
        shareToken: data.snippet.shareToken,
      });

      toast({
        title: 'Shareable link created',
        description: 'Your profile snippet is ready to share',
      });

      console.log('profile.snippet.generated', {
        format,
        theme,
      });
    } catch (error) {
      console.error('profile.snippet.generate.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Failed to create snippet',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: `${label} copied`,
    });
  };

  const shareTexts = generateShareText({ name: userName, headline: userHeadline });
  const embedCode = generatedSnippet ? generateEmbedCodeFromUrl(generatedSnippet.url, format) : '';

  const DialogContentBody = () => (
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
                  Card (Standard profile card)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">
                  Full (Complete profile view)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Theme Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Theme</Label>
            <RadioGroup value={theme} onValueChange={(v: any) => setTheme(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="cursor-pointer">
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="cursor-pointer">
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="cursor-pointer">
                  Auto (Match viewer's preference)
                </Label>
              </div>
            </RadioGroup>
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
            <TabsTrigger value="social">
              <Twitter className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 mt-4">
            <div>
              <Label>Shareable URL</Label>
              <div className="flex gap-2 mt-2">
                <Input value={generatedSnippet.url} readOnly />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopy(generatedSnippet.url, 'URL')}
                >
                  {copied === 'URL' ? (
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(embedCode, 'Embed code')}
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

          <TabsContent value="social" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div>
                <Label>Twitter</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={shareTexts.twitter} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(shareTexts.twitter, 'Twitter text')}
                  >
                    {copied === 'Twitter text' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label>LinkedIn</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={shareTexts.linkedin} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(shareTexts.linkedin, 'LinkedIn text')}
                  >
                    {copied === 'LinkedIn text' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );

  const TitleAndDescription = () => (
    <>
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        <span className="font-semibold text-lg">
          Share Your {profileType === 'organization' ? 'Organization' : 'Profile'}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Create a shareable link or embed code for your{' '}
        {profileType === 'organization' ? 'organization profile' : 'profile'}
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
                Share Your {profileType === 'organization' ? 'Organization' : 'Profile'}
              </div>
            </DialogTitle>
            <DialogDescription>
              Create a shareable link or embed code for your{' '}
              {profileType === 'organization' ? 'organization profile' : 'profile'}
            </DialogDescription>
          </DialogHeader>

          <DialogContentBody />

          <DialogFooter>
            {!generatedSnippet ? (
              <>
                <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Shareable Link'}
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
        <DrawerHeader className="text-left">
          <TitleAndDescription />
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
          <DialogContentBody />
        </div>
        <DrawerFooter className="pt-2">
          {!generatedSnippet ? (
            <>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Shareable Link'}
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
