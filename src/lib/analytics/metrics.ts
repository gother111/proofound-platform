/**
 * Metrics Calculation Functions
 * 
 * Calculates core MVP metrics:
 * - TTFQI: Time to First Qualified Introduction
 * - TTV: Time to Value (first meaningful step)
 * - TTSC: Time to Signed Contract
 * - PAC Lift: Purpose-Alignment Contribution lift
 * - Fairness Gap: Demographic-based fairness checks
 */

/**
 * Calculate Time to First Qualified Introduction (TTFQI)
 * 
 * @param userId - User ID
 * @returns Time in hours from profile activation to first qualified intro, or null
 */
export async function calculateTTFQI(userId: string): Promise<number | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  // 1. Get profile activation timestamp
  const { data: profile } = await supabase
    .from('individual_profiles')
    .select('joined_date')
    .eq('user_id', userId)
    .single();
  
  if (!profile?.joined_date) {
    return null;
  }
  
  // 2. Get first match action event (introduce)
  const { data: introEvent } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('event_type', 'match_actioned')
    .contains('properties', { action: 'introduce' })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (!introEvent) {
    return null;
  }
  
  // 3. Calculate difference in hours
  const activationTime = new Date(profile.joined_date).getTime();
  const introTime = new Date(introEvent.created_at).getTime();
  const hoursDiff = (introTime - activationTime) / (1000 * 60 * 60);
  
  return Math.round(hoursDiff * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Time to Value (TTV)
 * 
 * @param userId - User ID
 * @returns Time in days from activation to first meaningful step (interview scheduled)
 */
export async function calculateTTV(userId: string): Promise<number | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  // 1. Get profile activation timestamp
  const { data: profile } = await supabase
    .from('individual_profiles')
    .select('joined_date')
    .eq('user_id', userId)
    .single();
  
  if (!profile?.joined_date) {
    return null;
  }
  
  // 2. Get first interview scheduled event
  const { data: interviewEvent } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('event_type', 'interview_scheduled')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (!interviewEvent) {
    return null;
  }
  
  // 3. Calculate difference in days
  const activationTime = new Date(profile.joined_date).getTime();
  const interviewTime = new Date(interviewEvent.created_at).getTime();
  const daysDiff = (interviewTime - activationTime) / (1000 * 60 * 60 * 24);
  
  return Math.round(daysDiff * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Time to Signed Contract (TTSC)
 * 
 * @param userId - User ID
 * @returns Time in days from activation to signed contract
 */
export async function calculateTTSC(userId: string): Promise<number | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  // 1. Get profile activation timestamp
  const { data: profile } = await supabase
    .from('individual_profiles')
    .select('joined_date')
    .eq('user_id', userId)
    .single();
  
  if (!profile?.joined_date) {
    return null;
  }
  
  // 2. Get contract signed event
  const { data: contractEvent } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('event_type', 'contract_signed')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (!contractEvent) {
    return null;
  }
  
  // 3. Calculate difference in days
  const activationTime = new Date(profile.joined_date).getTime();
  const contractTime = new Date(contractEvent.created_at).getTime();
  const daysDiff = (contractTime - activationTime) / (1000 * 60 * 60 * 24);
  
  return Math.round(daysDiff * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Purpose-Alignment Contribution (PAC) Lift
 * 
 * @returns Percentage lift in acceptance/contract rates for high-PAC matches
 */
export async function calculatePACLift(): Promise<{ lift: number; confidence: number }> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  // 1. Get all matches with scores (PAC is in the vector JSON)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, vector, created_at');
  
  if (!matches || matches.length < 40) {
    // Need at least 40 matches for statistical significance (10 per quartile)
    return { lift: 0, confidence: 0 };
  }
  
  // Extract PAC scores and sort
  const matchesWithPAC = matches
    .map(m => ({
      id: m.id,
      pac: (m.vector as any)?.pac || 0,
    }))
    .sort((a, b) => b.pac - a.pac);
  
  const quartileSize = Math.floor(matchesWithPAC.length / 4);
  
  // 2. Split into high-PAC (top 25%) and low-PAC (bottom 25%)
  const highPACMatches = matchesWithPAC.slice(0, quartileSize);
  const lowPACMatches = matchesWithPAC.slice(-quartileSize);
  
  // 3. Calculate acceptance/contract rates
  const highPACIds = highPACMatches.map(m => m.id);
  const lowPACIds = lowPACMatches.map(m => m.id);
  
  const { data: highPACActions } = await supabase
    .from('analytics_events')
    .select('entity_id')
    .in('entity_id', highPACIds)
    .eq('event_type', 'match_actioned')
    .contains('properties', { action: 'introduce' });
  
  const { data: lowPACActions } = await supabase
    .from('analytics_events')
    .select('entity_id')
    .in('entity_id', lowPACIds)
    .eq('event_type', 'match_actioned')
    .contains('properties', { action: 'introduce' });
  
  const highPACRate = (highPACActions?.length || 0) / highPACIds.length;
  const lowPACRate = (lowPACActions?.length || 0) / lowPACIds.length;
  
  // 4. Calculate lift percentage
  const lift = lowPACRate > 0 ? ((highPACRate - lowPACRate) / lowPACRate) * 100 : 0;
  
  // 5. Calculate confidence (simple standard error approximation)
  const se = Math.sqrt(
    (highPACRate * (1 - highPACRate)) / highPACIds.length +
    (lowPACRate * (1 - lowPACRate)) / lowPACIds.length
  );
  const confidence = Math.min(100, Math.max(0, (1 - se * 2) * 100)); // ~95% CI
  
  return { 
    lift: Math.round(lift * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Calculate Fairness Gap
 * 
 * @param cohortA - Cohort identifier (e.g., 'female')
 * @param cohortB - Cohort identifier (e.g., 'male')
 * @returns Fairness gap between cohorts (negative = cohort A disadvantaged)
 */
export async function calculateFairnessGap(
  cohortA: string,
  cohortB: string
): Promise<{ introGap: number; contractGap: number; sampleSize: { a: number; b: number } }> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  // Note: This is a placeholder implementation
  // In production, demographic data should be:
  // 1. Opt-in only
  // 2. Stored separately with strict access controls
  // 3. Anonymized for analysis
  
  // For MVP, we'll use a simplified approach checking profile metadata
  const { data: profilesA } = await supabase
    .from('individual_profiles')
    .select('user_id')
    .contains('values', [{ demographic_cohort: cohortA }]);
  
  const { data: profilesB } = await supabase
    .from('individual_profiles')
    .select('user_id')
    .contains('values', [{ demographic_cohort: cohortB }]);
  
  if (!profilesA || !profilesB || profilesA.length < 10 || profilesB.length < 10) {
    // Need minimum sample size
    return { 
      introGap: 0, 
      contractGap: 0, 
      sampleSize: { 
        a: profilesA?.length || 0, 
        b: profilesB?.length || 0,
      },
    };
  }
  
  const userIdsA = profilesA.map(p => p.user_id);
  const userIdsB = profilesB.map(p => p.user_id);
  
  // Calculate intro rates
  const { data: introsA } = await supabase
    .from('analytics_events')
    .select('user_id')
    .in('user_id', userIdsA)
    .eq('event_type', 'match_actioned')
    .contains('properties', { action: 'introduce' });
  
  const { data: introsB } = await supabase
    .from('analytics_events')
    .select('user_id')
    .in('user_id', userIdsB)
    .eq('event_type', 'match_actioned')
    .contains('properties', { action: 'introduce' });
  
  const introRateA = (introsA?.length || 0) / userIdsA.length;
  const introRateB = (introsB?.length || 0) / userIdsB.length;
  
  // Calculate contract rates
  const { data: contractsA } = await supabase
    .from('analytics_events')
    .select('user_id')
    .in('user_id', userIdsA)
    .eq('event_type', 'contract_signed');
  
  const { data: contractsB } = await supabase
    .from('analytics_events')
    .select('user_id')
    .in('user_id', userIdsB)
    .eq('event_type', 'contract_signed');
  
  const contractRateA = (contractsA?.length || 0) / userIdsA.length;
  const contractRateB = (contractsB?.length || 0) / userIdsB.length;
  
  // Calculate gaps (A rate - B rate)
  // Negative = cohort A disadvantaged
  const introGap = introRateA - introRateB;
  const contractGap = contractRateA - contractRateB;
  
  return { 
    introGap: Math.round(introGap * 10000) / 10000, // 4 decimal places
    contractGap: Math.round(contractGap * 10000) / 10000,
    sampleSize: { 
      a: userIdsA.length, 
      b: userIdsB.length,
    },
  };
}

/**
 * Get Cohort Metrics Summary
 * 
 * @param cohortType - Type of cohort (role_family, seniority, region)
 * @returns Median TTFQI, TTV, TTSC for the cohort
 */
export async function getCohortMetrics(cohortType: string): Promise<{
  ttfqi: { median: number; p75: number };
  ttv: { median: number; p75: number };
  ttsc: { median: number; p75: number };
}> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  // 1. Get all active individual profiles (simplified - in production would filter by cohort)
  const { data: profiles } = await supabase
    .from('individual_profiles')
    .select('user_id');
  
  if (!profiles || profiles.length === 0) {
    return {
      ttfqi: { median: 0, p75: 0 },
      ttv: { median: 0, p75: 0 },
      ttsc: { median: 0, p75: 0 },
    };
  }
  
  // 2. Calculate individual metrics for a sample (limit for performance)
  const sampleSize = Math.min(profiles.length, 100);
  const ttfqiValues: number[] = [];
  const ttvValues: number[] = [];
  const ttscValues: number[] = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const userId = profiles[i].user_id;
    
    const ttfqi = await calculateTTFQI(userId);
    if (ttfqi !== null) ttfqiValues.push(ttfqi);
    
    const ttv = await calculateTTV(userId);
    if (ttv !== null) ttvValues.push(ttv);
    
    const ttsc = await calculateTTSC(userId);
    if (ttsc !== null) ttscValues.push(ttsc);
  }
  
  // 3. Helper function to calculate median and P75
  const getPercentiles = (values: number[]) => {
    if (values.length === 0) return { median: 0, p75: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const medianIdx = Math.floor(sorted.length * 0.5);
    const p75Idx = Math.floor(sorted.length * 0.75);
    
    return {
      median: Math.round(sorted[medianIdx] * 100) / 100,
      p75: Math.round(sorted[p75Idx] * 100) / 100,
    };
  };
  
  // 4. Return aggregated metrics
  return {
    ttfqi: getPercentiles(ttfqiValues),
    ttv: getPercentiles(ttvValues),
    ttsc: getPercentiles(ttscValues),
  };
}

