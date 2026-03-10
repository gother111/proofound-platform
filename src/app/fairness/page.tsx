import { ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Transparency Note | Proofound',
  description: 'Launch-safe note on fairness monitoring and privacy boundaries.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FairnessPage() {
  return (
    <div className="container max-w-3xl py-12">
      <Card className="border-proofound-stone/60">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-proofound-forest/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-proofound-forest">
            <ShieldCheck className="h-4 w-4" />
            Launch Transparency
          </div>
          <CardTitle className="text-3xl font-['Crimson_Pro'] text-proofound-charcoal">
            Fairness is monitored, not productized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Proofound launch does not expose a public fairness dashboard, public ranking analytics,
            or any public people index. Fairness review stays internal and privacy-safe.
          </p>
          <p>
            Optional demographic data, when present, is used only for internal fairness monitoring
            in aggregate. It is never shown to organizations and never used to publish public
            comparisons.
          </p>
          <p>
            The launch corridor remains proof-first, portfolio-first, privacy-first, and calm by
            design. If you need more detail about policy or data handling, contact the team through
            the support channel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
