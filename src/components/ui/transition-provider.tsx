'use client';

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  // Route-level opacity transitions caused intermittent blank screens
  // during client-side navigation in App Router. Keep this container static.
  return <div className="w-full min-h-screen">{children}</div>;
}
