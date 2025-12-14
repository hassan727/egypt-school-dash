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

export function useFinanceData(academicYear?: string) {
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
            // 1. جلب الدفعات المقدمة من school_fees
            const { data: feesData } = await supabase
                .from('school_fees')
                .select('student_id, total_amount, advance_payment')
                .eq('academic_year_code', currentYear);

            const totalFeesExpected = feesData?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
            const totalAdvancePayments = feesData?.reduce((sum, f) => sum + (f.advance_payment || 0), 0) || 0;

            // 2. جلب مدفوعات الطلاب (نوع 'دفعة')
            const { data: studentPayments } = await supabase
                .from('financial_transactions')
                .select('amount, student_id')
                .eq('academic_year_code', currentYear)
                .eq('transaction_type', 'دفعة');

            const totalStudentPayments = studentPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

            // 3. جلب خصومات الطلاب (نوع 'خصم')
            const { data: discountsData } = await supabase
                .from('financial_transactions')
                .select('amount')
                .eq('academic_year_code', currentYear)
                .eq('transaction_type', 'خصم');

            const totalStudentDiscounts = discountsData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

            // 4. جلب الحركات المالية العامة
            const { data: generalTx } = await supabase
                .from('general_transactions')
                .select('*')
                .eq('academic_year_code', currentYear);

            const generalRevenue = generalTx
                ?.filter(t => t.transaction_type === 'إيراد')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            const generalExpenses = generalTx
                ?.filter(t => t.transaction_type === 'مصروف')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            // 5. جلب الرواتب
            const { data: pendingSalariesData } = await supabase
                .from('salaries')
                .select('net_salary')
                .eq('academic_year_code', currentYear)
                .eq('status', 'مستحق');

            const totalPendingSalaries = pendingSalariesData?.reduce((sum, s) => sum + (s.net_salary || 0), 0) || 0;

            const { data: paidSalariesData } = await supabase
                .from('salaries')
                .select('net_salary')
                .eq('academic_year_code', currentYear)
                .eq('status', 'تم الصرف');

            const totalPaidSalaries = paidSalariesData?.reduce((sum, s) => sum + (s.net_salary || 0), 0) || 0;

            // ===== الحسابات الصحيحة =====

            // إجمالي الإيرادات = إيرادات عامة + مدفوعات الطلاب + الدفعات المقدمة
            const totalRevenue = generalRevenue + totalStudentPayments + totalAdvancePayments;

            // إجمالي المصروفات = مصروفات عامة + رواتب مدفوعة
            const totalExpenses = generalExpenses + totalPaidSalaries;

            // تحصيل الطلاب = مدفوعات + مقدمات
            const studentCollection = totalStudentPayments + totalAdvancePayments;

            // نسبة التحصيل = (المدفوع + المقدمات) / الرسوم المطلوبة
            const collectionRate = totalFeesExpected > 0
                ? (studentCollection / totalFeesExpected) * 100
                : 0;

            // حساب الطلاب المتأخرين (من دفع أقل من 50% مع احتساب المقدمات والخصومات)
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
                studentPayments: studentCollection, // مدفوعات + مقدمات
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
    }, [currentYear]);

    // Data states for detail views/alerts
    const [rawSchoolFees, setRawSchoolFees] = useState<any[]>([]);
    const [rawInstallments, setRawInstallments] = useState<any[]>([]);

    // Fetch detailed fees and installments
    const fetchDetailedFees = useCallback(async () => {
        try {
            // Fetch school_fees
            const { data: fees } = await supabase
                .from('school_fees')
                .select('*')
                .eq('academic_year_code', currentYear);

            if (fees) setRawSchoolFees(fees);

            // Fetch installments linked to these fees or year
            // Assuming fee_installments is correct table name based on context
            const { data: insts } = await supabase
                .from('fee_installments')
                .select('*')
            // If fee_installments doesn't have academic_year directly, we filter by fee_id match in JS or join
            // checking usage suggests it might be linked to school_fees
            // We'll fetch all checks for now or join if possible. 
            // Using nested select might be better but let's separate for now.

            // To be safe and optimal, let's fetch installments where fee_id is in the fees list
            if (fees && fees.length > 0) {
                const feeIds = fees.map(f => f.id);
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
    }, [currentYear]);


    // جلب الموظفين
    const fetchEmployees = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
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
    }, []);

    // جلب الرواتب
    const fetchSalaries = useCallback(async (month?: string) => {
        try {
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
                    )
                `)
                .eq('academic_year_code', currentYear)
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
            })) || []);
        } catch (err) {
            console.error('خطأ في جلب الرواتب:', err);
        }
    }, [currentYear]);

    // جلب الحركات المالية
    const fetchTransactions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('general_transactions')
                .select('*')
                .eq('academic_year_code', currentYear)
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
    }, [currentYear]);

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
                    contract_type: data.contractType || 'دائم',
                    base_salary: data.baseSalary,
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
                .eq('id', salaryId);

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
            const activeEmployees = employees.filter(e => e.isActive);
            let created = 0;

            for (const emp of activeEmployees) {
                // تحقق من عدم وجود راتب مسبق
                const existing = salaries.find(s => s.employeeId === emp.id && s.month === month);
                if (existing) continue;

                const { error } = await supabase
                    .from('salaries')
                    .insert({
                        employee_id: emp.id,
                        academic_year_code: currentYear,
                        month: month,
                        base_salary: emp.baseSalary,
                        total_allowances: 0,
                        total_deductions: 0,
                        net_salary: emp.baseSalary,
                        status: 'مستحق',
                    });

                if (!error) created++;
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
        studentPayments: transactions.filter(t => t.description?.includes('دفعة') || t.transactionType === 'إيراد'), // Basic filtering, can be refined based on actual data structure
    };
}
