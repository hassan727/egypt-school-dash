-- =============================================
-- Migration: Smart Timetable Backend Aggregation (Robust Version)
-- نظام التجميع التلقائي لمستحقات الحصص في الخلفية - نسخة آمنة لا تؤثر على الراتب الأساسي
-- 20260101170000_smart_timetable_backend_aggregation.sql
-- =============================================

-- 1. وظيفة حساب مكافأة الحصص الإضافية لموظف في شهر معين (آمنة تماماً)
CREATE OR REPLACE FUNCTION calculate_monthly_substitution_pay(
    p_employee_id UUID,
    p_month VARCHAR(7) -- Format: 'YYYY-MM'
) RETURNS DECIMAL AS $$
DECLARE
    v_active_version_id UUID;
    v_total_pay DECIMAL := 0;
    v_start_date DATE;
    v_end_date DATE;
    v_current_date DATE;
    v_day_code VARCHAR(10);
    v_day_id UUID;
    v_daily_pay DECIMAL;
BEGIN
    BEGIN
        -- 1. الحصول على النسخة النشطة من الجدول
        SELECT id INTO v_active_version_id FROM schedule_versions WHERE is_active = true LIMIT 1;
        IF v_active_version_id IS NULL THEN
            RETURN 0;
        END IF;

        -- 2. تحديد نطاق الشهر
        v_start_date := (p_month || '-01')::DATE;
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

        -- 3. المرور على أيام الشهر
        v_current_date := v_start_date;
        WHILE v_current_date <= v_end_date LOOP
            -- الحصول على كود اليوم (SUN, MON, etc.)
            v_day_code := UPPER(LEFT(TRIM(TO_CHAR(v_current_date, 'DAY')), 3));
            
            -- البحث عن معرف اليوم في جدول أيام الدراسة
            SELECT id INTO v_day_id FROM school_days WHERE day_code = v_day_code LIMIT 1;

            IF v_day_id IS NOT NULL THEN
                -- يتم احتساب المكافأة فقط إذا كان الموظف حاضراً في ذلك اليوم
                IF EXISTS (
                    SELECT 1 FROM employee_attendance 
                    WHERE employee_id = p_employee_id 
                    AND date = v_current_date 
                    AND status IN ('حاضر', 'متأخر', 'مأمورية')
                ) THEN
                    SELECT COALESCE(SUM(pay_rate), 0) INTO v_daily_pay
                    FROM schedule_slots
                    WHERE version_id = v_active_version_id
                    AND teacher_id = p_employee_id
                    AND day_id = v_day_id
                    AND is_paid = true;
                    
                    v_total_pay := v_total_pay + v_daily_pay;
                END IF;
            END IF;

            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        -- في حالة حدوث أي خطأ في الجدول، نرجع 0 ولا نعطل العملية الرئيسية
        RETURN 0;
    END;

    RETURN COALESCE(v_total_pay, 0);
END;
$$ LANGUAGE plpgsql;

-- 2. إجراء (Procedure) لتحديث الرواتب تلقائياً ببنود الحصص (كملحق إضافي فقط)
CREATE OR REPLACE FUNCTION sync_substitution_to_payroll(p_month VARCHAR(7))
RETURNS INTEGER AS $$
DECLARE
    r_emp RECORD;
    v_pay DECIMAL;
    v_salary_id UUID;
    v_count INTEGER := 0;
BEGIN
    FOR r_emp IN SELECT id FROM employees WHERE is_active = true LOOP
        -- حساب إجمالي الحصص المدفوعة (عملية مستقلة تماماً)
        BEGIN
            v_pay := calculate_monthly_substitution_pay(r_emp.id, p_month);
            
            IF v_pay > 0 THEN
                -- البحث عن سجل الراتب لهذا الشهر (يجب أن يكون الراتب موجوداً مسبقاً)
                SELECT id INTO v_salary_id FROM salaries 
                WHERE employee_id = r_emp.id AND month = p_month;
                
                IF v_salary_id IS NOT NULL THEN
                    -- 1. حذف البند القديم إذا وجد لتجنب التكرار
                    DELETE FROM salary_items 
                    WHERE salary_id = v_salary_id AND item_name = 'مكافأة حصص احتياط/بديلة';
                    
                    -- 2. إضافة البند الجديد كبند "استحقاق" إضافي
                    INSERT INTO salary_items (salary_id, item_type, item_name, amount, notes)
                    VALUES (v_salary_id, 'استحقاق', 'مكافأة حصص احتياط/بديلة', v_pay, 'تجميع إضافي من الجدول المجدول');
                    
                    -- 3. تحديث إجماليات الراتب (تحديث الحقول المحسوبة فقط)
                    UPDATE salaries SET
                        total_allowances = (SELECT COALESCE(SUM(amount), 0) FROM salary_items WHERE salary_id = v_salary_id AND item_type = 'استحقاق'),
                        net_salary = base_salary + (SELECT COALESCE(SUM(amount), 0) FROM salary_items WHERE salary_id = v_salary_id AND item_type = 'استحقاق') 
                                               - (SELECT COALESCE(SUM(amount), 0) FROM salary_items WHERE salary_id = v_salary_id AND item_type = 'خصم'),
                        updated_at = NOW()
                    WHERE id = v_salary_id;
                    
                    v_count := v_count + 1;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- تجاهل الأخطاء لهذا الموظف والاستمرار للبقية
            CONTINUE;
        END;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

SELECT 'Backend substitution aggregation logic created (Robust Version)' as status;
