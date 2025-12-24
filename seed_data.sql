-- =============================================
-- SEED DATA: Terminated Employees
-- =============================================
-- This script adds sample terminated employees to test the archive page.

-- 1. Terminated Employee: Resignation
INSERT INTO employees (
    employee_id, 
    full_name, 
    national_id, 
    employee_type, 
    position, 
    department, 
    phone, 
    hire_date, 
    is_active, 
    base_salary,
    status,
    termination_date,
    termination_reason,
    termination_status,
    termination_details
) VALUES (
    'EMP-TERM-001', 
    'محمد فاروق السيد', 
    '28510101234567', 
    'معلم', 
    'معلم فيزياء', 
    'الثانوية', 
    '01000000001', 
    '2018-09-01', 
    false, 
    7500.00,
    'منتهي الخدمة',
    '2023-05-15',
    'استقالة',
    'مكتمل',
    '{"notes": "استقال لظروف خاصة", "documents": ["resignation_letter.pdf"]}'
) ON CONFLICT (employee_id) DO UPDATE SET 
    status = 'منتهي الخدمة',
    is_active = false,
    termination_date = '2023-05-15',
    termination_reason = 'استقالة';

-- 2. Terminated Employee: Contract End
INSERT INTO employees (
    employee_id, 
    full_name, 
    national_id, 
    employee_type, 
    position, 
    department, 
    phone, 
    hire_date, 
    is_active, 
    base_salary,
    status,
    termination_date,
    termination_reason,
    termination_status,
    termination_details
) VALUES (
    'EMP-TERM-002', 
    'سلوى محمود حسن', 
    '29001011234567', 
    'إداري', 
    'سيدار', 
    'الإدارة', 
    '01200000002', 
    '2020-01-01', 
    false, 
    4500.00,
    'منتهي الخدمة',
    '2024-01-01',
    'انتهاء عقد',
    'مكتمل',
    '{"notes": "انتهاء العقد المحدد بمدة", "last_working_day": "2023-12-31"}'
) ON CONFLICT (employee_id) DO UPDATE SET 
    status = 'منتهي الخدمة',
    is_active = false,
    termination_date = '2024-01-01',
    termination_reason = 'انتهاء عقد';

-- 3. Terminated Employee: Dismissal (Status Pending)
INSERT INTO employees (
    employee_id, 
    full_name, 
    national_id, 
    employee_type, 
    position, 
    department, 
    phone, 
    hire_date, 
    is_active, 
    base_salary,
    status,
    termination_date,
    termination_reason,
    termination_status,
    termination_details
) VALUES (
    'EMP-TERM-003', 
    'كريم عبد العزيز', 
    '28805051234588', 
    'أمن', 
    'مشرف أمن', 
    'الأمن', 
    '01100000003', 
    '2022-03-15', 
    false, 
    3200.00,
    'منتهي الخدمة',
    '2024-02-20',
    'فصل',
    'معلق',
    '{"notes": "فصل بسبب الغياب المتكرر", "issues": ["غياب بدون إذن"]}'
) ON CONFLICT (employee_id) DO UPDATE SET 
    status = 'منتهي الخدمة',
    is_active = false,
    termination_date = '2024-02-20',
    termination_reason = 'فصل',
    termination_status = 'معلق';

SELECT 'Terminated employees seeded successfully' as result;
