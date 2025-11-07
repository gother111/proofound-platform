/**
 * Share Profile Dialog
 *
 * Allows users to create shareable profile snippets
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Share2,
  Copy,
  CheckCircle2,
  Code,
  Link as LinkIcon,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/log';
import { generateEmbedCode, generateShareText } from '@/lib/profile/snippet-generator';

interface ShareProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userHeadline?: string;
}

export function ShareProfileDialog({
  isOpen,
  onClose,
  userName,
  userHeadline,
}: ShareProfileDialogProps) {
  const [fields, setFields] = useState({
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
  });

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

  const handleFieldToggle = (field: string) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/profile/snippet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields,
          theme,
          format,
          expiresInDays,
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

      log.info('profile.snippet.generated', {
        format,
        theme,
      });
    } catch (error) {
      log.error('profile.snippet.generate.failed', {
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
  const embedCode = generatedSnippet ? generateEmbedCode(generatedSnippet.shareToken, format) : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Profile
          </DialogTitle>
          <DialogDescription>
            Create a shareable link or embed code for your profile
          </DialogDescription>
        </DialogHeader>

        {!generatedSnippet ? (
          <div className="space-y-6">
            {/* Fields Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">What to Share</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({
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
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Switch
                      id={key}
                      checked={fields[key as keyof typeof fields] as boolean}
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

            <TabsContent value="link" className="space-y-3">
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
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-3">
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

            <TabsContent value="social" className="space-y-3">
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
