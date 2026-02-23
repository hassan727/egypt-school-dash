-- =============================================
-- Script التحقق من المراحل والفصول والسنوات الدراسية
-- Run via: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. عرض جميع المراحل
SELECT 'المراحل الدراسية' as section;
SELECT id, name, created_at FROM stages ORDER BY created_at;

-- 2. التحقق من عدم وجود مراحل مُجمّعة
SELECT 'فحص المراحل المُجمّعة (يجب أن تكون فارغة)' as section;
SELECT * FROM stages WHERE name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية');

-- 3. عرض الفصول مع مراحلها
SELECT 'الفصول الدراسية' as section;
SELECT c.id, c.name as class_name, s.name as stage_name
FROM classes c
JOIN stages s ON c.stage_id = s.id
ORDER BY s.created_at, c.name;

-- 4. عرض السنوات الدراسية
SELECT 'السنوات الدراسية' as section;
SELECT year_code, year_name_ar, is_active, start_date, end_date
FROM academic_years
ORDER BY year_code;

-- 5. إحصائيات
SELECT 'إحصائيات عامة' as section;
SELECT
    (SELECT COUNT(*) FROM stages) as total_stages,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM academic_years) as total_years,
    (SELECT COUNT(*) FROM stages WHERE name IN ('رياض الأطفال', 'الابتدائية', 'الإعدادية', 'الثانوية')) as grouped_stages_count;

-- 6. التحقق من أن stages_classes جدول محذوف
SELECT 'فحص جدول stages_classes (يجب أن يفشل = محذوف)' as section;
-- SELECT COUNT(*) FROM stages_classes; -- سيفشل إذا الجدول محذوف

-- 7. عرض الطلاب حسب السنة الدراسية (للتأكد من الفلترة)
SELECT 'توزيع الطلاب حسب السنة الدراسية' as section;
SELECT academic_year, COUNT(*) as student_count
FROM students
WHERE academic_year IS NOT NULL
GROUP BY academic_year
ORDER BY academic_year;

-- 8. عرض الطلاب حسب المرحلة (عبر class_id)
SELECT 'توزيع الطلاب حسب المرحلة' as section;
SELECT s.name as stage_name, COUNT(st.id) as student_count
FROM students st
JOIN classes c ON st.class_id = c.id
JOIN stages s ON c.stage_id = s.id
GROUP BY s.name
ORDER BY s.name;
