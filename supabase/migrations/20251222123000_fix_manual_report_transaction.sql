-- Migration: 20251222123000_fix_manual_report_transaction.sql
-- Goal: Provide an atomic function to save/update manual reports

CREATE OR REPLACE FUNCTION save_manual_report_transaction(
    p_report_id UUID,
    p_report_date DATE,
    p_academic_year_code VARCHAR,
    p_report_title VARCHAR,
    p_notes TEXT,
    p_total_enrolled INTEGER,
    p_total_present INTEGER,
    p_total_absent INTEGER,
    p_attendance_rate NUMERIC,
    p_absence_rate NUMERIC,
    p_entries JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_report_id UUID;
    v_entry JSONB;
BEGIN
    -- 1. Insert or Update Report Header
    IF p_report_id IS NULL THEN
        INSERT INTO manual_attendance_reports (
            report_date,
            academic_year_code,
            report_title,
            notes,
            total_enrolled,
            total_present,
            total_absent,
            attendance_rate,
            absence_rate
        ) VALUES (
            p_report_date,
            p_academic_year_code,
            p_report_title,
            p_notes,
            p_total_enrolled,
            p_total_present,
            p_total_absent,
            p_attendance_rate,
            p_absence_rate
        ) RETURNING id INTO v_new_report_id;
    ELSE
        UPDATE manual_attendance_reports
        SET
            report_title = p_report_title,
            notes = p_notes,
            total_enrolled = p_total_enrolled,
            total_present = p_total_present,
            total_absent = p_total_absent,
            attendance_rate = p_attendance_rate,
            absence_rate = p_absence_rate,
            updated_at = NOW()
        WHERE id = p_report_id
        RETURNING id INTO v_new_report_id;

        -- If update didn't match any row (e.g. deleted), insert as new
        IF v_new_report_id IS NULL THEN
             INSERT INTO manual_attendance_reports (
                report_date,
                academic_year_code,
                report_title,
                notes,
                total_enrolled,
                total_present,
                total_absent,
                attendance_rate,
                absence_rate
            ) VALUES (
                p_report_date,
                p_academic_year_code,
                p_report_title,
                p_notes,
                p_total_enrolled,
                p_total_present,
                p_total_absent,
                p_attendance_rate,
                p_absence_rate
            ) RETURNING id INTO v_new_report_id;
        END IF;

        -- Delete old entries for this report to replace with new ones
        DELETE FROM manual_attendance_entries WHERE report_id = v_new_report_id;
    END IF;

    -- 2. Insert New Entries
    -- JSONB array expected: [{ "stage_id": "...", "class_id": "...", ... }, ...]
    IF p_entries IS NOT NULL AND jsonb_array_length(p_entries) > 0 THEN
        INSERT INTO manual_attendance_entries (
            report_id,
            stage_id,
            stage_name,
            class_id,
            class_name,
            enrolled,
            present,
            absent,
            attendance_rate,
            absence_rate
        )
        SELECT
            v_new_report_id,
            (entry->>'stage_id')::UUID,
            entry->>'stage_name',
            (entry->>'class_id')::UUID,
            entry->>'class_name',
            (entry->>'enrolled')::INTEGER,
            (entry->>'present')::INTEGER,
            (entry->>'absent')::INTEGER,
            (entry->>'attendance_rate')::NUMERIC,
            (entry->>'absence_rate')::NUMERIC
        FROM jsonb_array_elements(p_entries) AS entry;
    END IF;

    RETURN v_new_report_id;
END;
$$;
