/**
 * LinkedIn Profile Scraper using Playwright
 * 
 * Automatically analyzes LinkedIn profiles to detect identity verification badges
 * and other trust signals. Free and fast (5-10 seconds per check).
 */

import { chromium, type Browser, type Page } from 'playwright';

export interface LinkedInSignals {
  hasVerificationBadge: boolean;
  connectionCount: number | null;
  experienceCount: number;
  profileCompleteness: number; // 0-100
  hasProfilePhoto: boolean;
  accountAge: 'new' | 'medium' | 'old'; // Estimated from profile
}

export interface AutomatedCheckResult {
  success: boolean;
  signals?: LinkedInSignals;
  confidence?: number;
  recommendation?: 'approve' | 'review_manually' | 'reject';
  checkedAt: string;
  error?: string;
}

/**
 * Main function: Check LinkedIn profile for verification badge and trust signals
 */
export async function checkLinkedInVerification(
  profileUrl: string
): Promise<AutomatedCheckResult> {
  let browser: Browser | null = null;
  
  try {
    // Launch headless browser
    browser = await chromium.launch({ 
      headless: true,
      timeout: 30000 
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    
    // Navigate to LinkedIn profile
    await page.goto(profileUrl, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    // Wait a moment for dynamic content to load
    await page.waitForTimeout(2000);
    
    // Extract all signals
    const signals: LinkedInSignals = {
      hasVerificationBadge: await detectVerificationBadge(page),
      connectionCount: await extractConnectionCount(page),
      experienceCount: await extractExperienceCount(page),
      profileCompleteness: await calculateProfileCompleteness(page),
      hasProfilePhoto: await hasProfilePhoto(page),
      accountAge: await estimateAccountAge(page),
    };
    
    // Calculate confidence score
    const confidence = calculateConfidenceScore(signals);
    
    // Generate recommendation
    const recommendation = generateRecommendation(signals, confidence);
    
    await browser.close();
    
    return {
      success: true,
      signals,
      confidence,
      recommendation,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    console.error('LinkedIn scraper error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Detect LinkedIn's official identity verification badge
 */
async function detectVerificationBadge(page: Page): Promise<boolean> {
  try {
    // LinkedIn uses various selectors for verification badges
    const selectors = [
      '[data-test-id="verification-badge"]',
      '.verification-badge',
      '[aria-label*="verified"]',
      '[aria-label*="Verified"]',
      'svg[data-test-icon="identity-verified"]',
      '.pv-member-badge__icon',
      '[data-test-member-badge="VERIFIED"]',
    ];
    
    for (const selector of selectors) {
      const isVisible = await page.locator(selector).isVisible().catch(() => false);
      if (isVisible) {
        return true;
      }
    }
    
    // Also check for text-based verification indicators
    const bodyText = await page.textContent('body').catch(() => '');
    const verificationTerms = ['identity verified', 'verified member', 'identity confirmation'];
    
    return verificationTerms.some(term => 
      bodyText?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error detecting verification badge:', error);
    return false;
  }
}

/**
 * Extract connection count from profile
 */
async function extractConnectionCount(page: Page): Promise<number | null> {
  try {
    // LinkedIn shows connections in various formats: "500+", "1,234", etc.
    const selectors = [
      '.pv-top-card--list-bullet li',
      '[data-test-id="connection-count"]',
      '.pv-top-card__connections',
      'span:has-text("connections")',
    ];
    
    for (const selector of selectors) {
      const elements = await page.locator(selector).all();
      
      for (const element of elements) {
        const text = await element.textContent().catch(() => '');
        if (!text) continue;
        
        // Match patterns like "500+ connections", "1,234 connections"
        const match = text.match(/(\d+[\d,]*)\+?\s*connections?/i);
        if (match) {
          const count = parseInt(match[1].replace(/,/g, ''), 10);
          if (!isNaN(count)) {
            return count;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting connection count:', error);
    return null;
  }
}

/**
 * Count experience entries on profile
 */
async function extractExperienceCount(page: Page): Promise<number> {
  try {
    const selectors = [
      '#experience ~ * li.pvs-list__paged-list-item',
      '.experience-section li',
      '[data-section="experience"] li',
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        return count;
      }
    }
    
    return 0;
  } catch (error) {
    console.error('Error extracting experience count:', error);
    return 0;
  }
}

/**
 * Calculate profile completeness score (0-100)
 */
async function calculateProfileCompleteness(page: Page): Promise<number> {
  let score = 0;
  
  try {
    // Profile photo (20 points)
    if (await hasProfilePhoto(page)) {
      score += 20;
    }
    
    // Headline (15 points)
    const hasHeadline = await page.locator('.text-body-medium').count() > 0;
    if (hasHeadline) {
      score += 15;
    }
    
    // About/Summary section (15 points)
    const hasAbout = await page.locator('#about').isVisible().catch(() => false);
    if (hasAbout) {
      score += 15;
    }
    
    // Experience section (20 points)
    const experienceCount = await extractExperienceCount(page);
    if (experienceCount > 0) {
      score += 20;
    }
    
    // Education section (15 points)
    const hasEducation = await page.locator('#education').isVisible().catch(() => false);
    if (hasEducation) {
      score += 15;
    }
    
    // Skills section (15 points)
    const hasSkills = await page.locator('#skills').isVisible().catch(() => false);
    if (hasSkills) {
      score += 15;
    }
    
    return score;
  } catch (error) {
    console.error('Error calculating profile completeness:', error);
    return 50; // Default to medium completeness on error
  }
}

/**
 * Check if profile has a photo
 */
async function hasProfilePhoto(page: Page): Promise<boolean> {
  try {
    const selectors = [
      '.pv-top-card-profile-picture__image',
      '[data-test-profile-photo]',
      'img[alt*="profile"]',
    ];
    
    for (const selector of selectors) {
      const isVisible = await page.locator(selector).isVisible().catch(() => false);
      if (isVisible) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Estimate account age based on profile indicators
 */
async function estimateAccountAge(page: Page): Promise<'new' | 'medium' | 'old'> {
  try {
    // Check experience entries - older accounts tend to have more history
    const experienceCount = await extractExperienceCount(page);
    
    // Check if profile has old dates (look for years in the past)
    const bodyText = await page.textContent('body').catch(() => '');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i - 1);
    const oldYearMatches = years.filter(year => 
      bodyText?.includes(year.toString())
    ).length;
    
    // Scoring logic
    if (experienceCount >= 4 || oldYearMatches >= 3) {
      return 'old'; // 5+ years
    } else if (experienceCount >= 2 || oldYearMatches >= 1) {
      return 'medium'; // 2-4 years
    } else {
      return 'new'; // < 2 years
    }
  } catch (error) {
    console.error('Error estimating account age:', error);
    return 'medium'; // Default to medium on error
  }
}

/**
 * Calculate overall confidence score (0-100)
 * Higher score = more confident the profile is legitimate
 */
function calculateConfidenceScore(signals: LinkedInSignals): number {
  let score = 0;
  
  // Verification badge is the strongest signal (50 points)
  if (signals.hasVerificationBadge) {
    score += 50;
  }
  
  // Connection count (15 points max)
  if (signals.connectionCount !== null) {
    if (signals.connectionCount >= 500) {
      score += 15;
    } else if (signals.connectionCount >= 200) {
      score += 12;
    } else if (signals.connectionCount >= 100) {
      score += 10;
    } else if (signals.connectionCount >= 50) {
      score += 5;
    }
  }
  
  // Profile completeness (15 points max)
  if (signals.profileCompleteness >= 90) {
    score += 15;
  } else if (signals.profileCompleteness >= 70) {
    score += 10;
  } else if (signals.profileCompleteness >= 50) {
    score += 5;
  }
  
  // Account age (10 points max)
  if (signals.accountAge === 'old') {
    score += 10;
  } else if (signals.accountAge === 'medium') {
    score += 5;
  }
  
  // Experience count (5 points max)
  if (signals.experienceCount >= 3) {
    score += 5;
  } else if (signals.experienceCount >= 2) {
    score += 3;
  } else if (signals.experienceCount >= 1) {
    score += 1;
  }
  
  // Profile photo (5 points)
  if (signals.hasProfilePhoto) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

/**
 * Generate recommendation based on signals and confidence
 */
function generateRecommendation(
  signals: LinkedInSignals,
  confidence: number
): 'approve' | 'review_manually' | 'reject' {
  // If verification badge detected and high confidence, recommend approval
  if (signals.hasVerificationBadge && confidence >= 80) {
    return 'approve';
  }
  
  // Medium confidence - needs manual review
  if (confidence >= 50) {
    return 'review_manually';
  }
  
  // Low confidence - recommend rejection
  return 'reject';
}

/**
 * Helper function to validate LinkedIn profile URL
 */
export function validateLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'www.linkedin.com' ||
      parsed.hostname === 'linkedin.com'
    ) && parsed.pathname.startsWith('/in/');
  } catch {
    return false;
  }
}

