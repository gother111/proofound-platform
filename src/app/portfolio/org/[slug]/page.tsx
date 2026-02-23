import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, Building2, Sparkles } from 'lucide-react';
import { getPublicOrganizationPortfolioBySlug } from '@/lib/portfolio/public-organization';

const FALLBACK_SITE_URL = 'https://proofound.io';

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || FALLBACK_SITE_URL;
  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;

  try {
    return new URL(normalized).toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function toTitleCase(value: string | null) {
  if (!value) return null;
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export const dynamic = 'force-dynamic';

export default async function OrganizationPortfolioPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const portfolio = await getPublicOrganizationPortfolioBySlug(slug);

  if (!portfolio) {
    notFound();
  }

  const siteUrl = resolveSiteUrl();
  const publicUrl = `${siteUrl}/portfolio/org/${encodeURIComponent(portfolio.slug)}`;

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {portfolio.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portfolio.logoUrl}
                  alt={`${portfolio.displayName} logo`}
                  className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1C4D3A] text-white">
                  <Building2 className="h-7 w-7" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-900">{portfolio.displayName}</h1>
                  <Badge variant="outline">Public Portfolio</Badge>
                </div>
                {portfolio.tagline && <p className="text-sm text-slate-700">{portfolio.tagline}</p>}
                <p className="text-xs text-slate-500">{publicUrl}</p>
              </div>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4" />
              Build yours on Proofound
            </Link>
          </CardContent>
        </Card>

        {!portfolio.hasVisibleContent ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-10 text-center text-sm text-slate-600">
              This organization has not shared public details yet.
            </CardContent>
          </Card>
        ) : (
          <>
            {(portfolio.mission || portfolio.vision) && (
              <Card>
                <CardHeader>
                  <CardTitle>Purpose</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700">
                  {portfolio.mission && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mission
                      </p>
                      <p className="mt-1 whitespace-pre-line">{portfolio.mission}</p>
                    </div>
                  )}
                  {portfolio.vision && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vision
                      </p>
                      <p className="mt-1 whitespace-pre-line">{portfolio.vision}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {portfolio.causes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Causes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {portfolio.causes.map((cause) => (
                    <Badge key={cause} variant="secondary">
                      {cause}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {(portfolio.website || portfolio.foundedYear || portfolio.typeLabel) && (
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  {portfolio.website && (
                    <a
                      href={portfolio.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-slate-900"
                    >
                      <Globe2 className="h-4 w-4" />
                      {portfolio.website}
                    </a>
                  )}
                  {portfolio.foundedYear && <p>Founded {portfolio.foundedYear}</p>}
                  {portfolio.typeLabel && <p>Type: {toTitleCase(portfolio.typeLabel)}</p>}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
