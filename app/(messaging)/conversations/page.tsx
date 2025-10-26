// Messaging interface
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessagingInterface } from "@/components/messaging/messaging-interface";

export const metadata: Metadata = {
  title: "Messages | Proofound",
  description: "Your conversations",
};

export default async function ConversationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get matches where user can message (accepted matches)
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      assignment:assignments(
        *,
        organization:organizations(*)
      )
    `)
    .eq("profile_id", user.id)
    .eq("status", "accepted")
    .order("responded_at", { ascending: false });

  // Get messages for this user
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id(full_name),
      receiver:receiver_id(full_name)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  return (
    <div className="h-[calc(100vh-8rem)]">
      <MessagingInterface 
        matches={matches as any[]} 
        messages={messages as any[]}
        currentUserId={user.id}
      />
    </div>
  );
}

