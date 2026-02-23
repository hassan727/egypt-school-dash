/**
 * Hook للبيانات المالية الشاملة
 * Comprehensive Finance Data Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Employee,
    Salary,
    SalaryItem,
    GeneralTransaction,
    RevenueCategory,
    ExpenseCategory,
    FinancialSummary,
    CreateEmployeeDTO,
    CreateTransactionDTO,
    EmployeeLoan,
} from '@/types/finance';
import { useSystemSchoolId } from '@/context/SystemContext';

export function useFinanceData(academicYear?: string) {
    const schoolId = useSystemSchoolId();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // البيانات
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [transactions, setTransactions] = useState<GeneralTransaction[]>([]);
    const [revenueCategories, setRevenueCategories] = useState<RevenueCategory[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

    const currentYear = academicYear || '2025-2026';

    // جلب الملخص المالي
    const fetchSummary = useCallback(async () => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');

            // 1. جلب الدفعات المقدمة من school_fees
            const { data: feesData } = await supabase
                .from('school_fees')
                .select('student_id, total_amount, advance_payment')
                .eq('academic_year_code', currentYear)
                .eq('school_id', schoolId); // Enforce School Identity

            const totalFeesExpected = feesData?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
            const totalAdvancePayments = feesData?.reduce((sum, f) => sum + (f.advance_payment || 0), 0) || 0;

            // 2. جلب مدفوعات الطلاب (نوع 'دفعة')
            const { data: studentPayments } = await supabase
                .from('financial_transactions')
                .select('amount, student_id')
                .eq('academic_year_code', currentYear)
                .eq('transaction_type', 'دفعة')
                .eq('school_id', schoolId); // Enforce School Identity

            const totalStudentPayments = studentPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

            // 3. جلب خصومات الطلاب (نوع 'خصم')
            const { data: discountsData } = await supabase
                .from('financial_transactions')
                .select('amount')
                .eq('academic_year_code', currentYear)
                .eq('transaction_type', 'خصم')
                .eq('school_id', schoolId); // Enforce School Identity

            const totalStudentDiscounts = discountsData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

            // 4. جلب الحركات المالية العامة
            const { data: generalTx } = await supabase
                .from('general_transactions')
                .select('*')
                .eq('academic_year_code', currentYear)
                .eq('school_id', schoolId); // Enforce School Identity

            const generalRevenue = generalTx
                ?.filter(t => t.transaction_type === 'إيراد')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            const generalExpenses = generalTx
                ?.filter(t => t.transaction_type === 'مصروف')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            // 5. جلب الرواتب (مستحق)
            const { data: pendingSalariesData } = await supabase
                .from('salaries')
                .select('net_salary')
                .eq('academic_year_code', currentYear)
                .eq('status', 'مستحق')
                .eq('school_id', schoolId); // Enforce School Identity

            const totalPendingSalaries = pendingSalariesData?.reduce((sum, s) => sum + (s.net_salary || 0), 0) || 0;

            // 6. جلب الرواتب (تم الصرف)
            const { data: paidSalariesData } = await supabase
                .from('salaries')
                .select('net_salary')
                .eq('academic_year_code', currentYear)
                .eq('status', 'تم الصرف')
                .eq('school_id', schoolId); // Enforce School Identity

            const totalPaidSalaries = paidSalariesData?.reduce((sum, s) => sum + (s.net_salary || 0), 0) || 0;

            // ===== الحسابات الصحيحة (كما هي) =====
            const totalRevenue = generalRevenue + totalStudentPayments + totalAdvancePayments;
            const totalExpenses = generalExpenses + totalPaidSalaries;
            const studentCollection = totalStudentPayments + totalAdvancePayments;
            const collectionRate = totalFeesExpected > 0 ? (studentCollection / totalFeesExpected) * 100 : 0;

            // حساب الطلاب المتأخرين
            let overdueCount = 0;
            feesData?.forEach(student => {
                const studentPaid = studentPayments
                    ?.filter(p => p.student_id === student.student_id)
                    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

                const totalPaidByStudent = studentPaid + (student.advance_payment || 0);
                const effectiveAmount = (student.total_amount || 0) - totalStudentDiscounts;

                if (totalPaidByStudent < effectiveAmount * 0.5) {
                    overdueCount++;
                }
            });

            setSummary({
                totalRevenue,
                totalExpenses,
                netBalance: totalRevenue - totalExpenses,
                studentPayments: studentCollection,
                totalSalaries: totalPaidSalaries + totalPendingSalaries,
                pendingSalaries: totalPendingSalaries,
                collectionRate: Math.round(collectionRate),
                overdueStudents: overdueCount,
                revenueByCategory: [],
                expensesByCategory: [],
                monthlyTrend: [],
            });
        } catch (err) {
            console.error('خطأ في جلب الملخص المالي:', err);
        }
    }, [currentYear, schoolId]); // Added schoolId dependency

    // Data states for detail views/alerts
    const [rawSchoolFees, setRawSchoolFees] = useState<any[]>([]);
    const [rawInstallments, setRawInstallments] = useState<any[]>([]);

    // Fetch detailed fees and installments
    const fetchDetailedFees = useCallback(async () => {
        try {
            if (!schoolId) return;

            // Fetch school_fees
            const { data: fees } = await supabase
                .from('school_fees')
                .select('*')
                .eq('academic_year_code', currentYear)
                .eq('school_id', schoolId); // Enforce School Identity

            if (fees) setRawSchoolFees(fees);

            // Fetch installments linked to these fees or year

            // To be safe and optimal, let's fetch installments where fee_id is in the fees list
            if (fees && fees.length > 0) {
                const feeIds = fees.map(f => f.id);
                // Tip: Supabase IN has a limit, but usually fine for <1000 items. 
                // Better approach would be filtering by school_id if fee_installments has it, or join.
                // Assuming fee_installments is strictly child of school_fees:
                const { data: installmentsData } = await supabase
                    .from('fee_installments')
                    .select('*')
                    .in('fee_id', feeIds);

                if (installmentsData) setRawInstallments(installmentsData);
            } else {
                setRawInstallments([]);
            }

        } catch (err) {
            console.error('Error fetching detailed fees:', err);
        }
    }, [currentYear, schoolId]);


    // جلب الموظفين
    const fetchEmployees = useCallback(async () => {
        try {
            if (!schoolId) return;

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('school_id', schoolId) // Enforce School Identity
                .order('full_name');

            if (error) throw error;

            setEmployees(data?.map(e => ({
                id: e.id,
                employeeId: e.employee_id,
                fullName: e.full_name,
                nationalId: e.national_id,
                employeeType: e.employee_type,
                position: e.position,
                department: e.department,
                phone: e.phone,
                email: e.email,
                address: e.address,
                hireDate: e.hire_date,
                contractType: e.contract_type,
                baseSalary: e.base_salary,
                bankAccount: e.bank_account,
                bankName: e.bank_name,
                isActive: e.is_active,
                notes: e.notes,
                createdAt: e.created_at,
                updatedAt: e.updated_at,
            })) || []);
        } catch (err) {
            console.error('خطأ في جلب الموظفين:', err);
        }
    }, [schoolId]);

    // جلب الرواتب
    const fetchSalaries = useCallback(async (month?: string) => {
        try {
            if (!schoolId) return;

            let query = supabase
                .from('salaries')
                .select(`
                    *,
                    employees!inner (
                        id,
                        employee_id,
                        full_name,
                        employee_type,
                        position
                    ),
                    salary_items (*)
                `)
                .eq('academic_year_code', currentYear)
                .eq('school_id', schoolId) // Enforce School Identity
                .order('month', { ascending: false });

            if (month) {
                query = query.eq('month', month);
            }

            const { data, error } = await query;
            if (error) throw error;

            setSalaries(data?.map(s => ({
                id: s.id,
                employeeId: s.employee_id,
                employee: s.employees ? {
                    id: s.employees.id,
                    employeeId: s.employees.employee_id,
                    fullName: s.employees.full_name,
                    employeeType: s.employees.employee_type,
                    position: s.employees.position,
                } as Employee : undefined,
                academicYearCode: s.academic_year_code,
                month: s.month,
                baseSalary: s.base_salary,
                totalAllowances: s.total_allowances,
                totalDeductions: s.total_deductions,
                netSalary: s.net_salary,
                status: s.status,
                paymentDate: s.payment_date,
                paymentMethod: s.payment_method,
                notes: s.notes,
                createdBy: s.created_by,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
                items: s.salary_items?.map((i: any) => ({
                    id: i.id,
                    salaryId: i.salary_id,
                    itemType: i.item_type,
                    itemName: i.item_name,
                    amount: i.amount,
                    notes: i.notes,
                    createdAt: i.created_at
                })) || []
            })) || []);
        } catch (err) {
            console.error('خطأ في جلب الرواتب:', err);
        }
    }, [currentYear, schoolId]);

    // جلب الحركات المالية
    const fetchTransactions = useCallback(async () => {
        try {
            if (!schoolId) return;

            const { data, error } = await supabase
                .from('general_transactions')
                .select('*')
                .eq('academic_year_code', currentYear)
                .eq('school_id', schoolId) // Enforce School Identity
                .order('transaction_date', { ascending: false })
                .limit(100);

            if (error) throw error;

            setTransactions(data?.map(t => ({
                id: t.id,
                academicYearCode: t.academic_year_code,
                transactionDate: t.transaction_date,
                transactionType: t.transaction_type,
                categoryId: t.category_id,
                categoryType: t.category_type,
                amount: t.amount,
                description: t.description,
                referenceType: t.reference_type,
                referenceId: t.reference_id,
                paymentMethod: t.payment_method,
                receiptNumber: t.receipt_number,
                notes: t.notes,
                createdBy: t.created_by,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
            })) || []);
        } catch (err) {
            console.error('خطأ في جلب الحركات المالية:', err);
        }
    }, [currentYear, schoolId]);

    // جلب تصنيفات الإيرادات والمصروفات
    const fetchCategories = useCallback(async () => {
        try {
            const { data: revData } = await supabase
                .from('revenue_categories')
                .select('*')
                .eq('is_active', true);

            const { data: expData } = await supabase
                .from('expense_categories')
                .select('*')
                .eq('is_active', true);

            setRevenueCategories(revData?.map(c => ({
                id: c.id,
                categoryCode: c.category_code,
                categoryNameAr: c.category_name_ar,
                description: c.description,
                isActive: c.is_active,
            })) || []);

            setExpenseCategories(expData?.map(c => ({
                id: c.id,
                categoryCode: c.category_code,
                categoryNameAr: c.category_name_ar,
                description: c.description,
                isActive: c.is_active,
            })) || []);
        } catch (err) {
            console.error('خطأ في جلب التصنيفات:', err);
        }
    }, []);

    // تحميل جميع البيانات
    const loadAllData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await Promise.all([
                fetchSummary(),
                fetchDetailedFees(),
                fetchEmployees(),
                fetchSalaries(),
                fetchTransactions(),
                fetchCategories(),
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [fetchSummary, fetchDetailedFees, fetchEmployees, fetchSalaries, fetchTransactions, fetchCategories]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // =============================================
    // Real-time subscriptions للتحديث الفوري
    // =============================================
    useEffect(() => {
        // الاشتراك في تغييرات الموظفين
        const employeesChannel = supabase
            .channel('employees-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'employees' },
                () => {
                    console.log('تم تحديث بيانات الموظفين');
                    fetchEmployees();
                }
            )
            .subscribe();

        // الاشتراك في تغييرات الرواتب
        const salariesChannel = supabase
            .channel('salaries-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'salaries' },
                () => {
                    console.log('تم تحديث بيانات الرواتب');
                    fetchSalaries();
                    fetchSummary();
                }
            )
            .subscribe();

        // الاشتراك في تغييرات الحركات المالية العامة
        const generalTxChannel = supabase
            .channel('general-tx-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'general_transactions' },
                () => {
                    console.log('تم تحديث الحركات المالية');
                    fetchTransactions();
                    fetchSummary();
                }
            )
            .subscribe();

        // الاشتراك في تغييرات حركات الطلاب المالية
        const financialTxChannel = supabase
            .channel('financial-tx-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'financial_transactions' },
                () => {
                    console.log('تم تحديث حركات الطلاب المالية');
                    fetchSummary();
                    fetchDetailedFees();
                }
            )
            .subscribe();

        // تنظيف الاشتراكات عند إلغاء المكون
        return () => {
            supabase.removeChannel(employeesChannel);
            supabase.removeChannel(salariesChannel);
            supabase.removeChannel(generalTxChannel);
            supabase.removeChannel(financialTxChannel);
        };
    }, [fetchEmployees, fetchSalaries, fetchTransactions, fetchSummary, fetchDetailedFees]);

    // =============================================
    // وظائف الإضافة والتعديل
    // =============================================

    // إضافة موظف جديد
    const addEmployee = async (data: CreateEmployeeDTO): Promise<Employee | null> => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');

            const employeeId = `EMP${Date.now().toString().slice(-6)}`;

            const { data: newEmployee, error } = await supabase
                .from('employees')
                .insert({
                    employee_id: employeeId,
                    full_name: data.fullName,
                    national_id: data.nationalId,
                    employee_type: data.employeeType,
                    position: data.position,
                    department: data.department,
                    phone: data.phone,
                    email: data.email,
                    hire_date: data.hireDate,
                    contractType: data.contractType || 'دائم',
                    base_salary: data.baseSalary,
                    school_id: schoolId, // Enforce School Identity
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;

            await fetchEmployees();
            return newEmployee;
        } catch (err) {
            console.error('خطأ في إضافة الموظف:', err);
            throw err;
        }
    };

    // إضافة حركة مالية عامة
    const addTransaction = async (data: CreateTransactionDTO): Promise<GeneralTransaction | null> => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');

            const { data: newTx, error } = await supabase
                .from('general_transactions')
                .insert({
                    academic_year_code: currentYear,
                    transaction_date: data.transactionDate,
                    transaction_type: data.transactionType,
                    category_id: data.categoryId,
                    category_type: data.transactionType === 'إيراد' ? 'revenue' : 'expense',
                    amount: data.amount,
                    description: data.description,
                    reference_type: 'general',
                    payment_method: data.paymentMethod,
                    receipt_number: data.receiptNumber,
                    notes: data.notes,
                    school_id: schoolId, // Enforce School Identity
                    created_by: 'current_user',
                })
                .select()
                .single();

            if (error) throw error;

            await Promise.all([fetchTransactions(), fetchSummary()]);
            return newTx;
        } catch (err) {
            console.error('خطأ في إضافة الحركة المالية:', err);
            throw err;
        }
    };

    // صرف راتب
    const paySalary = async (salaryId: string, paymentDate: string, paymentMethod: string): Promise<boolean> => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');

            const salary = salaries.find(s => s.id === salaryId);
            if (!salary) throw new Error('الراتب غير موجود');

            // تحديث حالة الراتب
            const { error: updateError } = await supabase
                .from('salaries')
                .update({
                    status: 'تم الصرف',
                    payment_date: paymentDate,
                    payment_method: paymentMethod,
                })
                .eq('id', salaryId)
                .eq('school_id', schoolId); // Enforce School Identity

            if (updateError) throw updateError;

            // إضافة الراتب كمصروف في الحركات العامة
            const { error: txError } = await supabase
                .from('general_transactions')
                .insert({
                    academic_year_code: currentYear,
                    transaction_date: paymentDate,
                    transaction_type: 'مصروف',
                    category_type: 'expense',
                    amount: salary.netSalary,
                    description: `راتب ${salary.employee?.fullName || 'موظف'} - ${salary.month}`,
                    reference_type: 'salary',
                    reference_id: salaryId,
                    payment_method: paymentMethod,
                    school_id: schoolId, // Enforce School Identity
                    created_by: 'current_user',
                });

            if (txError) console.error('Warning: Could not add salary to transactions', txError);

            await Promise.all([fetchSalaries(), fetchSummary()]);
            return true;
        } catch (err) {
            console.error('خطأ في صرف الراتب:', err);
            throw err;
        }
    };

    // إنشاء رواتب الشهر
    const generateMonthlySalaries = async (month: string): Promise<number> => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً'); // Enforce Fail Fast

            const activeEmployees = employees.filter(e => e.isActive);
            let created = 0;

            // 1. Fetch System Settings (Smart Configuration)
            const { data: settingsData } = await supabase
                .from('hr_system_settings')
                .select('*')
                .eq('school_id', schoolId) // Enforce School Identity (assuming table has school_id)
                .maybeSingle();

            // Default 'Smart' Rules
            const settings = settingsData || {
                absence_penalty_rate: 1.0,
                lateness_penalty_rate: 1.0,
                early_departure_penalty_rate: 1.0,
                overtime_rate: 1.5,
                lateness_grace_period_minutes: 15,
                max_grace_period_minutes: 30,
                early_departure_grace_minutes: 15,
                official_start_time: '08:00',
                official_end_time: '15:45',
                working_hours_per_day: 8,
                working_days_per_month: 30,
                weekend_days: [5, 6] // Friday, Saturday
            };

            // 2. Fetch Data Scope
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = `${month}-01`;
            const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

            // A. Fetch Calendar Overrides (The Smart Part)
            const { data: overridesData } = await supabase
                .from('hr_calendar_overrides')
                .select('*')
                .eq('school_id', schoolId) // Enforce School Identity
                .gte('date', startDate)
                .lte('date', endDate);

            const overrides = (overridesData || []) as any[];

            // B. Fetch Attendance Records for this month (ALL employees)
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('employee_attendance')
                .select('*')
                .eq('school_id', schoolId) // Enforce School Identity
                .gte('date', startDate)
                .lte('date', endDate);

            if (attendanceError) throw attendanceError;
            const allAttendance = attendanceData as any[];



            // 3. Process Each Employee
            for (const emp of activeEmployees) {
                // Skip if salary already exists
                const existing = salaries.find(s => s.employeeId === emp.id && s.month === month);
                if (existing) continue;

                const empAttendance = allAttendance.filter(a => a.employee_id === emp.id);

                let totalAllowances = 0;
                let totalDeductions = 0;
                let salaryItemsToInsert: any[] = [];

                // Accumulators for aggregation
                let accLatenessCost = 0;
                let accEarlyCost = 0;
                let accOvertimePay = 0;
                let accAbsenceCost = 0;

                const monthDaysCount = new Date(year, monthNum, 0).getDate();
                const standardDayRate = emp.baseSalary / (settings.working_days_per_month || 30);
                const minuteRate = standardDayRate / (settings.working_hours_per_day || 8) / 60;

                // --- Day-by-Day Loop ---
                for (let d = 1; d <= monthDaysCount; d++) {
                    const currentDayStr = `${month}-${String(d).padStart(2, '0')}`;
                    const currentDayDate = new Date(currentDayStr);

                    // 1. Get Smart Config
                    // Priority 1: Override -> 2: Week Default -> 3: Global Weekend
                    let dayType = 'work';
                    let payRate = 1.0;
                    let bonus = 0;
                    let isOff = false;
                    let endTimeStr = settings.official_end_time;

                    const override = overrides.find(o => o.date === currentDayStr);
                    if (override) {
                        dayType = override.day_type;
                        payRate = override.pay_rate ?? 1.0;
                        bonus = override.bonus_fixed ?? 0;
                        isOff = dayType.includes('off');
                        if (override.custom_end_time) endTimeStr = override.custom_end_time;
                    } else {
                        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const dayName = days[currentDayDate.getDay()];
                        const sett = settings.day_settings?.[dayName];
                        if (sett) {
                            if (sett.is_off) isOff = true;
                            if (sett.end_time) endTimeStr = sett.end_time;
                        } else if (settings.weekend_days?.includes(currentDayDate.getDay())) {
                            isOff = true;
                        }
                    }

                    // 2. Attendance Status
                    const attRecord = empAttendance.find(r => r.date === currentDayStr);
                    const isPresent = attRecord && (attRecord.status === 'حاضر' || attRecord.status === 'متأخر' || attRecord.status === 'مأمورية');
                    const isAbsent = !isPresent && !isOff;



                    // 4. Apply Rules

                    // A. Fixed Bonus
                    if (bonus > 0) {
                        totalAllowances += bonus;
                        salaryItemsToInsert.push({ item_type: 'استحقاق', item_name: `مكافأة يوم ${d}`, amount: bonus, notes: 'مكافأة خاصة من التقويم' });
                    }

                    // B. Rate Multiplier (Allowances)
                    if (payRate > 1.0 && (isPresent || isOff)) {
                        const extraRatio = payRate - 1.0;
                        const extraAmount = standardDayRate * extraRatio;
                        totalAllowances += extraAmount;
                        salaryItemsToInsert.push({ item_type: 'استحقاق', item_name: `علاوة يوم ${d}`, amount: parseFloat(extraAmount.toFixed(2)), notes: `علاوة يوم (${payRate}x)` });
                    }

                    // C. Absence
                    if (isAbsent) {
                        const deduction = standardDayRate * settings.absence_penalty_rate;
                        accAbsenceCost += deduction;
                    }

                    // D. Lateness, Early, Overtime (Only if present)
                    if (isPresent && attRecord) {
                        // Lateness
                        if (attRecord.late_minutes > 0) {
                            const mins = attRecord.late_minutes;
                            let penaltyMins = 0;
                            if (mins > settings.max_grace_period_minutes) penaltyMins = mins;
                            else if (mins > settings.lateness_grace_period_minutes) penaltyMins = mins - settings.lateness_grace_period_minutes;

                            if (penaltyMins > 0) {
                                accLatenessCost += (penaltyMins * minuteRate * settings.lateness_penalty_rate);
                            }
                        }

                        // Early Departure
                        if (attRecord.check_out_time) {
                            const officialEnd = new Date(`2000-01-01T${endTimeStr}:00`);
                            const actualOut = new Date(`2000-01-01T${attRecord.check_out_time}`);
                            if (actualOut < officialEnd) {
                                const diffMs = officialEnd.getTime() - actualOut.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                if (diffMins > settings.early_departure_grace_minutes) {
                                    accEarlyCost += (diffMins * minuteRate * settings.early_departure_penalty_rate);
                                }
                            }
                        }

                        // Overtime
                        let otMins = attRecord.overtime_minutes || 0;
                        if (otMins === 0 && attRecord.worked_hours > (settings.working_hours_per_day + 0.25)) {
                            otMins = (attRecord.worked_hours - settings.working_hours_per_day) * 60;
                        }
                        if (otMins > 0) {
                            accOvertimePay += (otMins * minuteRate * settings.overtime_rate);
                        }
                    }

                } // End Day Loop

                // Apply Accumulators
                if (accAbsenceCost > 0) {
                    totalDeductions += accAbsenceCost;
                    salaryItemsToInsert.push({ item_type: 'خصم', item_name: 'خصم غياب', amount: parseFloat(accAbsenceCost.toFixed(2)), notes: 'غياب أيام عمل' });
                }
                if (accLatenessCost > 0) {
                    totalDeductions += accLatenessCost;
                    salaryItemsToInsert.push({ item_type: 'خصم', item_name: 'خصم تأخير', amount: parseFloat(accLatenessCost.toFixed(2)), notes: 'تأخيرات الشهر' });
                }
                if (accEarlyCost > 0) {
                    totalDeductions += accEarlyCost;
                    salaryItemsToInsert.push({ item_type: 'خصم', item_name: 'انصراف مبكر', amount: parseFloat(accEarlyCost.toFixed(2)), notes: 'انصراف قبل الموعد' });
                }
                if (accOvertimePay > 0) {
                    totalAllowances += accOvertimePay;
                    salaryItemsToInsert.push({ item_type: 'بدل', item_name: 'عمل إضافي', amount: parseFloat(accOvertimePay.toFixed(2)), notes: 'ساعات إضافية' });
                }


                // Final Net Salary
                const netSalary = Math.max(0, emp.baseSalary + totalAllowances - totalDeductions);

                // Insert into DB
                const { data: newSalary, error: salaryError } = await supabase
                    .from('salaries')
                    .insert({
                        employee_id: emp.id,
                        academic_year_code: currentYear,
                        month: month,
                        base_salary: emp.baseSalary,
                        total_allowances: parseFloat(totalAllowances.toFixed(2)),
                        total_deductions: parseFloat(totalDeductions.toFixed(2)),
                        net_salary: parseFloat(netSalary.toFixed(2)),
                        school_id: schoolId,
                        status: 'مستحق'
                    })
                    .select()
                    .single();

                if (salaryError) { console.error(salaryError); continue; }

                if (salaryItemsToInsert.length > 0 && newSalary) {
                    const itemsWithId = salaryItemsToInsert.map(i => ({ ...i, salary_id: newSalary.id }));
                    await supabase.from('salary_items').insert(itemsWithId);
                }

                created++;
            }

            await fetchSalaries(month);
            return created;

        } catch (err) {
            console.error('خطأ في إنشاء الرواتب:', err);
            throw err;
        }
    };

    return {
        // البيانات
        loading,
        error,
        summary,
        employees,
        salaries,
        transactions,
        revenueCategories,
        expenseCategories,
        schoolFees: rawSchoolFees,
        installments: rawInstallments,

        // الوظائف
        refreshData: loadAllData,
        fetchSalaries,
        addEmployee,
        addTransaction,
        paySalary,
        generateMonthlySalaries,
        studentPayments: transactions.filter(t => t.description?.includes('دفعة') || t.transactionType === 'إيراد'),
    };
}

