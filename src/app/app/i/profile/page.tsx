import { requireAuth } from '@/lib/auth';
import { getProfileShellData } from '@/actions/profile-shell';
import { DeferredEditableProfileView } from '@/components/profile/DeferredEditableProfileView';

type IndividualProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IndividualProfilePage({ searchParams }: IndividualProfilePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const profileView = getFirstSearchParam(resolvedSearchParams.profileView);

  if (profileView === 'full') {
    await requireAuth();
    return <DeferredEditableProfileView />;
  }

  const initialProfile = await getProfileShellData();

  return (
    <DeferredEditableProfileView initialProfile={initialProfile} refreshInitialProfile={true} />
  );
}
