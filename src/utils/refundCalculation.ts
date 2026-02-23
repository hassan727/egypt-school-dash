import type { Refund, RefundDeduction, FinancialTransaction, FeeType } from '@/types/student';

export interface RefundCalculationInput {
    totalPaid: number;
    totalStudyExpenses: number;
    monthsStudied: number;
    totalMonthsInYear: number;
    monthlyTuitionFee: number;
    adminFeePercentage: number;
    adminFeeFixed?: number;
    registrationFeeAmount?: number;
    otherNonRefundableFees?: number;
    feeTypes?: FeeType[];
}

export interface RefundCalculationResult {
    totalRefundable: number;
    deductions: RefundDeduction[];
    totalDeductions: number;
    finalRefundAmount: number;
    breakdown: {
        registrationFeeDeduction: number;
        studiedMonthCost: number;
        adminFee: number;
        explanation: string;
    };
}

export const calculateRefundAmount = (input: RefundCalculationInput): RefundCalculationResult => {
    const {
        totalPaid,
        totalStudyExpenses,
        monthsStudied,
        totalMonthsInYear,
        monthlyTuitionFee,
        adminFeePercentage,
        adminFeeFixed,
        registrationFeeAmount = 0,
        otherNonRefundableFees = 0,
        feeTypes = []
    } = input;

    const deductions: RefundDeduction[] = [];
    let totalDeductions = 0;

    // 1. حساب رسوم التسجيل والقبول (غير قابلة للاسترداد)
    const registrationDeduction = registrationFeeAmount || 0;
    if (registrationDeduction > 0) {
        deductions.push({
            deductionType: 'رسم تسجيل',
            description: 'رسوم القبول والتسجيل - غير قابلة للاسترداد',
            amount: registrationDeduction,
            reason: 'سياسة المدرسة'
        });
        totalDeductions += registrationDeduction;
    }

    // 2. حساب قيمة الشهر المدروس من الرسوم الدراسية
    const monthlyFee = monthlyTuitionFee || (totalStudyExpenses / totalMonthsInYear);
    const studiedMonthCost = monthlyFee * monthsStudied;
    
    if (studiedMonthCost > 0) {
        deductions.push({
            deductionType: 'شهر دراسي',
            description: `قيمة ${monthsStudied} شهور دراسية`,
            amount: studiedMonthCost,
            percentage: (monthsStudied / totalMonthsInYear) * 100,
            reason: `الطالب درس ${monthsStudied} شهور من السنة الدراسية`
        });
        totalDeductions += studiedMonthCost;
    }

    // 3. حساب الرسوم الإدارية (رسوم المعالجة)
    let adminFee = adminFeeFixed || 0;
    if (!adminFeeFixed && adminFeePercentage > 0) {
        const remainingAfterDeductions = Math.max(0, totalPaid - totalDeductions);
        adminFee = (remainingAfterDeductions * adminFeePercentage) / 100;
    }

    if (adminFee > 0) {
        deductions.push({
            deductionType: 'رسم إداري',
            description: 'رسوم إدارية لمعالجة طلب الاسترداد',
            amount: adminFee,
            percentage: adminFeePercentage,
            reason: 'تكاليف معالجة الطلب والإجراءات الإدارية'
        });
        totalDeductions += adminFee;
    }

    // 4. خصم الرسوم غير القابلة للاسترداد الأخرى
    if (otherNonRefundableFees > 0) {
        deductions.push({
            deductionType: 'خدمة مستهلكة',
            description: 'رسوم غير قابلة للاسترداد (كتب، زي، إلخ)',
            amount: otherNonRefundableFees,
            reason: 'خدمات مستهلكة أثناء الفترة الدراسية'
        });
        totalDeductions += otherNonRefundableFees;
    }

    // 5. حساب المبلغ القابل للاسترداد والمبلغ النهائي
    const totalRefundable = Math.max(0, totalPaid - registrationDeduction - otherNonRefundableFees);
    const finalRefundAmount = Math.max(0, totalRefundable - (studiedMonthCost + adminFee));

    return {
        totalRefundable,
        deductions,
        totalDeductions: Math.min(totalDeductions, totalPaid),
        finalRefundAmount,
        breakdown: {
            registrationFeeDeduction: registrationDeduction,
            studiedMonthCost: studiedMonthCost,
            adminFee: adminFee,
            explanation: `إجمالي المدفوعات: ${totalPaid} ج.م\n` +
                        `خصم رسوم التسجيل: -${registrationDeduction} ج.م\n` +
                        `خصم قيمة الشهر المدروس: -${studiedMonthCost.toFixed(2)} ج.م\n` +
                        `خصم الرسوم الإدارية: -${adminFee.toFixed(2)} ج.م\n` +
                        `المبلغ المسترد النهائي: ${finalRefundAmount.toFixed(2)} ج.م`
        }
    };
};

export const calculateMonthsStudied = (enrollmentDate: Date, withdrawalDate: Date): number => {
    const monthsDiff = (withdrawalDate.getFullYear() - enrollmentDate.getFullYear()) * 12
        + (withdrawalDate.getMonth() - enrollmentDate.getMonth());
    return Math.max(1, monthsDiff + 1);
};

export const createRefundFromCalculation = (
    studentId: string,
    academicYear: string,
    totalPaid: number,
    calculationResult: RefundCalculationResult,
    withdrawalDate: string,
    notes?: string
): Partial<Refund> => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
        studentId,
        academicYearCode: academicYear,
        requestDate: today,
        withdrawalDate,
        status: 'معلق',
        totalPaid,
        totalRefundable: calculationResult.totalRefundable,
        totalDeductions: calculationResult.totalDeductions,
        finalRefundAmount: calculationResult.finalRefundAmount,
        notes: notes || `تم حساب المبلغ المسترد تلقائياً:\n${calculationResult.breakdown.explanation}`,
        deductions: calculationResult.deductions
    };
};

export const formatCurrencyAR = (amount: number): string => {
    return `${amount.toFixed(2)} ج.م`;
};

export const getRefundStatusInArabic = (status: string): string => {
    const statusMap: Record<string, string> = {
        'معلق': 'قيد الانتظار',
        'موافق عليه': 'تمت الموافقة',
        'مرفوض': 'تم الرفض',
        'مدفوع': 'تم الدفع'
    };
    return statusMap[status] || status;
};
