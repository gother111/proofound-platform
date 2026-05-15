import { Award, BookOpen, Briefcase, CheckCircle2, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { ProfileData } from '@/types/profile';

type ProfileSidebarProps = {
  profile: ProfileData;
};

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const contextCount =
    profile.experiences.length + profile.education.length + profile.volunteering.length;
  const proofCount = profile.anchoredProofPackCount ?? profile.proofArtifactCount ?? 0;
  const verificationCount = profile.acceptedVerificationCount ?? 0;

  const readinessItems = [
    {
      label: 'Safe shell',
      detail: profile.basicInfo.name && profile.guidedSetup.handle ? 'Ready' : 'Needs basics',
      ready: Boolean(profile.basicInfo.name && profile.guidedSetup.handle),
      icon: ShieldCheck,
    },
    {
      label: 'Context',
      detail:
        contextCount > 0
          ? `${contextCount} context item${contextCount === 1 ? '' : 's'}`
          : 'Add work, learning, or volunteering',
      ready: contextCount > 0,
      icon: Briefcase,
    },
    {
      label: 'Proof',
      detail:
        proofCount > 0
          ? `${proofCount} anchored proof pack${proofCount === 1 ? '' : 's'}`
          : 'Add your first proof',
      ready: proofCount > 0,
      icon: Award,
    },
    {
      label: 'Verification',
      detail:
        verificationCount > 0
          ? `${verificationCount} accepted verification${verificationCount === 1 ? '' : 's'}`
          : 'Request scoped verification',
      ready: verificationCount > 0,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-proofound-stone bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-proofound-forest" />
          <h3 className="font-display text-base font-medium text-proofound-charcoal">
            Proof readiness
          </h3>
        </div>
        <div className="space-y-3">
          {readinessItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-full p-1.5 ${
                    item.ready
                      ? 'bg-proofound-forest/10 text-proofound-forest'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-2xl border-proofound-stone bg-japandi-bg/70 p-5">
        <p className="text-sm font-medium text-proofound-charcoal">Profile emphasis</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Individual MVP profiles are built from proof, context, skills, freshness, and scoped
          verification.
        </p>
      </Card>
    </div>
  );
}
