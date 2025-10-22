export default async function OrgTeamPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-6">
      Team — org <code>{params.slug}</code>
    </div>
  );
}
