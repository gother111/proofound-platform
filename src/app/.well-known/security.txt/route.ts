import {
  buildSecurityTxtBody,
  getSecurityTxtSiteUrl,
  securityTxtHeaders,
} from '@/lib/security-txt';

export const runtime = 'edge';

export async function GET() {
  const siteUrl = getSecurityTxtSiteUrl();

  return new Response(buildSecurityTxtBody(siteUrl), {
    status: 200,
    headers: securityTxtHeaders,
  });
}
