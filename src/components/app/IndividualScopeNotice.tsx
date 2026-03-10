import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';

type IndividualScopeNoticeProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function IndividualScopeNotice({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref = '/app/i/home',
  secondaryLabel = 'Back to overview',
}: IndividualScopeNoticeProps) {
  return (
    <AppSurface>
      <div className="mx-auto max-w-3xl py-10">
        <Card className="border-proofound-stone/70">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-proofound-forest/80">
              Proof-First Launch
            </p>
            <CardTitle className="font-['Crimson_Pro'] text-3xl text-proofound-charcoal">
              {title}
            </CardTitle>
            <CardDescription className="max-w-2xl text-base text-proofound-charcoal/75">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="bg-proofound-forest hover:bg-proofound-forest/90">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppSurface>
  );
}
