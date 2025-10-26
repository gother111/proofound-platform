import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Building2,
  Users,
  Target,
  Globe,
  Network,
  Edit,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  // Check if user can edit
  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  // Format org type for display
  const orgTypeLabel =
    org.type === 'ngo'
      ? 'Non-profit / NGO'
      : org.type === 'government'
        ? 'Government'
        : org.type === 'network'
          ? 'Network / Community'
          : org.type === 'company'
            ? 'Company'
            : 'Other';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div
          className="h-48 w-full bg-gradient-to-br from-brand-terracotta via-brand-teal to-brand-ochre"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)',
          }}
        />

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 mb-8">
            <Card className="p-6 border-2">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Logo/Avatar */}
                <div className="relative">
                  {org.logoUrl ? (
                    <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-2 ring-brand-terracotta/20 ring-offset-2">
                      <AvatarImage src={org.logoUrl} alt={org.displayName} />
                      <AvatarFallback className="bg-brand-terracotta/10 text-2xl">
                        <Building2 className="w-12 h-12" style={{ color: 'rgb(198, 123, 92)' }} />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-card bg-brand-terracotta/10 flex items-center justify-center shadow-lg ring-2 ring-brand-terracotta/20 ring-offset-2">
                      <Building2 className="w-16 h-16" style={{ color: 'rgb(198, 123, 92)' }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-display font-semibold">{org.displayName}</h1>
                    <Badge
                      variant="outline"
                      className="gap-1 capitalize"
                      style={{
                        backgroundColor: 'rgba(122, 146, 120, 0.1)',
                        borderColor: 'rgba(122, 146, 120, 0.3)',
                        color: 'rgb(122, 146, 120)',
                      }}
                    >
                      {orgTypeLabel}
                    </Badge>
                  </div>

                  {org.legalName && (
                    <p className="text-sm text-muted-foreground mb-2">{org.legalName}</p>
                  )}

                  {org.website && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <Globe className="w-4 h-4" />
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {org.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {org.mission && (
                    <p className="text-base text-foreground mb-4 max-w-3xl">{org.mission}</p>
                  )}

                  <div className="flex gap-3">
                    {canEdit && (
                      <Button
                        variant="outline"
                        className="rounded-full"
                        style={{
                          backgroundColor: 'rgba(122, 146, 120, 0.1)',
                          borderColor: 'rgba(122, 146, 120, 0.3)',
                          color: 'rgb(122, 146, 120)',
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Mission Card */}
              {org.mission && (
                <Card className="p-6 border-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5" style={{ color: 'rgb(122, 146, 120)' }} />
                    <h3 className="text-lg font-display font-semibold">Mission</h3>
                  </div>
                  <p className="text-sm text-foreground">{org.mission}</p>
                </Card>
              )}

              {/* Organization Type Card */}
              <Card className="p-6 border-2">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5" style={{ color: 'rgb(198, 123, 92)' }} />
                  <h3 className="text-lg font-display font-semibold">Organization Type</h3>
                </div>
                <p className="text-sm font-medium">{orgTypeLabel}</p>
                {org.legalName && (
                  <p className="text-xs text-muted-foreground mt-1">{org.legalName}</p>
                )}
              </Card>

              {/* Status Card */}
              <Card className="p-6 border-2">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(122, 146, 120)' }} />
                  <h3 className="text-lg font-display font-semibold">Status</h3>
                </div>
                <Badge
                  variant="outline"
                  className="gap-1"
                  style={{
                    backgroundColor: 'rgba(122, 146, 120, 0.1)',
                    borderColor: 'rgba(122, 146, 120, 0.3)',
                    color: 'rgb(122, 146, 120)',
                  }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Active Organization
                </Badge>
              </Card>
            </div>

            {/* Main Content - Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="space-y-6">
                <TabsList className="grid grid-cols-3 w-full rounded-full bg-muted/30 p-1">
                  <TabsTrigger value="about" className="rounded-full text-xs sm:text-sm">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">About</span>
                  </TabsTrigger>
                  <TabsTrigger value="team" className="rounded-full text-xs sm:text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Team</span>
                  </TabsTrigger>
                  <TabsTrigger value="network" className="rounded-full text-xs sm:text-sm">
                    <Network className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Network</span>
                  </TabsTrigger>
                </TabsList>

                {/* About Tab */}
                <TabsContent value="about" className="space-y-6">
                  {/* Mission Statement */}
                  {org.mission && (
                    <Card className="p-6 border-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5" style={{ color: 'rgb(122, 146, 120)' }} />
                        <h3 className="text-xl font-display font-semibold">Mission Statement</h3>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{org.mission}</p>
                    </Card>
                  )}

                  {/* Organization Type & Legal */}
                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5" style={{ color: 'rgb(198, 123, 92)' }} />
                      <h3 className="text-xl font-display font-semibold">Organization Details</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                        <p className="text-sm font-medium">{orgTypeLabel}</p>
                      </div>
                      {org.legalName && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Legal Name
                          </h4>
                          <p className="text-sm">{org.legalName}</p>
                        </div>
                      )}
                      {org.website && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Website
                          </h4>
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-sage hover:underline"
                          >
                            {org.website}
                          </a>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">URL Slug</h4>
                        <p className="text-sm font-mono text-muted-foreground">
                          proofound.com/o/{org.slug}
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Team Tab */}
                <TabsContent value="team" className="space-y-6">
                  <Card className="p-8 border-2 text-center">
                    <Users
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: 'rgb(122, 146, 120)' }}
                    />
                    <h3 className="text-2xl font-display font-semibold mb-2">Team Members</h3>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-4">
                      View and manage your organization members. Add team members to collaborate and
                      build together.
                    </p>
                    {canEdit && (
                      <Button
                        className="rounded-full"
                        style={{
                          backgroundColor: 'rgb(122, 146, 120)',
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Invite Team Members
                      </Button>
                    )}
                  </Card>
                </TabsContent>

                {/* Network Tab */}
                <TabsContent value="network">
                  <Card className="p-8 border-2">
                    <div className="text-center mb-8">
                      <Network
                        className="w-16 h-16 mx-auto mb-4"
                        style={{ color: 'rgb(122, 146, 120)' }}
                      />
                      <h3 className="text-2xl font-display font-semibold mb-2">Living Network</h3>
                      <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Your network is fluid and dynamic. Connections that no longer hold mutual
                        value naturally dissolve, ensuring your network always reflects authentic,
                        active relationships.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <Users
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ color: 'rgb(122, 146, 120)' }}
                        />
                        <p className="text-sm text-muted-foreground mb-1">People</p>
                        <p className="text-2xl font-semibold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <Building2
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ color: 'rgb(198, 123, 92)' }}
                        />
                        <p className="text-sm text-muted-foreground mb-1">Organizations</p>
                        <p className="text-2xl font-semibold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <Globe
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ color: 'rgb(92, 139, 137)' }}
                        />
                        <p className="text-sm text-muted-foreground mb-1">Partners</p>
                        <p className="text-2xl font-semibold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        className="rounded-full"
                        style={{
                          backgroundColor: 'rgb(122, 146, 120)',
                        }}
                      >
                        <Network className="w-4 h-4 mr-2" />
                        Visualize Network Graph
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        See how your connections relate to each other and discover new collaboration
                        opportunities
                      </p>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
