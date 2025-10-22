import { requireAuth } from '@/lib/auth';
import { LeftNav } from '@/components/app/LeftNav';
import { TopBar } from '@/components/app/TopBar';

export default async function IndividualLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  const userName = user.displayName || user.handle || 'User';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F3EE' }}>
      <LeftNav basePath="/i" />
      <div className="flex-1 flex flex-col">
        <TopBar userName={userName} userInitials={userInitials} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
