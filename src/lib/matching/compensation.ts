export type CompensationPeriod = 'annual' | 'monthly' | 'hourly';

const ANNUALIZATION_FACTORS: Record<CompensationPeriod, number> = {
  annual: 1,
  monthly: 12,
  hourly: 2000,
};

function resolveAnnualizationFactor(period: string | null | undefined): number {
  if (period === 'monthly') {
    return ANNUALIZATION_FACTORS.monthly;
  }
  if (period === 'hourly') {
    return ANNUALIZATION_FACTORS.hourly;
  }
  return ANNUALIZATION_FACTORS.annual;
}

export function toAnnualCompensationRange(input: {
  min: number | null | undefined;
  max: number | null | undefined;
  period?: string | null;
}): { min: number; max: number } | null {
  const { min, max, period } = input;
  if (min == null || max == null) {
    return null;
  }

  const factor = resolveAnnualizationFactor(period);
  return {
    min: Math.round(min * factor),
    max: Math.round(max * factor),
  };
}
