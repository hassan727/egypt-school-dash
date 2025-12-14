-- Migration: Add Terminated Employees Support
-- Created at: 2025-12-13 16:00:00

-- 1. Add Termination Fields to employees table
DO $$
BEGIN
    -- termination_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'termination_date') THEN
        ALTER TABLE employees ADD COLUMN termination_date DATE;
    END IF;

    -- termination_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'termination_reason') THEN
        ALTER TABLE employees ADD COLUMN termination_reason VARCHAR(100);
    END IF;

    -- termination_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'termination_status') THEN
        ALTER TABLE employees ADD COLUMN termination_status VARCHAR(50) DEFAULT 'مكتمل'; -- مكتمل / معلق (مستحقات)
    END IF;

    -- termination_details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'termination_details') THEN
        ALTER TABLE employees ADD COLUMN termination_details JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- status (Add if missing to support 'منتهي الخدمة' etc directly in DB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status') THEN
        ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'نشط';
    END IF;
END $$;


-- 2. Seed Data: Terminated Employees for Testing
-- 2.1 Terminated Employee: Resignation
INSERT INTO employees (
    employee_id, full_name, national_id, employee_type, position, department, phone, 
    hire_date, is_active, base_salary, status, termination_date, termination_reason, termination_status, termination_details
) VALUES (
    'EMP-TERM-001', 'محمد فاروق السيد', '28510101234567', 'معلم', 'معلم فيزياء', 'الثانوية', '01000000001', 
    '2018-09-01', false, 7500.00, 'منتهي الخدمة', '2023-05-15', 'استقالة', 'مكتمل', '{"notes": "استقال لظروف خاصة", "documents": ["resignation_letter.pdf"]}'
) ON CONFLICT (employee_id) DO UPDATE SET 
    status = 'منتهي الخدمة', is_active = false, termination_date = '2023-05-15', termination_reason = 'استقالة';

-- 2.2 Terminated Employee: Contract End
INSERT INTO employees (
    employee_id, full_name, national_id, employee_type, position, department, phone, 
    hire_date, is_active, base_salary, status, termination_date, termination_reason, termination_status, termination_details
) VALUES (
    'EMP-TERM-002', 'سلوى محمود حسن', '29001011234567', 'إداري', 'سيدار', 'الإدارة', '01200000002', 
    '2020-01-01', false, 4500.00, 'منتهي الخدمة', '2024-01-01', 'انتهاء عقد', 'مكتمل', '{"notes": "انتهاء العقد المحدد بمدة", "last_working_day": "2023-12-31"}'
) ON CONFLICT (employee_id) DO UPDATE SET 
    status = 'منتهي الخدمة', is_active = false, termination_date = '2024-01-01', termination_reason = 'انتهاء عقد';

-- 2.3 Terminated Employee: Dismissal
INSERT INTO employees (
    employee_id, full_name, national_id, employee_type, position, department, phone, 
    hire_date, is_active, base_salary, status, termination_date, termination_reason, termination_status, termination_details
) VALUES (
    'EMP-TERM-003', 'كريم عبد العزيز', '28805051234588', 'أمن', 'مشرف أمن', 'الأمن', '01100000003', 
    '2022-03-15', false, 3200.00, 'منتهي الخدمة', '2024-02-20', 'فصل', 'معلق', '{"notes": "فصل بسبب الغياب المتكرر", "issues": ["غياب بدون إذن"]}'
) ON CONFLICT (employee_id) DO UPDATE SET 
    status = 'منتهي الخدمة', is_active = false, termination_date = '2024-02-20', termination_reason = 'فصل', termination_status = 'معلق';
