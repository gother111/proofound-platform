> Doc Class: `historical`
> Last Verified: `2026-05-20`

# Archived Notification Components

The in-app notification center is outside the locked launch MVP corridor. The active
app header intentionally does not mount a notification bell, and `/app/i/notifications`,
`/app/i/settings/notifications`, and `/api/notifications*` are archived by launch
surface policy.

These components are preserved only as historical implementation context. Launch
communication should use the active communications, verification, reveal, interview,
decision, and engagement-verification surfaces instead of broad in-app notifications.
