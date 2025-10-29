import { requireAuth, getActiveOrg } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationSettingsView } from "@/components/settings/organization/OrganizationSettingsView";

export const dynamic = "force-dynamic";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect(`/app/o/${slug}/home`);
  }

  const supabase = await createClient();
  const { data: logsData } = await supabase
    .from("audit_logs")
    .select(`id, action, targetType:target_type, targetId:target_id, createdAt:created_at`)
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <OrganizationSettingsView
      organization={{
        id: org.id,
        displayName: org.displayName,
        createdAt: org.createdAt,
        tagline: org.tagline,
        website: org.website,
        registrationCountry: org.registrationCountry,
        registrationRegion: org.registrationRegion,
        logoUrl: org.logoUrl,
      }}
      membership={{ role: membership.role }}
      logs={(logsData ?? []).map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        createdAt: log.createdAt,
      }))}
    />
  );
}
