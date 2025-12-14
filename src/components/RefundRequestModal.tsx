import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { calculateRefundAmount, createRefundFromCalculation, type RefundCalculationInput, type RefundCalculationResult } from '@/utils/refundCalculation';
import { StudentService } from '@/services/studentService';
import { getEgyptianDateString } from '@/utils/helpers';
import type { SchoolFees, FinancialTransaction } from '@/types/student';

interface RefundRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    academicYear: string;
    schoolFees?: SchoolFees;
    financialTransactions?: FinancialTransaction[];
    onRefundCreated?: (refundId: string) => void;
}

export function RefundRequestModal({
    open,
    onOpenChange,
    studentId,
    studentName,
    academicYear,
    schoolFees,
    financialTransactions = [],
    onRefundCreated
}: RefundRequestModalProps) {
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [calculationResult, setCalculationResult] = useState<RefundCalculationResult | null>(null);

    const [formData, setFormData] = useState({
        withdrawalDate: getEgyptianDateString(),
        monthsStudied: 1,
        monthlyTuitionFee: 0,
        adminFeePercentage: 10,
        registrationFeeAmount: 0,
        otherNonRefundableFees: 0,
        paymentMethod: 'تحويل بنكي',
        bankAccountInfo: '',
        notes: ''
    });

    useEffect(() => {
        if (schoolFees) {
            const monthlyFee = schoolFees.totalAmount / 9;
            setFormData(prev => ({
                ...prev,
                monthlyTuitionFee: monthlyFee,
                registrationFeeAmount: 2000
            }));
        }
    }, [schoolFees]);

    const calculateTotalPaid = (): number => {
        const paidFromTransactions = financialTransactions
            .filter(t => t.transactionType === 'دفعة')
            .reduce((sum, t) => sum + t.amount, 0);

        const paidFromInstallments = schoolFees?.installments
            ?.filter(inst => inst.paid)
            .reduce((sum, inst) => sum + inst.amount, 0) || 0;

        return Math.max(paidFromTransactions, paidFromInstallments);
    };

    const handleCalculate = async () => {
        try {
            setCalculating(true);

            const totalPaid = calculateTotalPaid();
            if (totalPaid <= 0) {
                toast.error('لم يتم تسجيل أي دفعات للطالب');
                return;
            }

            const input: RefundCalculationInput = {
                totalPaid,
                totalStudyExpenses: schoolFees?.totalAmount || 0,
                monthsStudied: formData.monthsStudied,
                totalMonthsInYear: 9,
                monthlyTuitionFee: formData.monthlyTuitionFee,
                adminFeePercentage: formData.adminFeePercentage,
                registrationFeeAmount: formData.registrationFeeAmount,
                otherNonRefundableFees: formData.otherNonRefundableFees
            };

            const result = calculateRefundAmount(input);
            setCalculationResult(result);
            toast.success('تم حساب المبلغ المسترد بنجاح');
        } catch (error) {
            console.error('خطأ في حساب الاسترداد:', error);
            toast.error('حدث خطأ أثناء حساب المبلغ المسترد');
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async () => {
        if (!calculationResult) {
            toast.error('يرجى حساب المبلغ المسترد أولاً');
            return;
        }

        try {
            setLoading(true);

            const totalPaid = calculateTotalPaid();
            const refundData = createRefundFromCalculation(
                studentId,
                academicYear,
                totalPaid,
                calculationResult,
                formData.withdrawalDate,
                formData.notes
            );

            const createdRefund = await StudentService.createRefundRequest(refundData);

            if (createdRefund.id && calculationResult.deductions.length > 0) {
                const deductionsWithRefundId = calculationResult.deductions.map(d => ({
                    ...d,
                    refundId: createdRefund.id
                }));
                await StudentService.addRefundDeductions(deductionsWithRefundId);
            }

            toast.success('تم إنشاء طلب الاسترداد بنجاح ✓');
            
            if (onRefundCreated) {
                onRefundCreated(createdRefund.id);
            }

            setCalculationResult(null);
            setFormData({
                withdrawalDate: getEgyptianDateString(),
                monthsStudied: 1,
                monthlyTuitionFee: 0,
                adminFeePercentage: 10,
                registrationFeeAmount: 0,
                otherNonRefundableFees: 0,
                paymentMethod: 'تحويل بنكي',
                bankAccountInfo: '',
                notes: ''
            });

            onOpenChange(false);
        } catch (error) {
            console.error('خطأ في إنشاء طلب الاسترداد:', error);
            toast.error('حدث خطأ أثناء إنشاء طلب الاسترداد');
        } finally {
            setLoading(false);
        }
    };

    const totalPaid = calculateTotalPaid();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>طلب استرداد الأموال</DialogTitle>
                    <DialogDescription>
                        {studentName} | السنة الدراسية: {academicYear}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* الملخص المالي الأولي */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">الملخص المالي</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">إجمالي المصروفات</p>
                                    <p className="text-lg font-semibold">{schoolFees?.totalAmount.toFixed(2)} ج.م</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">المبلغ المدفوع</p>
                                    <p className="text-lg font-semibold text-green-600">{totalPaid.toFixed(2)} ج.م</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* بيانات الاسترداد */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="withdrawalDate">تاريخ الانسحاب</Label>
                                <Input
                                    id="withdrawalDate"
                                    type="date"
                                    value={formData.withdrawalDate}
                                    onChange={(e) => setFormData({ ...formData, withdrawalDate: e.target.value })}
                                    dir="rtl"
                                />
                            </div>
                            <div>
                                <Label htmlFor="monthsStudied">عدد الأشهر المدروسة</Label>
                                <Input
                                    id="monthsStudied"
                                    type="number"
                                    min="1"
                                    max="9"
                                    value={formData.monthsStudied}
                                    onChange={(e) => setFormData({ ...formData, monthsStudied: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="monthlyTuitionFee">الرسم الدراسي الشهري</Label>
                                <Input
                                    id="monthlyTuitionFee"
                                    type="number"
                                    step="0.01"
                                    value={formData.monthlyTuitionFee}
                                    onChange={(e) => setFormData({ ...formData, monthlyTuitionFee: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="adminFeePercentage">نسبة الرسم الإداري (%)</Label>
                                <Input
                                    id="adminFeePercentage"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.adminFeePercentage}
                                    onChange={(e) => setFormData({ ...formData, adminFeePercentage: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="registrationFeeAmount">رسم التسجيل</Label>
                                <Input
                                    id="registrationFeeAmount"
                                    type="number"
                                    step="0.01"
                                    value={formData.registrationFeeAmount}
                                    onChange={(e) => setFormData({ ...formData, registrationFeeAmount: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="otherNonRefundableFees">رسوم غير قابلة للاسترداد</Label>
                                <Input
                                    id="otherNonRefundableFees"
                                    type="number"
                                    step="0.01"
                                    value={formData.otherNonRefundableFees}
                                    onChange={(e) => setFormData({ ...formData, otherNonRefundableFees: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                            <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                                    <SelectItem value="شيك">شيك</SelectItem>
                                    <SelectItem value="كاش">نقدي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.paymentMethod === 'تحويل بنكي' && (
                            <div>
                                <Label htmlFor="bankAccountInfo">بيانات الحساب البنكي</Label>
                                <Textarea
                                    id="bankAccountInfo"
                                    placeholder="رقم الحساب - اسم البنك - صاحب الحساب"
                                    value={formData.bankAccountInfo}
                                    onChange={(e) => setFormData({ ...formData, bankAccountInfo: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        )}

                        <div>
                            <Label htmlFor="notes">ملاحظات إضافية</Label>
                            <Textarea
                                id="notes"
                                placeholder="أي ملاحظات إضافية حول الاسترداد..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* نتائج الحساب */}
                    {calculationResult && (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">تفاصيل الحساب</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>المبلغ القابل للاسترداد:</span>
                                        <span className="font-semibold">{calculationResult.totalRefundable.toFixed(2)} ج.م</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>إجمالي الخصومات:</span>
                                        <span className="font-semibold text-red-600">-{calculationResult.totalDeductions.toFixed(2)} ج.م</span>
                                    </div>
                                </div>

                                {calculationResult.deductions.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm font-semibold mb-2">تفصيل الخصومات:</p>
                                        <div className="space-y-1 text-sm">
                                            {calculationResult.deductions.map((d, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                    <span>{d.deductionType}:</span>
                                                    <span>-{d.amount.toFixed(2)} ج.م</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            المبلغ المسترد النهائي:
                                        </span>
                                        <span className="text-lg font-bold text-green-600">
                                            {calculationResult.finalRefundAmount.toFixed(2)} ج.م
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* تحذير */}
                    <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-sm text-orange-700">
                            يرجى التأكد من صحة البيانات المدخلة. سيتم إرسال هذا الطلب للموافقة من قبل الإدارة المالية.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        إلغاء
                    </Button>
                    {!calculationResult ? (
                        <Button
                            onClick={handleCalculate}
                            disabled={calculating || !schoolFees}
                        >
                            {calculating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                            احسب المبلغ المسترد
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                            تقديم الطلب
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
