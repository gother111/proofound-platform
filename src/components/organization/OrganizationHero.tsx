import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Link as LinkIcon, Calendar, Edit3, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { organizationTypeLabel } from '@/lib/copy/labels';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';

interface OrganizationHeroProps {
  org: {
    displayName: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    tagline: string | null;
    verified: boolean;
    website: string | null;
    foundedDate: string | null;
    type: string | null;
    locations: string[] | null;
  };
  canEdit: boolean;
  onEditProfile?: () => void;
}

export function OrganizationHero({ org, canEdit, onEditProfile }: OrganizationHeroProps) {
  const coverImageUrl = org.coverImageUrl || null;
  const firstLocation =
    Array.isArray(org.locations) && org.locations.length > 0 ? org.locations[0] : null;
  const normalizedWebsite = normalizeOrganizationWebsite(org.website).value;

  return (
    <div className="relative mb-8">
      {/* Cover Image Area */}
      <div className="h-48 md:h-64 w-full rounded-b-[2.5rem] overflow-hidden relative bg-gradient-to-br from-[#7A9278] via-[#E0D5C7] to-[#C9A57B]">
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover opacity-80 mix-blend-overlay"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24">
        <div className="bg-white/70 dark:bg-stone-900/60 backdrop-blur-md border border-white/40 dark:border-stone-800/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="relative -mt-16 md:-mt-24 flex-shrink-0">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/80 dark:border-stone-800/80 shadow-lg rounded-3xl">
                <AvatarImage src={org.logoUrl ?? undefined} alt={org.displayName} />
                <AvatarFallback className="text-4xl font-display bg-[#E0D5C7]/30 text-[#7A9278] rounded-3xl">
                  {org.displayName?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-display font-bold text-proofound-charcoal dark:text-foreground">
                      {org.displayName}
                    </h1>
                    {org.verified && (
                      <CheckCircle2 className="w-6 h-6 text-proofound-forest fill-proofound-parchment" />
                    )}
                  </div>
                  {org.tagline && (
                    <p className="text-lg text-muted-foreground font-medium">{org.tagline}</p>
                  )}
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={onEditProfile}
                    data-testid="org-edit-profile-button"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {firstLocation && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {firstLocation}
                  </div>
                )}
                {normalizedWebsite && (
                  <a
                    href={normalizedWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-proofound-forest transition-colors"
                    data-testid="org-website-link"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Website
                  </a>
                )}
                {org.foundedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Founded {new Date(org.foundedDate).getFullYear()}
                  </div>
                )}
                <Badge
                  variant="secondary"
                  className="bg-proofound-parchment text-proofound-charcoal border-proofound-stone"
                >
                  {organizationTypeLabel(org.type)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
