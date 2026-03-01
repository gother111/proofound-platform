export const INDUSTRY_OPTIONS = [
  {
    key: 'agriculture_forestry_and_fishing',
    label: 'Agriculture, forestry and fishing',
  },
  {
    key: 'mining_and_quarrying',
    label: 'Mining and quarrying',
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
  },
  {
    key: 'electricity_gas_steam_and_air_conditioning_supply',
    label: 'Electricity, gas, steam and air conditioning supply',
  },
  {
    key: 'water_supply_sewerage_waste_management_and_remediation_activities',
    label: 'Water supply; sewerage, waste management and remediation activities',
  },
  {
    key: 'construction',
    label: 'Construction',
  },
  {
    key: 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles',
    label: 'Wholesale and retail trade; repair of motor vehicles and motorcycles',
  },
  {
    key: 'transportation_and_storage',
    label: 'Transportation and storage',
  },
  {
    key: 'accommodation_and_food_service_activities',
    label: 'Accommodation and food service activities',
  },
  {
    key: 'information_and_communication',
    label: 'Information and communication',
  },
  {
    key: 'financial_and_insurance_activities',
    label: 'Financial and insurance activities',
  },
  {
    key: 'real_estate_activities',
    label: 'Real estate activities',
  },
  {
    key: 'professional_scientific_and_technical_activities',
    label: 'Professional, scientific and technical activities',
  },
  {
    key: 'administrative_and_support_service_activities',
    label: 'Administrative and support service activities',
  },
  {
    key: 'public_administration_and_defence_compulsory_social_security',
    label: 'Public administration and defence; compulsory social security',
  },
  {
    key: 'education',
    label: 'Education',
  },
  {
    key: 'human_health_and_social_work_activities',
    label: 'Human health and social work activities',
  },
  {
    key: 'arts_entertainment_and_recreation',
    label: 'Arts, entertainment and recreation',
  },
  {
    key: 'other_service_activities',
    label: 'Other service activities',
  },
] as const;

export type IndustryOption = (typeof INDUSTRY_OPTIONS)[number];
export type IndustryKey = IndustryOption['key'];

export const INDUSTRY_KEYS = INDUSTRY_OPTIONS.map((option) => option.key) as IndustryKey[];

export const DEFAULT_INDUSTRY_KEY: IndustryKey = 'other_service_activities';
export const DEFAULT_INDUSTRY_LABEL = 'Other service activities';

const INDUSTRY_KEY_SET = new Set<string>(INDUSTRY_KEYS);

const INDUSTRY_KEY_TO_LABEL = new Map<IndustryKey, string>(
  INDUSTRY_OPTIONS.map((option) => [option.key, option.label])
);

function normalizeInput(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’']/g, "'");
}

const LEGACY_INDUSTRY_ALIAS_TO_KEY: Record<string, IndustryKey> = {
  technology: 'information_and_communication',
  tech: 'information_and_communication',
  'information technology': 'information_and_communication',
  it: 'information_and_communication',
  finance: 'financial_and_insurance_activities',
  fintech: 'financial_and_insurance_activities',
  banking: 'financial_and_insurance_activities',
  healthcare: 'human_health_and_social_work_activities',
  health: 'human_health_and_social_work_activities',
  medtech: 'human_health_and_social_work_activities',
  education: 'education',
  edtech: 'education',
  government: 'public_administration_and_defence_compulsory_social_security',
  public: 'public_administration_and_defence_compulsory_social_security',
  nonprofit: 'other_service_activities',
  'non-profit': 'other_service_activities',
  ngo: 'other_service_activities',
  manufacturing: 'manufacturing',
  retail: 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles',
  commerce: 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles',
  transportation: 'transportation_and_storage',
  logistics: 'transportation_and_storage',
  media: 'information_and_communication',
  communications: 'information_and_communication',
  energy: 'electricity_gas_steam_and_air_conditioning_supply',
  utilities: 'electricity_gas_steam_and_air_conditioning_supply',
  'real estate': 'real_estate_activities',
  'professional services': 'professional_scientific_and_technical_activities',
  consulting: 'professional_scientific_and_technical_activities',
  administration: 'administrative_and_support_service_activities',
  hospitality: 'accommodation_and_food_service_activities',
  agriculture: 'agriculture_forestry_and_fishing',
  mining: 'mining_and_quarrying',
  construction: 'construction',
  arts: 'arts_entertainment_and_recreation',
  entertainment: 'arts_entertainment_and_recreation',
};

