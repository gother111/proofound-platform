import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { MessagesView } from "@/components/MessagesView";

export const metadata: Metadata = {
  title: "Messages | Proofound",
  description: "Your conversations and messages",
};

export default async function ConversationsPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Fetch accepted matches (conversations)
  const { data: conversations, error: conversationsError } = await supabase
    .from('matches')
    .select(`
      *,
      profile:profiles!matches_profile_id_fkey(
        id,
        full_name,
        avatar_url,
        tagline
      ),
      assignment:assignments(
        id,
        title,
        description,
        created_by,
        organization:organizations(
          id,
          name
        )
      )
    `)
    .or(`profile_id.eq.${profile.id},assignment_id.in.(select id from assignments where organization_id.eq.${profile.organization_id || 'null'})`)
    .eq('status', 'accepted') // Only show accepted matches
    .order('updated_at', { ascending: false });

  if (conversationsError) {
    console.error("Error fetching conversations:", conversationsError);
  }

  // Fetch all messages for these conversations
  const conversationIds = conversations?.map((c: any) => c.id) || [];
  
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
      receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url)
    `)
    .in('match_id', conversationIds.length > 0 ? conversationIds : [''])
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
  }

  return (
    <MessagesView 
      profile={profile}
      conversations={conversations || []}
      initialMessages={messages || []}
    />
  );
}
