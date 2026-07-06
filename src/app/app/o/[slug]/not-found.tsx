import Link from 'next/link';
import { Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

export default function OrgNotFound() {
  return (
    <section
      aria-labelledby="organization-workspace-unavailable-title"
      className="flex min-h-full items-center justify-center bg-proofound-parchment px-4 py-10"
    >
      <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
            <Building2 className="h-6 w-6 text-proofound-forest" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-proofound-forest">
            Organization workspace
          </p>
          <h1
            id="organization-workspace-unavailable-title"
            className="font-display text-2xl font-semibold leading-tight tracking-tight text-proofound-charcoal"
          >
            Organization workspace unavailable
          </h1>
          <CardDescription className="leading-6 text-proofound-charcoal/70">
            This workspace is not available to your current account. It may be private, retired, or
            require a different organization role. No proof, assignment, or organization data is
            exposed from this state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/app/i/home">Return to individual home</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
