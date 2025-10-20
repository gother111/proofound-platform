/**
 * Structured logging utility for server-side events.
 *
 * Usage:
 *   log.info('match.compute', { assignmentId, poolSize, userId })
 *   log.error('match.failed', { error: err.message })
 *
 * Never log PII (names, emails, photos, exact locations).
 */

export const log = {
  info: (event: string, meta?: Record<string, unknown>) =>
    console.log(
      JSON.stringify({ level: 'info', event, timestamp: new Date().toISOString(), ...meta })
    ),

  warn: (event: string, meta?: Record<string, unknown>) =>
    console.warn(
      JSON.stringify({ level: 'warn', event, timestamp: new Date().toISOString(), ...meta })
    ),

  error: (event: string, meta?: Record<string, unknown>) =>
    console.error(
      JSON.stringify({ level: 'error', event, timestamp: new Date().toISOString(), ...meta })
    ),
};
