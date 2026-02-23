import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SchoolFeesSection } from './SchoolFeesSection';
import { SchoolFees, OtherExpense, Installment } from '@/types/student';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface SetupFinancialDialogProps {
    studentId: string;
    enrollmentData?: { stage: string; class: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

/**
 * حوار إعداد الملف المالي للطلاب المستوردين
 * يسمح بإدخال المصروفات الدراسية والأقساط للطلاب الذين ليس لديهم بيانات مالية
 */
export function SetupFinancialDialog({
    studentId,
    enrollmentData,
    open,
    onOpenChange,
    onSuccess,
}: SetupFinancialDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    // استخدام refs لتخزين البيانات من SchoolFeesSection
    const feesDataRef = useRef<SchoolFees | null>(null);
    const installmentsRef = useRef<Installment[]>([]);
    const expensesRef = useRef<OtherExpense[]>([]);
    const optionalExpensesRef = useRef<any>(null);
    const auditLogRef = useRef<any[]>([]);

    // دالة حفظ المصروفات الدراسية
    const handleSaveFees = async (
        feesData: SchoolFees,
        installments: Installment[],
        auditLog: any[]
    ) => {
        // تخزين البيانات في refs
        feesDataRef.current = feesData;
        installmentsRef.current = installments;
        auditLogRef.current = auditLog;
    };

    // دالة حفظ المصروفات الأخرى
    const handleSaveExpenses = async (
        expenses: OtherExpense[],
        optionalExpenses: any
    ) => {
        // تخزين البيانات في refs
        expensesRef.current = expenses;
        optionalExpensesRef.current = optionalExpenses;
    };

    // دالة الحفظ النهائية
    const handleFinalSave = async () => {
        try {
            setIsSaving(true);

            // التحقق من وجود البيانات الأساسية
            if (!feesDataRef.current || !feesDataRef.current.totalAmount || feesDataRef.current.totalAmount === 0) {
                toast.error('يرجى إدخال المصروفات الدراسية أولاً');
                setIsSaving(false);
                return;
            }

            // الحصول على السنة الدراسية النشطة
            const { data: activeYear, error: yearError } = await supabase
                .from('academic_years')
                .select('year_code')
                .eq('is_active', true)
                .single();

            if (yearError) {
                console.error('Error fetching active academic year:', yearError);
                toast.error('فشل في الحصول على السنة الدراسية النشطة');
                setIsSaving(false);
                return;
            }

            // 1. حساب المبلغ الأصلي قبل الخصم
            let originalAmount = feesDataRef.current.totalAmount;
            let discountValue = 0;

            // البحث عن الخصم في سجل الأنشطة
            const discountLog = auditLogRef.current.find(log => log.action.includes('تطبيق خصم'));
            if (discountLog) {
                const discountMatch = discountLog.action.match(/تطبيق خصم (\d+) جنيه/);
                if (discountMatch) {
                    discountValue = parseFloat(discountMatch[1]);
                    // المبلغ الأصلي = المبلغ الحالي + الخصم
                    originalAmount = feesDataRef.current.totalAmount + discountValue;
                }
            }

            // 2. إنشاء سجل المصروفات الدراسية بالمبلغ الأصلي
            const { data: schoolFeesData, error: feesError } = await supabase
                .from('school_fees')
                .insert({
                    student_id: studentId,
                    academic_year_code: activeYear.year_code,
                    total_amount: originalAmount, // المبلغ الأصلي قبل الخصم
                    installment_count: feesDataRef.current.installmentCount,
                    advance_payment: feesDataRef.current.advancePayment || 0,
                })
                .select()
                .single();

            if (feesError) {
                console.error('Error creating school fees:', feesError);
                toast.error('فشل في حفظ المصروفات الدراسية: ' + feesError.message);
                setIsSaving(false);
                return;
            }

            // 2. إنشاء الأقساط
            if (installmentsRef.current && installmentsRef.current.length > 0) {
                const installmentsToInsert = installmentsRef.current.map((inst) => ({
                    fee_id: schoolFeesData.id,
                    installment_number: inst.installmentNumber,
                    amount: inst.amount,
                    due_date: inst.dueDate,
                    paid: inst.paid || false,
                    paid_date: inst.paidDate || null,
                }));

                const { error: installmentsError } = await supabase
                    .from('fee_installments')
                    .insert(installmentsToInsert);

                if (installmentsError) {
                    console.error('Error creating installments:', installmentsError);
                    toast.error('فشل في حفظ الأقساط: ' + installmentsError.message);
                    setIsSaving(false);
                    return;
                }
            }

            // 3. حفظ المصروفات الأخرى
            if (expensesRef.current && expensesRef.current.length > 0) {
                const expensesToInsert = expensesRef.current
                    .filter((exp) => exp.expenseType && exp.totalPrice > 0)
                    .map((exp) => ({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: exp.expenseType,
                        quantity: exp.quantity,
                        total_price: exp.totalPrice,
                        date: exp.date,
                    }));

                if (expensesToInsert.length > 0) {
                    const { error: expensesError } = await supabase
                        .from('other_expenses')
                        .insert(expensesToInsert);

                    if (expensesError) {
                        console.error('Error creating other expenses:', expensesError);
                        toast.error('فشل في حفظ المصروفات الأخرى: ' + expensesError.message);
                        // لا نوقف العملية هنا، المصروفات الأخرى اختيارية
                    }
                }
            }

            // 4. حفظ الخصم كمعاملة مالية (إذا وُجد)
            // نستخدم نفس discountValue المحسوب في الخطوة 1
            if (discountValue > 0) {
                const { error: discountError } = await supabase
                    .from('financial_transactions')
                    .insert({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        transaction_type: 'خصم',
                        amount: discountValue,
                        description: `خصم ${discountValue} جنيه`,
                        transaction_date: new Date().toISOString().split('T')[0],
                        payment_method: 'خصم',
                    });

                if (discountError) {
                    console.error('Error creating discount transaction:', discountError);
                    // لا نوقف العملية، الخصم اختياري
                }
            }

            // 5. حفظ المصروفات الاختيارية
            if (optionalExpensesRef.current) {
                const optionalExpensesToInsert = [];
                const opt = optionalExpensesRef.current;

                if (opt.transportation?.enabled) {
                    optionalExpensesToInsert.push({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: 'نقل مدرسي',
                        quantity: opt.transportation.months,
                        total_price: opt.transportation.total,
                        date: new Date().toISOString().split('T')[0],
                    });
                }

                if (opt.uniform?.enabled) {
                    optionalExpensesToInsert.push({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: 'زي مدرسي',
                        quantity: 1,
                        total_price: opt.uniform.total,
                        date: new Date().toISOString().split('T')[0],
                    });
                }

                if (opt.digitalPlatforms?.enabled) {
                    optionalExpensesToInsert.push({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: 'منصات رقمية',
                        quantity: 1,
                        total_price: opt.digitalPlatforms.total,
                        date: new Date().toISOString().split('T')[0],
                    });
                }

                if (opt.trips?.enabled) {
                    optionalExpensesToInsert.push({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: opt.trips.activityType || 'رحلات',
                        quantity: opt.trips.quantity,
                        total_price: opt.trips.total,
                        date: new Date().toISOString().split('T')[0],
                    });
                }

                if (opt.events?.enabled) {
                    optionalExpensesToInsert.push({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: opt.events.eventType || 'فعاليات',
                        quantity: opt.events.tickets,
                        total_price: opt.events.total,
                        date: new Date().toISOString().split('T')[0],
                    });
                }

                if (opt.books?.enabled) {
                    optionalExpensesToInsert.push({
                        student_id: studentId,
                        academic_year_code: activeYear.year_code,
                        expense_type: 'كتب',
                        quantity: opt.books.quantity,
                        total_price: opt.books.total,
                        date: new Date().toISOString().split('T')[0],
                    });
                }

                if (optionalExpensesToInsert.length > 0) {
                    const { error: optionalError } = await supabase
                        .from('other_expenses')
                        .insert(optionalExpensesToInsert);

                    if (optionalError) {
                        console.error('Error creating optional expenses:', optionalError);
                        // لا نوقف العملية، المصروفات الاختيارية اختيارية
                    }
                }
            }

            toast.success('تم إعداد الملف المالي بنجاح! 🎉');

            // إغلاق الحوار
            onOpenChange(false);

            // استدعاء دالة النجاح
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error in handleFinalSave:', error);
            toast.error('حدث خطأ أثناء حفظ البيانات');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                        🪙 إعداد الملف المالي
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        قم بإدخال المصروفات الدراسية والأقساط للطالب. هذه الخطوة مطلوبة لإكمال
                        ملف الطالب المالي.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <SchoolFeesSection
                        enrollmentData={enrollmentData}
                        onSaveFees={handleSaveFees}
                        onSaveExpenses={handleSaveExpenses}
                        isReadOnly={false}
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleFinalSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSaving ? (
                            <>
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                جاري الحفظ...
                            </>
                        ) : (
                            'حفظ وإنهاء الإعداد'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
