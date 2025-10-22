'use client';

import { createContext, useContext } from 'react';

type OrgCtx = { orgId: string; slug: string; canEdit: boolean };

const OrgContext = createContext<OrgCtx | null>(null);

export function OrgContextProvider({
  value,
  children,
}: {
  value: OrgCtx;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext() {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error('OrgContext missing');
  }
  return ctx;
}

export function useOptionalOrgContext() {
  try {
    return useOrgContext();
  } catch (error) {
    if (error instanceof Error && error.message === 'OrgContext missing') {
      return null;
    }
    throw error;
  }
}
