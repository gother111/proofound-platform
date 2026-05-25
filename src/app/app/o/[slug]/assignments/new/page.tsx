import { DeferredAssignmentBuilderClient } from './DeferredAssignmentBuilderClient';

export const dynamic = 'force-dynamic';

type AssignmentBuilderPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AssignmentBuilderPage({ params }: AssignmentBuilderPageProps) {
  const { slug } = await params;

  return <DeferredAssignmentBuilderClient slug={slug} />;
}
