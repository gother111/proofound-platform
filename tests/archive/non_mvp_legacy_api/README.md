# Archived Legacy API Tests

These tests preserve compatibility behavior for old API routes that are outside the locked MVP corridor:

- legacy `/api/messages*` adapters
- legacy `/api/updates` cache flag behavior

The active launch surface uses canonical conversation APIs and route-surface/archive tests instead. Do not move these tests back into active `tests/api` unless the locked MVP source of truth changes and the routes are intentionally reopened.
