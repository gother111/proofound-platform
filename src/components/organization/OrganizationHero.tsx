import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Link as LinkIcon, Calendar, Edit3, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OrganizationHeroProps {
    org: any; // Using any for now to avoid complex type imports, but ideally should be Organization type
    canEdit: boolean;
}

export function OrganizationHero({ org, canEdit }: OrganizationHeroProps) {
    return (
        <div className="relative mb-8">
            {/* Cover Image Area */}
            <div className="h-48 md:h-64 w-full rounded-b-3xl overflow-hidden relative bg-gradient-to-r from-proofound-forest to-teal">
                {org.coverUrl && (
                    <Image
                        src={org.coverUrl}
                        alt="Cover"
                        fill
                        sizes="100vw"
                        className="object-cover opacity-60"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Profile Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-20">
                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 backdrop-blur-sm bg-white/95 dark:bg-stone-900/95 border border-white/20">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Logo */}
                        <div className="relative -mt-16 md:-mt-20 flex-shrink-0">
                            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-stone-900 shadow-lg rounded-2xl">
                                <AvatarImage src={org.logoUrl} alt={org.displayName} />
                                <AvatarFallback className="text-4xl font-display bg-proofound-parchment text-proofound-forest rounded-2xl">
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
                                        <p className="text-lg text-muted-foreground font-medium">
                                            {org.tagline}
                                        </p>
                                    )}
                                </div>
                                {canEdit && (
                                    <Button variant="outline" className="gap-2">
                                        <Edit3 className="w-4 h-4" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {org.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {org.location}
                                    </div>
                                )}
                                {org.website && (
                                    <a
                                        href={org.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:text-proofound-forest transition-colors"
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
                                <Badge variant="secondary" className="bg-proofound-parchment text-proofound-charcoal border-proofound-stone">
                                    {org.type}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
