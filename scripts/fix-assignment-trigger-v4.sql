-- Fix assignment_field_visibility table to make set_by nullable
-- Then update the trigger to not insert that field

-- Step 1: Make set_by nullable (if it exists)
ALTER TABLE assignment_field_visibility 
ALTER COLUMN set_by DROP NOT NULL;

-- Step 2: Update the trigger to not use set_by
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

