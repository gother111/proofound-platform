/**
 * Identity Reveal Logic
 * 
 * Triggers identity reveal after interview scheduling
 */

import { db } from '@/db';
import { conversations } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Trigger identity reveal for a conversation
 * 
 * Called automatically after interview is scheduled
 * Updates stage from 1 (masked) to 2 (revealed)
 */
export async function triggerIdentityReveal(
  conversationId: string
): Promise<void> {
  try {
    // Update conversation stage
    await db
      .update(conversations)
      .set({
        stage: 2, // Revealed
      })
      .where(eq(conversations.id, conversationId));

    // TODO: Emit analytics event for identity_revealed
    // TODO: Send notification to both parties via email/in-app

    console.log(`Identity revealed for conversation ${conversationId}`);
  } catch (error) {
    console.error('Identity reveal error:', error);
    throw new Error('Failed to trigger identity reveal');
  }
}

/**
 * Check if conversation is at revealed stage
 */
export async function isIdentityRevealed(
  conversationId: string
): Promise<boolean> {
  try {
    const conversation = await db
      .select({ stage: conversations.stage })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation.length) {
      throw new Error('Conversation not found');
    }

    return conversation[0].stage === 2;
  } catch (error) {
    console.error('Check identity reveal error:', error);
    return false;
  }
}

