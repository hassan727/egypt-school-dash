import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Calculator, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { StudentProfile, Refund } from '@/types/student';
import { calculateRefundAmount, type RefundCalculationInput, type RefundCalculationResult } from '@/utils/refundCalculation';
import { getEgyptianDateString } from '@/utils/helpers';

interface RefundCalculationDetailedFormProps {
    studentProfile: StudentProfile;
    studentId: string;
    academicYear: string;
    onCalculate?: (result: RefundCalculationResult) => void;
    onSubmit?: (refund: Partial<Refund>) => void;
    loading?: boolean;
}

export function RefundCalculationDetailedForm({
    studentProfile,
    studentId,
    academicYear,
    onCalculate,
    onSubmit,
    loading = false
}: RefundCalculationDetailedFormProps) {
    const [calculationResult, setCalculationResult] = useState<RefundCalculationResult | null>(null);
    const [calculating, setCalculating] = useState(false);

    const [formData, setFormData] = useState({
        withdrawalRequestDate: getEgyptianDateString(),
        lastAttendanceDate: getEgyptianDateString(),
        monthsStudied: 1,
        monthlyTuitionFee: 0,
        adminFeeAmount: 500,
        registrationFeeAmount: 0,
        booksActivityFeesAmount: 0,
        notes: '',
        approverName: '',
        status: 'قيد المراجعة' as const
    });

    useEffect(() => {
        if (studentProfile?.schoolFees) {
            const monthlyFee = (studentProfile.schoolFees.totalAmount || 0) / 9;
            setFormData(prev => ({
                ...prev,
                monthlyTuitionFee: monthlyFee,
                registrationFeeAmount: 2000,
                booksActivityFeesAmount: 1000
            }));
        }
    }, [studentProfile?.schoolFees]);

    const calculateTotalPaid = (): number => {
        // الدفعة المقدمة من school_fees
        const advancePayment = studentProfile?.schoolFees?.advancePayment || 0;

        // حساب المبالغ المدفوعة من معاملات النوع 'دفعة'
        const paidFromTransactions = (studentProfile?.financialTransactions || [])
            .filter(t => t.transactionType === 'دفعة')
            .reduce((sum, t) => sum + t.amount, 0);

        // حساب المبالغ المدفوعة من الأقساط المدفوعة (fee_installments)
        const paidFromInstallments = studentProfile?.schoolFees?.installments
            ?.filter(inst => inst.paid)
            .reduce((sum, inst) => sum + inst.amount, 0) || 0;

        // إجمالي المدفوع = الدفعة المقدمة + أكبر قيمة من (المعاملات أو الأقساط)
        // نأخذ الأكبر لتجنب الازدواج بين المعاملات والأقساط
        return advancePayment + Math.max(paidFromTransactions, paidFromInstallments);
    };

    const performCalculation = useCallback(() => {
        try {
            const totalPaid = calculateTotalPaid();
            if (totalPaid <= 0) return;

            const input: RefundCalculationInput = {
                totalPaid,
                totalStudyExpenses: studentProfile?.schoolFees?.totalAmount || 0,
                monthsStudied: formData.monthsStudied,
                totalMonthsInYear: 9,
                monthlyTuitionFee: formData.monthlyTuitionFee,
                adminFeePercentage: 0,
                adminFeeFixed: formData.adminFeeAmount,
                registrationFeeAmount: formData.registrationFeeAmount,
                otherNonRefundableFees: formData.booksActivityFeesAmount
            };

            const result = calculateRefundAmount(input);
            setCalculationResult(result);
            if (onCalculate) onCalculate(result);
        } catch (error) {
            console.error('خطأ في حساب الاسترداد:', error);
        }
    }, [formData, studentProfile?.schoolFees?.totalAmount, onCalculate]);

    useEffect(() => {
        const timer = setTimeout(() => performCalculation(), 300);
        return () => clearTimeout(timer);
    }, [performCalculation]);

    const handleCalculate = async () => {
        try {
            setCalculating(true);
            performCalculation();
            toast.success('تم حساب المبلغ المسترد بنجاح');
        } catch (error) {
            console.error('خطأ في حساب الاسترداد:', error);
            toast.error('حدث خطأ أثناء حساب المبلغ المسترد');
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = () => {
        if (!calculationResult) {
            toast.error('يرجى حساب المبلغ المسترد أولاً');
            return;
        }

        if (!formData.approverName) {
            toast.error('يرجى إدخال اسم الموظف المسؤول');
            return;
        }

        if (onSubmit) {
            const refundData: Partial<Refund> = {
                studentId,
                academicYearCode: academicYear,
                requestDate: formData.withdrawalRequestDate,
                withdrawalDate: formData.lastAttendanceDate,
                status: formData.status,
                totalPaid: calculateTotalPaid(),
                totalRefundable: calculationResult.totalRefundable,
                totalDeductions: calculationResult.totalDeductions,
                finalRefundAmount: calculationResult.finalRefundAmount,
                notes: formData.notes,
                approverName: formData.approverName
            };

            onSubmit(refundData);
        }
    };

    const totalPaid = calculateTotalPaid();
    const studentName = studentProfile?.personalData?.fullNameAr || 'غير محدد';
    const studentCode = studentProfile?.studentId || 'غير محدد';
    const stage = studentProfile?.enrollmentData?.stage || 'غير محدد';
    const classLevel = studentProfile?.enrollmentData?.class || 'غير محدد';

    return (
        <div className="space-y-6">
            {/* Section 1: Student Basic Data */}
            <Card>
                <CardHeader className="bg-blue-50 border-b-2 border-blue-200">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        1. بيانات الطالب الأساسية
                    </CardTitle>
                    <CardDescription>معلومات الطالب مستخلصة من النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">اسم الطالب</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">{studentName}</div>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">الكود الدراسي</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">{studentCode}</div>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">الصف الدراسي</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">{stage} - {classLevel}</div>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">السنة الدراسية</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">{academicYear}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Initial Financial Data */}
            <Card>
                <CardHeader className="bg-green-50 border-b-2 border-green-200">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        2. البيانات المالية الأولية
                    </CardTitle>
                    <CardDescription>مستخلصة من سجل الطالب المالي</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">إجمالي المصروفات الدراسية للعام</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border font-semibold text-lg">
                                {(studentProfile?.schoolFees?.totalAmount || 0).toFixed(2)} ج.م
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">إجمالي المبلغ المدفوع</Label>
                            <div className="mt-2 p-3 bg-green-50 rounded border font-semibold text-lg text-green-700">
                                {totalPaid.toFixed(2)} ج.م
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">آخر دفعة</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                {studentProfile?.financialTransactions?.[0]?.transactionDate || 'لا توجد دفعات'}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-700">طريقة الدفع الأصلية</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                {studentProfile?.financialTransactions?.[0]?.paymentMethod || 'غير محدد'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 3: Withdrawal Request Data */}
            <Card>
                <CardHeader className="bg-orange-50 border-b-2 border-orange-200">
                    <CardTitle className="text-lg">3. بيانات طلب الانسحاب</CardTitle>
                    <CardDescription>يتم إدخالها من قبل الموظف المالي</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="withdrawalRequestDate">تاريخ تقديم طلب الانسحاب</Label>
                            <Input
                                id="withdrawalRequestDate"
                                type="date"
                                value={formData.withdrawalRequestDate}
                                onChange={(e) => setFormData({ ...formData, withdrawalRequestDate: e.target.value })}
                                dir="rtl"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="lastAttendanceDate">تاريخ آخر يوم حضور فعلي</Label>
                            <Input
                                id="lastAttendanceDate"
                                type="date"
                                value={formData.lastAttendanceDate}
                                onChange={(e) => setFormData({ ...formData, lastAttendanceDate: e.target.value })}
                                dir="rtl"
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="monthsStudied">عدد الأشهر الدراسية المستهلكة</Label>
                            <Input
                                id="monthsStudied"
                                type="number"
                                min="1"
                                max="9"
                                value={formData.monthsStudied}
                                onChange={(e) => setFormData({ ...formData, monthsStudied: parseInt(e.target.value) })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="monthlyTuitionFee">قيمة الشهر الدراسي الواحد</Label>
                            <Input
                                id="monthlyTuitionFee"
                                type="number"
                                step="0.01"
                                value={formData.monthlyTuitionFee}
                                onChange={(e) => setFormData({ ...formData, monthlyTuitionFee: parseFloat(e.target.value) })}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 4: Detailed Calculation Breakdown */}
            <Card>
                <CardHeader className="bg-purple-50 border-b-2 border-purple-200">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        4. تفاصيل الحساب التفصيلي
                    </CardTitle>
                    <CardDescription>يتم حسابها تلقائياً بناءً على البيانات المدخلة</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Available Balance */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-blue-900">الرصيد الإجمالي المتاح للحساب:</span>
                            <span className="text-2xl font-bold text-blue-700">{totalPaid.toFixed(2)} ج.م</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Deductions Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            الخصومات:
                        </h3>

                        <div className="grid grid-cols-2 gap-4 ml-4">
                            <div>
                                <Label className="text-sm font-semibold text-gray-700">خصم رسوم التسجيل (غير قابلة للاسترداد)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.registrationFeeAmount}
                                    onChange={(e) => setFormData({ ...formData, registrationFeeAmount: parseFloat(e.target.value) })}
                                    className="mt-1 bg-red-50"
                                />
                                <p className="text-sm text-red-600 mt-1">- {formData.registrationFeeAmount.toFixed(2)} ج.م</p>
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-gray-700">خصم رسوم الكتب/الأنشطة (غير قابلة للاسترداد)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.booksActivityFeesAmount}
                                    onChange={(e) => setFormData({ ...formData, booksActivityFeesAmount: parseFloat(e.target.value) })}
                                    className="mt-1 bg-red-50"
                                />
                                <p className="text-sm text-red-600 mt-1">- {formData.booksActivityFeesAmount.toFixed(2)} ج.م</p>
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-gray-700">الرسوم الإدارية الثابتة</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.adminFeeAmount}
                                    onChange={(e) => setFormData({ ...formData, adminFeeAmount: parseFloat(e.target.value) })}
                                    className="mt-1 bg-red-50"
                                />
                                <p className="text-sm text-red-600 mt-1">- {formData.adminFeeAmount.toFixed(2)} ج.م</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Consumed Services */}
                    <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold text-gray-900">حساب قيمة الخدمات المستهلكة:</h3>
                        <div className="space-y-2 ml-4">
                            <div className="flex justify-between">
                                <span>عدد الأشهر الدراسية الكاملة المستهلكة:</span>
                                <span className="font-semibold">{formData.monthsStudied} شهر</span>
                            </div>
                            <div className="flex justify-between">
                                <span>قيمة الشهر الدراسي الواحد (حسب العقد):</span>
                                <span className="font-semibold">{formData.monthlyTuitionFee.toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-yellow-300">
                                <span className="font-semibold">إجمالي قيمة الأشهر المستهلكة:</span>
                                <span className="text-lg font-bold text-yellow-700">
                                    {(formData.monthsStudied * formData.monthlyTuitionFee).toFixed(2)} ج.م
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Final Result */}
                    {calculationResult && (
                        <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-400">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                النتيجة النهائية:
                            </h3>

                            <div className="space-y-2 ml-4">
                                <div className="flex justify-between">
                                    <span>المبلغ القابل للاسترداد:</span>
                                    <span className="font-semibold">{calculationResult.totalRefundable.toFixed(2)} ج.م</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>إجمالي الخصومات:</span>
                                    <span className="font-semibold text-red-600">- {calculationResult.totalDeductions.toFixed(2)} ج.م</span>
                                </div>
                                {calculationResult.deductions.length > 0 && (
                                    <div className="pt-2 border-t ml-4">
                                        <p className="text-sm font-semibold mb-2">تفصيل الخصومات:</p>
                                        <div className="space-y-1 text-sm">
                                            {calculationResult.deductions.map((d, idx) => (
                                                <div key={idx} className="flex justify-between text-gray-600">
                                                    <span>{d.deductionType}:</span>
                                                    <span>- {d.amount.toFixed(2)} ج.م</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="pt-3 border-t-2 border-green-400 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">المبلغ المسترد النهائي:</span>
                                        <span className="text-2xl font-bold text-green-700">
                                            {calculationResult.finalRefundAmount.toFixed(2)} ج.م
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calculate Button */}
                    <Button
                        onClick={handleCalculate}
                        disabled={calculating}
                        className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                    >
                        {calculating && <Loader className="w-4 h-4 animate-spin" />}
                        {calculating ? 'جاري الحساب...' : 'حساب المبلغ المسترد'}
                    </Button>
                </CardContent>
            </Card>

            {/* Section 5: Additional Information */}
            {calculationResult && (
                <Card>
                    <CardHeader className="bg-slate-50 border-b-2 border-slate-200">
                        <CardTitle className="text-lg">5. معلومات إضافية والموافقة</CardTitle>
                        <CardDescription>ملاحظات الإدارة ومعلومات الموافقة</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <Label htmlFor="notes">ملاحظات الإدارة (سبب أي خصومات إضافية أو توضيحات)</Label>
                            <Textarea
                                id="notes"
                                placeholder="أدخل أي ملاحظات إضافية..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="status">حالة الطلب</Label>
                                <Select value={formData.status} onValueChange={(value: 'قيد المراجعة' | 'موافق عليه' | 'مرفوض' | 'مدفوع') => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                                        <SelectItem value="موافق عليه">موافق عليه</SelectItem>
                                        <SelectItem value="مرفوض">مرفوض</SelectItem>
                                        <SelectItem value="مدفوع">تم الصرف</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="approverName">الموظف المسؤول عن الاعتماد</Label>
                                <Input
                                    id="approverName"
                                    placeholder="اسم الموظف"
                                    value={formData.approverName}
                                    onChange={(e) => setFormData({ ...formData, approverName: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <Alert className="border-blue-200 bg-blue-50">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-700">
                                تاريخ الاعتماد النهائي سيتم تسجيله تلقائياً عند الموافقة على الطلب: <strong>{getEgyptianDateString()}</strong>
                            </AlertDescription>
                        </Alert>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !calculationResult}
                            className="w-full bg-green-600 hover:bg-green-700 gap-2"
                        >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {loading ? 'جاري الحفظ...' : 'حفظ ومعالجة الطلب'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
