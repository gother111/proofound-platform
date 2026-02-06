/**
 * Identity Reveal Logic
 *
 * Triggers identity reveal after interview scheduling
 */

import { db } from '@/db';
import { conversations, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendIdentityRevealedEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

/**
 * Trigger identity reveal for a conversation
 *
 * Called automatically after interview is scheduled
 * Updates stage from 1 (masked) to 2 (revealed)
 */
export async function triggerIdentityReveal(conversationId: string): Promise<void> {
  try {
    // Get conversation details
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Update conversation stage
    await db
      .update(conversations)
      .set({
        stage: 'revealed',
      })
      .where(eq(conversations.id, conversationId));

    // Send email notifications to both parties
    try {
      // Get both participant profiles
      const participant1Profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, conversation.participantOneId),
      });

      const participant2Profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, conversation.participantTwoId),
      });

      // Get emails from Supabase auth
      const supabase = await createClient();
      const { data: auth1 } = await supabase.auth.admin.getUserById(conversation.participantOneId);
      const { data: auth2 } = await supabase.auth.admin.getUserById(conversation.participantTwoId);

      // Send to participant 1 (reveal participant 2)
      if (participant1Profile && auth1?.user?.email && participant2Profile) {
        await sendIdentityRevealedEmail(
          auth1.user.email,
          participant1Profile.displayName || 'User',
          'candidate', // Default role
          {
            revealedName: participant2Profile.displayName || 'User',
            conversationId,
            profileId: participant2Profile.id,
          }
        );
      }

      // Send to participant 2 (reveal participant 1)
      if (participant2Profile && auth2?.user?.email && participant1Profile) {
        await sendIdentityRevealedEmail(
          auth2.user.email,
          participant2Profile.displayName || 'User',
          'candidate', // Default role
          {
            revealedName: participant1Profile.displayName || 'User',
            conversationId,
            profileId: participant1Profile.id,
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send identity revealed emails:', emailError);
      // Don't fail the request if email fails
    }

    // TODO: Emit analytics event for identity_revealed

    console.log(`Identity revealed for conversation ${conversationId}`);
  } catch (error) {
    console.error('Identity reveal error:', error);
    throw new Error('Failed to trigger identity reveal');
  }
}

/**
 * Check if conversation is at revealed stage
 */
export async function isIdentityRevealed(conversationId: string): Promise<boolean> {
  try {
    const conversation = await db
      .select({ stage: conversations.stage })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation.length) {
      throw new Error('Conversation not found');
    }

    return conversation[0].stage === 'revealed';
  } catch (error) {
    console.error('Check identity reveal error:', error);
    return false;
  }
}
