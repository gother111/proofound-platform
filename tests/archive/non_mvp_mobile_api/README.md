# Archived Mobile API Tests

These tests preserve pre-launch behavior for the old `/api/mobile/v1/*` route family.

The web MVP launch corridor does not compile mobile API routes from `src/app`; those handlers are preserved under `src/archive/non_launch_api/` and should not be treated as active release signal.

Keep these tests out of the default launch test surface unless the mobile API is intentionally reopened in the route-surface policy.
