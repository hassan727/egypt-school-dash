-- =============================================
-- Migration: Migrate teaching_assignments to employees table
-- نقل توزيعات المواد من جدول المعلمين إلى جدول الموظفين
-- =============================================

-- 1. إضافة عمود temp للحفاظ على UUID للموظفين
ALTER TABLE teaching_assignments ADD COLUMN IF NOT EXISTS teacher_id_uuid UUID;

-- 2. تحديث العمود الجديد بـ UUID من جدول employees
UPDATE teaching_assignments ta
SET teacher_id_uuid = e.id
FROM employees e
WHERE e.employee_id = ta.teacher_id AND e.employee_type = 'معلم';

-- 3. حذف القيد الخارجي القديم
ALTER TABLE teaching_assignments 
DROP CONSTRAINT IF EXISTS teaching_assignments_teacher_id_fkey;

-- 4. حذف العمود القديم
ALTER TABLE teaching_assignments DROP COLUMN IF EXISTS teacher_id;

-- 5. إعادة تسمية العمود الجديد
ALTER TABLE teaching_assignments RENAME COLUMN teacher_id_uuid TO teacher_id;

-- 6. تعريف القيد الخارجي الجديد
ALTER TABLE teaching_assignments 
ADD CONSTRAINT teaching_assignments_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES employees(id) ON DELETE CASCADE;

-- 7. إضافة الحقول الناقصة إذا لم تكن موجودة
ALTER TABLE teaching_assignments ADD COLUMN IF NOT EXISTS academic_year_code VARCHAR(20);
ALTER TABLE teaching_assignments ADD COLUMN IF NOT EXISTS semester_id UUID;

-- 8. تحديث UNIQUE constraint
ALTER TABLE teaching_assignments DROP CONSTRAINT IF EXISTS teaching_assignments_teacher_id_subject_id_class_id_key;
ALTER TABLE teaching_assignments ADD UNIQUE(teacher_id, subject_id, class_id, academic_year_code);

-- 9. التحقق من النتيجة
SELECT COUNT(*) as total_assignments FROM teaching_assignments;
