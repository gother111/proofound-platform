> Doc Class: `historical`
> Last Verified: `2026-05-19`

# Archived `/api/data-export` Alias

`/api/data-export` is not compiled into the locked MVP launch route tree.

The active data portability endpoint is:

- `GET /api/user/export`

The launch surface policy still classifies `/api/data-export` as archived compatibility so old
docs, tests, or clients cannot silently broaden the active API surface. Do not restore this alias as
a re-export of `/api/user/export`; doing so reintroduces a broad platform-era route that the route
inventory intentionally keeps out of the compiled launch surface.
