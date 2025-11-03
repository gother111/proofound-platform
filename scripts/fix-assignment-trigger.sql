-- Fix the auto_populate_field_visibility trigger to not reference created_by
-- This column doesn't exist in the assignments table

CREATE OR REPLACE FUNCTION auto_populate_field_visibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default visibility rules for all system fields
    -- Changed: removed NEW.created_by reference since that column doesn't exist
    -- Using auth.uid() instead to get the current user ID
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
        auth.uid()  -- Changed from NEW.created_by to auth.uid()
    FROM assignment_field_visibility_defaults d
    WHERE d.is_system_field = true
    ON CONFLICT (assignment_id, field_name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

