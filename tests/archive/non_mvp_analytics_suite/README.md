# Archived Analytics Route Tests

These tests cover the retired broad analytics endpoints:

- `/api/analytics/track`
- `/api/analytics/events`
- `/api/analytics/tour-event`
- `/api/analytics/web-vitals`

The locked MVP keeps these endpoints only as archived compatibility responses. Active launch coverage lives in `tests/api/archived-api-handlers-route.test.ts` and `src/lib/__tests__/middleware-launch-archive.test.ts`, which assert launch-safe archived behavior.

Keep these files out of the active launch test signal unless the route-surface policy is intentionally changed.
