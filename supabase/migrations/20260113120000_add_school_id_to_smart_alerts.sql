-- Add school_id to smart_alerts table
ALTER TABLE smart_alerts 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_smart_alerts_school_id ON smart_alerts(school_id);

-- Add school_id to alert_thresholds table (optional, allowing school-specific thresholds)
ALTER TABLE alert_thresholds
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_alert_thresholds_school_id ON alert_thresholds(school_id);

-- Update RLS policies for authenticated access
-- Note: Using simple authenticated pattern like other tables in the system
-- The school_id column is available for application-level filtering
DROP POLICY IF EXISTS "Allow authenticated users to view alerts" ON smart_alerts;
CREATE POLICY "Allow authenticated users to view alerts" ON smart_alerts
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update alerts" ON smart_alerts;
CREATE POLICY "Allow authenticated users to update alerts" ON smart_alerts
    FOR UPDATE TO authenticated USING (true);

-- Note: Existing rows will have school_id as NULL and can be backfilled or treated as global alerts
