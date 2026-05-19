# Archived Feedback SUS Trigger UI

The old feedback SUS trigger provider, modal, and scoring helper live here as historical implementation context.

They are not part of the active launch surface because they call retired `/api/feedback/sus/*` endpoints and include a post-contract trigger. Active SUS survey work uses the `/api/surveys/sus` prompt flow and `src/components/surveys/*` components.
