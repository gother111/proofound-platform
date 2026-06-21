export type OrgTrustReadinessItem = {
  key: 'name' | 'whyWorkMatters' | 'mission' | 'operatingContext' | 'domainPath';
  label: string;
  detail: string;
  ready: boolean;
};

type OrgTrustReadinessInput = {
  displayName?: string | null;
  whyWorkMatters?: string | null;
  mission?: string | null;
  operatingContext?: string | null;
  domainPathDetail?: string | null;
  domainReady?: boolean;
};

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function valueOrFallback(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function buildOrgTrustReadiness({
  displayName,
  whyWorkMatters,
  mission,
  operatingContext,
  domainPathDetail,
  domainReady = false,
}: OrgTrustReadinessInput): OrgTrustReadinessItem[] {
  return [
    {
      key: 'name',
      label: 'Organization name',
      detail: valueOrFallback(displayName, 'Add the organization name.'),
      ready: hasValue(displayName),
    },
    {
      key: 'whyWorkMatters',
      label: 'Why work matters',
      detail: valueOrFallback(whyWorkMatters, 'Add a short reason this work matters.'),
      ready: hasValue(whyWorkMatters),
    },
    {
      key: 'mission',
      label: 'Mission',
      detail: valueOrFallback(mission, 'Add the mission this assignment path supports.'),
      ready: hasValue(mission),
    },
    {
      key: 'operatingContext',
      label: 'Operating context',
      detail: valueOrFallback(
        operatingContext,
        'Add the real operating context reviewers should understand.'
      ),
      ready: hasValue(operatingContext),
    },
    {
      key: 'domainPath',
      label: 'Verified domain path',
      detail: valueOrFallback(
        domainPathDetail,
        domainReady ? 'Verified organization signal is present.' : 'Needs verified domain signal.'
      ),
      ready: domainReady,
    },
  ];
}

export function countReadyTrustItems(items: OrgTrustReadinessItem[]) {
  return items.filter((item) => item.ready).length;
}
