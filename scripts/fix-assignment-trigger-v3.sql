-- Fix the auto_populate_field_visibility trigger
-- Only insert fields that exist in the assignment_field_visibility table schema

CREATE OR REPLACE FUNCTION auto_populate_field_visibility()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO assignment_field_visibility (
        assignment_id,
        field_name,
        visibility_level,
        redaction_type,
        generic_label
    )
    SELECT
        NEW.id,
        d.field_name,
        d.default_visibility,
        d.default_redaction_type,
        d.default_generic_label
    FROM assignment_field_visibility_defaults d
    WHERE d.is_system_field = true
    ON CONFLICT (assignment_id, field_name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

