import { notFound } from 'next/navigation';
import { Building2, Heart, Sparkles } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrganizationFollowButton } from '@/components/organization/OrganizationFollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type OrgValue = { label?: string; description?: string };

export default async function IndividualOrganizationProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select(
      `
        id,
        slug,
        display_name,
        tagline,
        mission,
        vision,
        logo_url,
        cover_image_url,
        industry,
        impact_area,
        causes,
        values
      `
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const org = {
    id: data.id as string,
    slug: data.slug as string,
    displayName: data.display_name as string,
    tagline: (data.tagline as string | null) ?? null,
    mission: (data.mission as string | null) ?? null,
    vision: (data.vision as string | null) ?? null,
    logoUrl: (data.logo_url as string | null) ?? null,
    coverUrl: (data.cover_image_url as string | null) ?? null,
    industry: (data.industry as string | null) ?? null,
    impactArea: (data.impact_area as string | null) ?? null,
    causes: (data.causes as string[] | null) ?? [],
    values: (data.values as OrgValue[] | null) ?? [],
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] pb-12">
      <div className="relative h-48 md:h-64 w-full overflow-hidden bg-gradient-to-r from-proofound-forest to-teal">
        {org.coverUrl && (
          // Using plain img to avoid Next/Image config in app dir
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.coverUrl}
            alt="Organization cover"
            className="w-full h-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-white shadow-md">
              <AvatarImage src={org.logoUrl || undefined} alt={org.displayName} />
              <AvatarFallback className="bg-proofound-parchment text-proofound-forest text-2xl">
                {org.displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-semibold text-[#2D3330]">{org.displayName}</h1>
                {org.industry && <Badge variant="outline">{org.industry}</Badge>}
                {org.impactArea && (
                  <Badge variant="secondary" className="bg-[#EEF1EA] text-[#1C4D3A]">
                    {org.impactArea}
                  </Badge>
                )}
              </div>
              {org.tagline && <p className="text-[#6B6760] mt-1">{org.tagline}</p>}
            </div>
          </div>

          <OrganizationFollowButton slug={org.slug} orgName={org.displayName} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-white md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#6B6760]" />
              <h2 className="text-lg font-semibold text-[#2D3330]">Mission & Vision</h2>
            </div>
            <div className="space-y-3 text-[#2D3330]">
              <div>
                <p className="text-sm text-[#6B6760] uppercase tracking-wide mb-1">Mission</p>
                <p>{org.mission || 'Not provided yet.'}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-[#6B6760] uppercase tracking-wide mb-1">Vision</p>
                <p>{org.vision || 'Not provided yet.'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#6B6760]" />
              <h2 className="text-lg font-semibold text-[#2D3330]">Causes</h2>
            </div>
            {org.causes.length === 0 ? (
              <p className="text-sm text-[#6B6760]">No causes listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {org.causes.map((cause) => (
                  <Badge key={cause} variant="outline">
                    {cause}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6B6760]" />
            <h2 className="text-lg font-semibold text-[#2D3330]">Values & Culture</h2>
          </div>
          {org.values.length === 0 ? (
            <p className="text-sm text-[#6B6760]">No values shared yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {org.values.map((value, idx) => (
                <Card key={idx} className="p-3 bg-[#F7F6F1]">
                  <p className="font-medium text-[#2D3330]">{value.label || 'Value'}</p>
                  {value.description && (
                    <p className="text-sm text-[#6B6760] mt-1">{value.description}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
