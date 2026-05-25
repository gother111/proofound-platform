> Doc Class: `historical`
> Last Verified: `2026-05-20`

# Archived LinkedIn OAuth Helper

Custom LinkedIn OAuth/profile helpers are outside the locked launch MVP corridor.
Active launch auth should use the configured Supabase provider path if a target
explicitly enables LinkedIn social login. Launch code must not exchange LinkedIn
OAuth codes itself, fetch LinkedIn profile/email APIs, request LinkedIn
verification scopes, or treat LinkedIn state as proof trust.
