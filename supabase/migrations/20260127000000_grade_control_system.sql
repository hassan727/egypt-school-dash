
-- Grade Control System Migration
-- Created at: 2026-01-27
-- هذا الملف ينشئ الهيكل الأساسي لنظام رصد الدرجات الأسبوعي

-- 1. GRADING CATEGORIES - فئات التقييم
CREATE TABLE IF NOT EXISTS grading_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACADEMIC WEEKS - الأسابيع الأكاديمية
CREATE TABLE IF NOT EXISTS academic_weeks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_number INTEGER NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STUDENT WEEKLY GRADES - الدرجات الأسبوعية للطلاب
CREATE TABLE IF NOT EXISTS student_weekly_grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    week_id UUID REFERENCES academic_weeks(id) ON DELETE CASCADE,
    category_id UUID REFERENCES grading_categories(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    entered_by UUID REFERENCES employees(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id, week_id, category_id)
);

-- 4. STUDENT CATEGORY AVERAGES - متوسطات الفئات لكل طالب
CREATE TABLE IF NOT EXISTS student_category_averages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES grading_categories(id) ON DELETE CASCADE,
    average_score DECIMAL(5,2),
    weeks_counted INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id, category_id)
);

-- 5. STUDENT TOTAL AVERAGES - المعدل التراكمي النهائي للمادة
CREATE TABLE IF NOT EXISTS student_total_averages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    total_average DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- 6. SEED INITIAL GRADING CATEGORIES - إدخال البيانات الأساسية
INSERT INTO grading_categories (name_ar, max_score, display_order) VALUES
('مهام أدائية', 10, 1),
('كراسة واجب', 5, 2),
('كراسة نشاط', 5, 3),
('المواظبة والسلوك', 5, 4),
('التقييمات الأسبوعية', 5, 5),
('التقييمات الشهرية', 5, 6)
ON CONFLICT (id) DO NOTHING;

-- تعطيل RLS لضمان الوصول من قبل المعلمين
ALTER TABLE grading_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_weeks DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_weekly_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_category_averages DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_total_averages DISABLE ROW LEVEL SECURITY;
