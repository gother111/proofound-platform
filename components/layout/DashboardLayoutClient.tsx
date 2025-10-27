"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userName?: string | null;
  accountType?: string | null;
}

export function DashboardLayoutClient({ children, userName, accountType }: DashboardLayoutClientProps) {
  const pathname = usePathname();

  // Don't show Navigation on /home since Dashboard component provides its own
  const showNavigation = pathname !== "/home";

  if (!showNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation
        userName={userName}
        accountType={accountType}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
