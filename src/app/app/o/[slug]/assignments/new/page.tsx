import { DeferredAssignmentBuilderClient } from './DeferredAssignmentBuilderClient';

export const dynamic = 'force-dynamic';

export default async function AssignmentBuilderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <DeferredAssignmentBuilderClient slug={slug} />;
}
