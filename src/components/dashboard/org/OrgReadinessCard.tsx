'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OrganizationReadiness } from '@/lib/momentum/types';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';

interface OrgReadinessCardProps {
  orgRef: string;
  initialData?: any;
}

export function OrgReadinessCard({ orgRef, initialData }: OrgReadinessCardProps) {
  const [data, setData] = useState<OrganizationReadiness | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await fetch(`/api/org/readiness?org=${encodeURIComponent(orgRef)}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to load org readiness');
        const payload = (await response.json()) as OrganizationReadiness;
        setData(payload);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgRef, initialData]);

  if (loading || !data) {
    return (
      <Card className="p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <p className="text-sm text-muted-foreground">Loading readiness insights...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-proofound-forest" />
            Assignment Readiness
          </h3>
          <p className="text-sm text-muted-foreground">
            {data.marketActivityLow
              ? 'Candidate volume is currently low. Improve readiness to increase conversion as volume grows.'
              : 'Your pipeline has activity. Tighten readiness checks to improve shortlist quality.'}
          </p>
        </div>
        <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
          Score {data.readinessScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {data.scoreBreakdown.map((item) => (
          <div key={item.key} className="rounded-lg border border-proofound-stone bg-white p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold text-foreground">
              {item.score}/{item.maxScore}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Talent Availability Insight</p>
        {data.talentAvailabilityInsights.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active assignment skill demand yet.</p>
        ) : (
          <div className="space-y-2">
            {data.talentAvailabilityInsights.slice(0, 4).map((item) => (
              <div
                key={item.skillCode}
                className="rounded-lg border border-proofound-stone p-2 text-xs"
              >
                <p className="text-foreground font-medium">{item.skillName}</p>
                <p className="text-muted-foreground">
                  Required by {item.requiredByAssignments} assignment(s) • {item.availableProfiles}{' '}
                  profile(s) available • {item.signal}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Next Best Org Actions</p>
        {data.topActions.length === 0 ? (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-proofound-forest" />
            No urgent actions.
          </div>
        ) : (
          <div className="space-y-2">
            {data.topActions.map((action) => (
              <Link
                key={action.id}
                href={action.actionUrl}
                className="block rounded-lg border border-proofound-stone p-2 hover:border-proofound-forest hover:bg-japandi-bg"
              >
                <p className="text-sm font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pt-1">
        <Link
          href={`/app/o/${orgRef}/assignments`}
          className="inline-flex items-center gap-1 text-sm text-proofound-forest hover:underline"
        >
          Open assignments <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
