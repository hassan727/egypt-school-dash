-- Migration: Create tables for Employee Documents and History
-- 20251222_employee_subpages_tables

-- 1. Employee Documents Table
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50), -- e.g. 'contract', 'id', 'degree', 'other'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 2. Employment History Table
CREATE TABLE IF NOT EXISTS employment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'hiring', 'promotion', 'salary_adjustment', 'department_transfer', 'termination'
    description TEXT,
    old_value TEXT, 
    new_value TEXT,
    event_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID -- Reference to auth.users if needed, but keeping simple for now
);

-- Enable RLS (Development mode: Allow all)
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to employee_documents" ON employee_documents FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE employment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to employment_history" ON employment_history FOR ALL USING (true) WITH CHECK (true);
