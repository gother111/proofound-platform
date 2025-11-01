/**
 * LinkedIn Third-Party Enrichment Library
 *
 * Optional integration with third-party services like Proxycurl
 * for additional LinkedIn profile data.
 *
 * Proxycurl offers a free tier: https://nubela.co/proxycurl/
 */

export interface ProxycurlProfile {
  public_identifier: string;
  profile_pic_url: string;
  first_name: string;
  last_name: string;
  headline: string;
  summary: string;
  connections: number | null;
  experiences: Array<{
    title: string;
    company: string;
    starts_at: { year: number; month?: number };
    ends_at: { year: number; month?: number } | null;
  }>;
  education: any[];
  certifications: any[];
  accomplishments: any[];
  has_verified_badge: boolean; // KEY FIELD
}

export interface EnrichmentResult {
  success: boolean;
  hasVerificationBadge?: boolean;
  connectionCount?: number;
  experienceCount?: number;
  profileData?: Partial<ProxycurlProfile>;
  error?: string;
  source: 'proxycurl' | 'error';
}

/**
 * Enrich LinkedIn profile data using Proxycurl API
 *
 * Requires PROXYCURL_API_KEY environment variable
 */
export async function enrichWithProxycurl(linkedinUrl: string): Promise<EnrichmentResult> {
  const apiKey = process.env.PROXYCURL_API_KEY;

  if (!apiKey) {
    console.warn('Proxycurl API key not configured, skipping enrichment');
    return {
      success: false,
      error: 'API key not configured',
      source: 'error',
    };
  }

  try {
    const response = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Proxycurl API error: ${response.status}`);
    }

    const data: ProxycurlProfile = await response.json();

    return {
      success: true,
      hasVerificationBadge: data.has_verified_badge || false,
      connectionCount: data.connections || undefined,
      experienceCount: data.experiences?.length || 0,
      profileData: data,
      source: 'proxycurl',
    };
  } catch (error) {
    console.error('Proxycurl enrichment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'error',
    };
  }
}

/**
 * Check if Proxycurl enrichment is available (API key configured)
 */
export function isProxycurlAvailable(): boolean {
  return !!process.env.PROXYCURL_API_KEY;
}

/**
 * Enrich profile with multiple sources (can add more services here)
 *
 * Tries services in order and returns first successful enrichment
 */
export async function enrichLinkedInProfile(linkedinUrl: string): Promise<EnrichmentResult | null> {
  // Try Proxycurl first
  if (isProxycurlAvailable()) {
    const result = await enrichWithProxycurl(linkedinUrl);
    if (result.success) {
      return result;
    }
  }

  // Could add more services here (PhantomBuster, RapidAPI, etc.)
  // For now, just return null if no enrichment available
  return null;
}

/**
 * Combine automated check with enrichment data
 *
 * Takes results from both scraper and enrichment API,
 * combines them with weighted confidence
 */
export function combineVerificationData(
  automatedCheck: {
    confidence: number;
    signals: { hasVerificationBadge: boolean };
  },
  enrichmentData: EnrichmentResult | null
): {
  finalConfidence: number;
  hasVerificationBadge: boolean;
  sources: string[];
} {
  let finalConfidence = automatedCheck.confidence;
  let hasVerificationBadge = automatedCheck.signals.hasVerificationBadge;
  const sources = ['playwright'];

  // If we have enrichment data, combine it
  if (enrichmentData && enrichmentData.success) {
    sources.push(enrichmentData.source);

    // If enrichment confirms verification badge, boost confidence
    if (enrichmentData.hasVerificationBadge) {
      hasVerificationBadge = true;
      // Boost confidence if both sources agree
      if (automatedCheck.signals.hasVerificationBadge) {
        finalConfidence = Math.min(finalConfidence + 10, 100);
      } else {
        // Enrichment found badge but scraper didn't - moderate boost
        finalConfidence = Math.min(finalConfidence + 20, 95);
      }
    }

    // Use enrichment connection count if higher than estimated
    if (enrichmentData.connectionCount && enrichmentData.connectionCount >= 500) {
      finalConfidence = Math.min(finalConfidence + 5, 100);
    }
  }

  return {
    finalConfidence,
    hasVerificationBadge,
    sources,
  };
}
