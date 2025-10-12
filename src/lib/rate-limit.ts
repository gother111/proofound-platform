import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { eq } from 'drizzle-orm';

const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

export async function checkRateLimit(identifier: string, route: string): Promise<boolean> {
  const id = `${identifier}:${route}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_SECONDS * 1000);

  try {
    // Try to get existing rate limit record
    const [record] = await db.select().from(rateLimits).where(eq(rateLimits.id, id)).limit(1);

    if (!record) {
      // Create new record
      await db.insert(rateLimits).values({
        id,
        attempts: 1,
        resetAt,
      });
      return true;
    }

    // Check if window has expired
    if (new Date(record.resetAt) < now) {
      // Reset counter
      await db
        .update(rateLimits)
        .set({
          attempts: 1,
          resetAt,
        })
        .where(eq(rateLimits.id, id));
      return true;
    }

    // Increment attempts
    const newAttempts = Number(record.attempts) + 1;

    await db
      .update(rateLimits)
      .set({
        attempts: newAttempts,
      })
      .where(eq(rateLimits.id, id));

    return newAttempts <= MAX_REQUESTS;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open to avoid blocking legitimate requests on errors
    return true;
  }
}

export function getRateLimitIdentifier(ip?: string | null): string {
  return ip || 'unknown';
}
