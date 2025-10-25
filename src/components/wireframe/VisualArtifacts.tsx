'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Download,
  FileImage,
  Image as ImageIcon,
  Instagram,
  Youtube,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LINKEDIN_COVER = '/wireframe-assets/linkedin-cover.png';

const DOWNLOADS = [
  {
    label: 'Download PNG',
    description: 'High-resolution static cover',
    href: '/wireframe-assets/linkedin-cover.png',
  },
  {
    label: 'Download JPG',
    description: 'Optimized for profile uploads',
    href: '/wireframe-assets/linkedin-cover.jpg',
  },
  {
    label: 'Download Figma',
    description: 'Edit the cover in Figma',
    href: 'https://figma.com/file/DPu8hugcNJTJQ7JGK0qiMi',
  },
];

export function VisualArtifacts() {
  const [tab, setTab] = useState('linkedin');

  return (
    <section className="min-h-screen bg-[#F7F6F1] py-16 text-[#2C2A27] dark:bg-[#201A15] dark:text-[#E8E6DD]">
      <div className="mx-auto max-w-6xl px-6">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2C2A27]/10 bg-white/70 px-4 py-1 text-xs tracking-[0.3em] uppercase text-[#4A5943] shadow-sm">
            Visual library
          </span>
          <h1 className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
            Visual artifacts
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            Download high-resolution assets for LinkedIn, social media, and motion backdrops.
            Everything is branded with Japandi accents to showcase living networks.
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="mt-12 w-full">
          <TabsList className="mx-auto grid w-full max-w-3xl grid-cols-4 rounded-full bg-white/70 p-1 text-sm shadow-lg backdrop-blur dark:bg-[#2C221D]/70">
            <TabsTrigger value="linkedin" className="rounded-full">
              <ImageIcon className="mr-2 h-4 w-4" /> LinkedIn
            </TabsTrigger>
            <TabsTrigger value="social" className="rounded-full">
              <FileImage className="mr-2 h-4 w-4" /> Social
            </TabsTrigger>
            <TabsTrigger value="youtube" className="rounded-full">
              <Youtube className="mr-2 h-4 w-4" /> YouTube
            </TabsTrigger>
            <TabsTrigger value="instagram" className="rounded-full">
              <Instagram className="mr-2 h-4 w-4" /> Instagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linkedin" className="mt-10">
            <LinkedInTab />
          </TabsContent>

          <TabsContent value="social" className="mt-10">
            <ComingSoon
              label="Social media elements"
              description="Reusable tiles and motion templates are in development."
            />
          </TabsContent>

          <TabsContent value="youtube" className="mt-10">
            <ComingSoon
              label="YouTube channel art"
              description="Channel banners and motion bumpers are coming soon."
            />
          </TabsContent>

          <TabsContent value="instagram" className="mt-10">
            <ComingSoon
              label="Instagram highlights"
              description="Highlight covers and story templates will ship next."
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function LinkedInTab() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#2C2A27]/10 bg-white/60 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#241F1B]/80">
          <h2 className="text-2xl font-semibold">LinkedIn cover</h2>
          <p className="mt-2 text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            Proofound&apos;s network visualization rendered as a Japandi cover. The canvas breathes
            with credibility nodes that represent individuals, organizations, and civic branches.
          </p>
          <ul className="mt-4 grid gap-3 text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            <li>• 1584 × 396 px — LinkedIn recommended dimensions</li>
            <li>• Living network background with explainable layers</li>
            <li>• Exported PNG and JPG for instant upload</li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#2C2A27]/10 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#231E1A]/80">
          <div className="relative w-full">
            <div className="relative h-64 w-full">
              <Image
                src={LINKEDIN_COVER}
                alt="Proofound LinkedIn cover"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-end bg-gradient-to-l from-black/35 via-black/10 to-transparent px-10">
              <div className="text-right text-white">
                <h3 className="text-3xl font-semibold">Proofound</h3>
                <p className="text-sm opacity-80">First ever credibility engineering platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-3xl border border-[#2C2A27]/10 bg-white/60 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#221D19]/80">
          <h3 className="text-lg font-semibold">Download options</h3>
          <p className="mt-2 text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
            Choose the asset that fits your workflow. PNG is the most precise export for immediate
            uploads.
          </p>
          <div className="mt-4 space-y-3">
            {DOWNLOADS.map((item) => (
              <DownloadButton
                key={item.label}
                href={item.href}
                label={item.label}
                description={item.description}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#2C2A27]/10 bg-white/70 p-6 text-sm text-[#2C2A27]/70 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#221D19]/85 dark:text-[#E8E6DD]/70">
          <p className="font-semibold text-[#4A5943] dark:text-[#D4C4A8]">Motion tip</p>
          <p className="mt-2">
            To capture the animation, record the canvas with OBS or QuickTime and crop to 1584×396
            px. Upload the exported frame as a static background.
          </p>
        </div>
      </aside>
    </div>
  );
}

function DownloadButton({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      download
      className="flex items-center justify-between rounded-2xl border border-[#2C2A27]/10 bg-white/80 px-4 py-3 text-sm transition hover:border-[#4A5943]/40 hover:bg-white shadow-sm dark:border-white/10 dark:bg-[#261F1B]/80 dark:hover:border-[#D4C4A8]/40"
    >
      <div>
        <span className="font-medium text-[#4A5943] dark:text-[#D4C4A8]">{label}</span>
        <p className="text-xs text-[#2C2A27]/60 dark:text-[#E8E6DD]/60">{description}</p>
      </div>
      <Download className="h-4 w-4 text-[#4A5943] dark:text-[#D4C4A8]" />
    </a>
  );
}

function ComingSoon({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#2C2A27]/15 bg-white/60 p-16 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#211C18]/70">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#4A5943]/20 bg-white/80 shadow-sm dark:border-[#D4C4A8]/20 dark:bg-[#2A241F]/80">
        <Sparkles className="h-8 w-8 text-[#C67B5C]" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold">{label}</h3>
      <p className="mt-3 max-w-sm text-sm text-[#2C2A27]/70 dark:text-[#E8E6DD]/70">
        {description}
      </p>
      <Button
        variant="outline"
        className="mt-6 rounded-full border-[#2C2A27]/20 px-6 dark:border-white/20"
      >
        Join the waitlist
      </Button>
    </div>
  );
}
