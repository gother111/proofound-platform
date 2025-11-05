-- Fix the auto_populate_field_visibility trigger to handle service role calls
-- When called from service role (auth.uid() is NULL), use a system UUID

CREATE OR REPLACE FUNCTION auto_populate_field_visibility()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO assignment_field_visibility (
        assignment_id,
        field_name,
        field_category,
        visibility_level,
        redaction_type,
        generic_label,
        set_by
    )
    SELECT
        NEW.id,
        d.field_name,
        d.field_category,
        d.default_visibility,
        d.default_redaction_type,
        d.default_generic_label,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)  -- Use system UUID if auth.uid() is NULL
    FROM assignment_field_visibility_defaults d
    WHERE d.is_system_field = true
    ON CONFLICT (assignment_id, field_name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

