'use client';

import { createContext, useContext } from 'react';

export type OrgContextValue = {
  orgId: string;
  slug: string;
  displayName: string;
  canEdit: boolean;
};

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgContextProvider({
  value,
  children,
}: {
  value: OrgContextValue;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext() {
  const context = useContext(OrgContext);

  if (!context) {
    throw new Error('useOrgContext must be used within an OrgContextProvider');
  }

  return context;
}

export function useOptionalOrgContext() {
  return useContext(OrgContext) ?? null;
}
