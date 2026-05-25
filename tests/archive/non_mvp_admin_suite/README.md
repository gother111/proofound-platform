# Archived Admin Suite Tests

These tests preserve pre-launch behavior for broad admin surfaces that are outside the locked MVP corridor:

- admin users and organization management tables
- fairness note/report/metrics pages
- broad analytics and rollout metric helpers
- archived CV import spend analytics

The active launch admin corridor is limited to `/admin`, `/admin/verification`, and `/admin/audit`, plus their internal launch-ops APIs. Do not move these tests back into the default test surface unless the route-surface policy is intentionally reopened.
