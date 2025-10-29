import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IndividualSettingsView } from "@/components/settings/individual/IndividualSettingsView";

export const dynamic = "force-dynamic";

export default async function IndividualSettingsPage() {
  const profile = await requireAuth();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  return (
    <IndividualSettingsView
      profile={{
        id: profile.id,
        displayName: profile.displayName,
        handle: profile.handle,
        avatarUrl: profile.avatarUrl,
        locale: profile.locale ?? "en",
        persona: profile.persona,
      }}
      email={authUser?.email}
    />
  );
}