const INDUSTRY_LABEL_TO_KEY = new Map<string, IndustryKey>(
  INDUSTRY_OPTIONS.map((option) => [normalizeInput(option.label), option.key])
);

for (const [alias, key] of Object.entries(LEGACY_INDUSTRY_ALIAS_TO_KEY)) {
  INDUSTRY_LABEL_TO_KEY.set(normalizeInput(alias), key);
}

export function isIndustryKey(value: unknown): value is IndustryKey {
  return typeof value === 'string' && INDUSTRY_KEY_SET.has(value);
}

export function getIndustryLabelForKey(key: IndustryKey): string {
  return INDUSTRY_KEY_TO_LABEL.get(key) || DEFAULT_INDUSTRY_LABEL;
}

export function mapIndustryValueToCanonical(value: unknown): {
  industryKey: IndustryKey;
  industryLabel: string;
  legacyText: string | null;
  mappedFromInput: boolean;
} {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      industryKey: DEFAULT_INDUSTRY_KEY,
      industryLabel: DEFAULT_INDUSTRY_LABEL,
      legacyText: null,
      mappedFromInput: false,
    };
  }

  const trimmed = value.trim();
  if (isIndustryKey(trimmed)) {
    return {
      industryKey: trimmed,
      industryLabel: getIndustryLabelForKey(trimmed),
      legacyText: null,
      mappedFromInput: true,
    };
  }
  const normalized = normalizeInput(trimmed);
  const matched = INDUSTRY_LABEL_TO_KEY.get(normalized);

  if (!matched) {
    return {
      industryKey: DEFAULT_INDUSTRY_KEY,
      industryLabel: DEFAULT_INDUSTRY_LABEL,
      legacyText: trimmed,
      mappedFromInput: false,
    };
  }

  return {
    industryKey: matched,
    industryLabel: getIndustryLabelForKey(matched),
    legacyText: normalizeInput(getIndustryLabelForKey(matched)) === normalized ? null : trimmed,
    mappedFromInput: true,
  };
}

export function resolveIndustryFromInputs(input: {
  industryKey?: unknown;
  industryLabel?: unknown;
  legacyIndustry?: unknown;
}): {
  industryKey: IndustryKey;
  industryLabel: string;
  legacyText: string | null;
} {
  if (isIndustryKey(input.industryKey)) {
    return {
      industryKey: input.industryKey,
      industryLabel: getIndustryLabelForKey(input.industryKey),
      legacyText:
        typeof input.legacyIndustry === 'string' && input.legacyIndustry.trim().length > 0
          ? input.legacyIndustry.trim()
          : null,
    };
  }

  if (typeof input.industryLabel === 'string' && input.industryLabel.trim().length > 0) {
    const mapped = mapIndustryValueToCanonical(input.industryLabel);
    return {
      industryKey: mapped.industryKey,
      industryLabel: mapped.industryLabel,
      legacyText: mapped.legacyText,
    };
  }

  if (typeof input.legacyIndustry === 'string' && input.legacyIndustry.trim().length > 0) {
    const mapped = mapIndustryValueToCanonical(input.legacyIndustry);
    return {
      industryKey: mapped.industryKey,
      industryLabel: mapped.industryLabel,
      legacyText: mapped.legacyText,
    };
  }

  return {
    industryKey: DEFAULT_INDUSTRY_KEY,
    industryLabel: DEFAULT_INDUSTRY_LABEL,
    legacyText: null,
  };
}

export function mapIndustryListToCanonical(values: unknown): {
  keys: IndustryKey[];
  labels: string[];
  legacy: string[];
} {
  if (!Array.isArray(values) || values.length === 0) {
    return { keys: [], labels: [], legacy: [] };
  }

  const keys: IndustryKey[] = [];
  const labels: string[] = [];
  const legacy: string[] = [];
  const keySet = new Set<IndustryKey>();
  const legacySet = new Set<string>();

  for (const entry of values) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      continue;
    }

    const mapped = mapIndustryValueToCanonical(entry);
    if (!keySet.has(mapped.industryKey)) {
      keySet.add(mapped.industryKey);
      keys.push(mapped.industryKey);
      labels.push(mapped.industryLabel);
    }

    if (mapped.legacyText && !legacySet.has(mapped.legacyText)) {
      legacySet.add(mapped.legacyText);
      legacy.push(mapped.legacyText);
    }
  }

  return { keys, labels, legacy };
}
