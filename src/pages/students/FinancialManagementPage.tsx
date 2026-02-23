import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Loader, DollarSign, CreditCard, Wallet, Eye, Plus, Minus, AlertTriangle, Printer, RefreshCw, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FinancialReportPrint } from '@/components/FinancialReportPrint';
import { RefundTracking } from '@/components/RefundTracking';
import { getEgyptianDateString } from '@/utils/helpers';
import type { Installment } from '@/types/student';
import { SetupFinancialDialog } from '@/components/StudentProfile/SetupFinancialDialog';
import { onFeePaymentReceived } from '@/services/notificationTriggers';

/**
 * صفحة الإدارة المالية الشاملة والمتكاملة
 * تتبع الهيكل الهرمي: Master Financial Record -> Annual Financial Records -> Components
 */
export default function FinancialManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [showYearView, setShowYearView] = useState(false);

    // Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAdditionalFeeModal, setShowAdditionalFeeModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showPrintReport, setShowPrintReport] = useState(false);
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

    // Form states
    const [paymentForm, setPaymentForm] = useState({
        installmentId: '',
        amount: '',
        paymentDate: getEgyptianDateString(),
        description: '',
        payerName: '',
        payerRelation: '',
        payerPhone: '',
        payerNationalId: '',
        paymentMethod: 'نقدي'
    });

    const [additionalFeeForm, setAdditionalFeeForm] = useState({
        feeType: '',
        amount: '',
        description: '',
        transactionDate: getEgyptianDateString()
    });

    const [discountForm, setDiscountForm] = useState({
        amount: '',
        reason: '',
        transactionDate: getEgyptianDateString()
    });

    const {
        studentProfile,
        loading,
        error,
        addFinancialTransaction,
        updateInstallmentStatus,
        refreshStudentData,
    } = useStudentData(studentId || '', selectedYear || undefined);

    // قائمة السنوات الدراسية المتاحة (ديناميكية)
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 8 }, (_, i) => {
        const startYear = currentYear - 2 + i;
        const endYear = startYear + 1;
        return `${startYear}-${endYear}`;
    });

    // تعيين السنة الافتراضية عند تحميل البيانات
    useEffect(() => {
        if (studentProfile?.enrollmentData?.academicYear && !selectedYear) {
            setSelectedYear(studentProfile.enrollmentData.academicYear);
        }
    }, [studentProfile?.enrollmentData?.academicYear, selectedYear]);

    // تحديث البيانات عند تغيير السنة المختارة
    useEffect(() => {
        if (selectedYear && showYearView) {
            // تحديث البيانات للسنة المختارة
        }
    }, [selectedYear, showYearView]);

    const handleOpenInstallmentPaymentModal = (installment: Installment) => {
        setSelectedInstallment(installment);
        setPaymentForm({
            installmentId: installment.id || installment.installmentNumber.toString(),
            amount: installment.amount.toString(),
            paymentDate: getEgyptianDateString(),
            description: `سداد القسط ${installment.installmentNumber}`,
            payerName: '',
            payerRelation: '',
            payerPhone: '',
            payerNationalId: '',
            paymentMethod: 'نقدي'
        });
        setShowPaymentModal(true);
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedInstallment(null);
    };

    // وظيفة عرض السجل المالي للسنة المختارة
    const handleViewYearFinancials = () => {
        if (selectedYear) {
            setShowYearView(true);
        }
    };

    // حسابات ديناميكية للسنة المختارة
    const calculateYearFinancials = () => {
        if (!studentProfile || !selectedYear) return null;

        // فلترة المعاملات حسب السنة (افتراضياً جميع المعاملات للسنة الحالية)
        const yearTransactions = studentProfile.financialTransactions || [];

        // المبلغ الإجمالي للمصروفات الدراسية (من الملف الأساسي)
        const totalStudyExpenses = studentProfile.schoolFees?.totalAmount || 0;

        // الدفعة المقدمة (من school_fees.advance_payment)
        const advancePayment = studentProfile.schoolFees?.advancePayment || 0;

        // حساب المبالغ المدفوعة من معاملات النوع 'دفعة'
        const paidFromTransactions = yearTransactions
            .filter(t => t.transactionType === 'دفعة')
            .reduce((sum, t) => sum + t.amount, 0);

        // حساب المبالغ المدفوعة من الأقساط المدفوعة (fee_installments)
        const paidFromInstallments = studentProfile.schoolFees?.installments
            ?.filter(inst => inst.paid)
            .reduce((sum, inst) => sum + inst.amount, 0) || 0;

        // إجمالي المدفوع = الدفعة المقدمة + أكبر قيمة من (المعاملات أو الأقساط)
        // نأخذ الأكبر لتجنب الازدواج بين المعاملات والأقساط
        const totalPaid = advancePayment + Math.max(paidFromTransactions, paidFromInstallments);

        // إجمالي المصروفات الإضافية (معاملات نوع مصروف إضافي)
        const totalAdditionalFees = yearTransactions
            .filter(t => t.transactionType === 'مصروف إضافي')
            .reduce((sum, t) => sum + t.amount, 0);

        // إجمالي الخصومات (معاملات نوع خصم أو غرامة)
        const totalDiscounts = yearTransactions
            .filter(t => t.transactionType === 'خصم' || t.transactionType === 'غرامة')
            .reduce((sum, t) => sum + t.amount, 0);

        // إجمالي الاستردادات (معاملات نوع استرجاع)
        const totalRefunds = yearTransactions
            .filter(t => t.transactionType === 'استرجاع')
            .reduce((sum, t) => sum + t.amount, 0);

        // الصافي المستحق: (المبلغ الإجمالي + المصروفات الإضافية) - (المدفوع + الخصومات + الاستردادات)
        const netDue = totalStudyExpenses + totalAdditionalFees - totalPaid - totalDiscounts - totalRefunds;

        return {
            totalStudyExpenses,
            advancePayment, // إضافة الدفعة المقدمة للعرض
            totalPaid,
            totalAdditionalFees,
            totalDiscounts,
            totalRefunds, // إضافة الاستردادات للعرض
            netDue,
            transactions: yearTransactions
        };
    };

    const yearFinancials = calculateYearFinancials();

    const handleRecordPayment = async () => {
        if (!paymentForm.amount || !paymentForm.paymentDate || !paymentForm.payerName || !paymentForm.payerRelation || !paymentForm.payerPhone) {
            toast.error('يرجى إدخال: المبلغ، التاريخ، اسم الدافع، صلة القرابة، ورقم الهاتف');
            return;
        }

        try {
            const transactionData = {
                studentId: studentId!,
                transactionType: 'دفعة' as const,
                amount: parseFloat(paymentForm.amount),
                description: paymentForm.description || `دفعة بتاريخ ${paymentForm.paymentDate}`,
                transactionDate: paymentForm.paymentDate,
                paymentMethod: paymentForm.paymentMethod,
                payerName: paymentForm.payerName,
                payerRelation: paymentForm.payerRelation,
                payerPhone: paymentForm.payerPhone,
                payerNationalId: paymentForm.payerNationalId,
            };

            await addFinancialTransaction(transactionData);

            if (selectedInstallment && selectedInstallment.id) {
                await updateInstallmentStatus(selectedInstallment.id, true, paymentForm.paymentDate);
            }

            await refreshStudentData();

            toast.success(`تم تسجيل دفع ${paymentForm.amount} جنيه بنجاح ✓`);

            // إرسال إشعار تلقائي لولي الأمر
            try {
                await onFeePaymentReceived({
                    studentId: studentId!,
                    studentName: studentProfile?.personalData?.fullNameAr || studentProfile?.enrollmentData?.fullNameAr || '',
                    amount: parseFloat(paymentForm.amount),
                    paymentDate: paymentForm.paymentDate,
                    receiptNumber: `RCP-${Date.now()}`,
                    paymentMethod: paymentForm.paymentMethod
                });
                console.log('✅ تم إرسال إشعار الدفعة لولي الأمر');
            } catch (notifyError) {
                console.error('خطأ في إرسال الإشعار:', notifyError);
            }

            handleClosePaymentModal();
            setPaymentForm({
                installmentId: '',
                amount: '',
                paymentDate: getEgyptianDateString(),
                description: '',
                payerName: '',
                payerRelation: '',
                payerPhone: '',
                payerNationalId: '',
                paymentMethod: 'نقدي'
            });
        } catch (error) {
            console.error('خطأ في تسجيل الدفعة:', error);
            toast.error('حدث خطأ أثناء تسجيل الدفعة');
        }
    };

    // Handle additional fee submission
    const handleAddAdditionalFee = async () => {
        if (!additionalFeeForm.feeType || !additionalFeeForm.amount || !additionalFeeForm.transactionDate) {
            toast.error('يرجى إدخال نوع المصروف والمبلغ وتاريخ المعاملة');
            return;
        }

        try {
            const transactionData = {
                studentId: studentId!,
                transactionType: 'مصروف إضافي' as const,
                amount: parseFloat(additionalFeeForm.amount),
                description: `رسوم ${additionalFeeForm.feeType}: ${additionalFeeForm.description || 'مصروف إضافي'}`,
                transactionDate: additionalFeeForm.transactionDate,
                paymentMethod: 'نقدي',
            };

            await addFinancialTransaction(transactionData);
            await refreshStudentData();

            toast.success('تم إضافة المصروف الإضافي بنجاح');
            setShowAdditionalFeeModal(false);
            setAdditionalFeeForm({
                feeType: '',
                amount: '',
                description: '',
                transactionDate: getEgyptianDateString()
            });
        } catch (error) {
            console.error('خطأ في إضافة المصروف الإضافي:', error);
            toast.error('حدث خطأ أثناء إضافة المصروف الإضافي');
        }
    };

    // Handle discount submission
    const handleAddDiscount = async () => {
        if (!discountForm.amount || !discountForm.reason || !discountForm.transactionDate) {
            toast.error('يرجى إدخال المبلغ وسبب الخصم وتاريخ المعاملة');
            return;
        }

        try {
            const transactionData = {
                studentId: studentId!,
                transactionType: 'خصم' as const,
                amount: parseFloat(discountForm.amount),
                description: `خصم: ${discountForm.reason}`,
                transactionDate: discountForm.transactionDate,
                paymentMethod: 'نقدي',
            };

            await addFinancialTransaction(transactionData);
            await refreshStudentData();

            toast.success('تم إضافة الخصم بنجاح');
            setShowDiscountModal(false);
            setDiscountForm({
                amount: '',
                reason: '',
                transactionDate: getEgyptianDateString()
            });
        } catch (error) {
            console.error('خطأ في إضافة الخصم:', error);
            toast.error('حدث خطأ أثناء إضافة الخصم');
        }
    };



    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>

                {/* حوار إعداد الملف المالي */}
                <SetupFinancialDialog
                    studentId={studentId || ''}
                    enrollmentData={studentProfile?.enrollmentData}
                    open={showSetupDialog}
                    onOpenChange={setShowSetupDialog}
                    onSuccess={async () => {
                        await refreshStudentData();
                        setShowSetupDialog(false);
                        toast.success('تم إعداد الملف المالي بنجاح! يرجى تحديث الصفحة.');
                    }}
                />
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">حدث خطأ: {error}</p>
                </div>
            </DashboardLayout>
        );
    }

    // عرض واجهة اختيار السنة إذا لم يتم اختيار سنة بعد
    if (!showYearView) {
        return (
            <DashboardLayout>
                <div className="space-y-8 py-6 px-4">
                    {/* Header */}
                    <div className="mb-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="h-8 w-8" />
                                    <h1 className="text-4xl font-bold">
                                        الإدارة المالية الشاملة
                                    </h1>
                                </div>
                                <p className="text-purple-100">
                                    معرّف الطالب: <span className="font-semibold">{studentId}</span>
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate(`/student/${studentId}/dashboard`)}
                                variant="outline"
                                className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 border-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                العودة
                            </Button>
                        </div>
                    </div>

                    {/* Year Selection */}
                    <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <div className="text-center space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    اختيار السنة الدراسية
                                </h2>
                                <p className="text-gray-600">
                                    اختر السنة الدراسية التي تريد عرض السجل المالي لها
                                </p>
                            </div>

                            <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map(year => (
                                            <SelectItem key={year} value={year}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    onClick={handleViewYearFinancials}
                                    disabled={!selectedYear}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Eye className="h-4 w-4" />
                                    عرض
                                </Button>
                            </div>

                            <div className="text-sm text-gray-500">
                                السنة الافتراضية: {studentProfile?.enrollmentData?.academicYear || 'غير محدد'}
                            </div>
                        </div>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // التحقق من وجود بيانات المصروفات للسنة المختارة


    // عرض لوحة التحكم المالية للسنة المختارة
    return (
        <DashboardLayout>
            <div className="space-y-8 py-6 px-4">
                {/* Header with navigation */}
                <div className="mb-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="h-8 w-8" />
                                <h1 className="text-4xl font-bold">
                                    السجل المالي - {selectedYear}
                                </h1>
                            </div>
                            <p className="text-purple-100">
                                معرّف الطالب: <span className="font-semibold">{studentId}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowYearView(false)}
                                variant="outline"
                                className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 border-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                تغيير السنة
                            </Button>
                            <Button
                                onClick={() => navigate(`/student/${studentId}/dashboard`)}
                                variant="outline"
                                className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 border-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                العودة
                            </Button>
                        </div>
                    </div>

                    {/* المنطقة الأولى: الملخص المالي للسنة */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                            <div className="text-center">
                                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm mb-2">المبلغ الإجمالي</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {yearFinancials?.totalStudyExpenses.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200">
                            <div className="text-center">
                                <Wallet className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm mb-2">الدفعة المقدمة</p>
                                <p className="text-2xl font-bold text-cyan-600">
                                    {yearFinancials?.advancePayment.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                            <div className="text-center">
                                <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm mb-2">إجمالي المدفوع</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {yearFinancials?.totalPaid.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                            <div className="text-center">
                                <Plus className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm mb-2">المصروفات الإضافية</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {yearFinancials?.totalAdditionalFees.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                            <div className="text-center">
                                <Minus className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm mb-2">إجمالي الخصومات</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {yearFinancials?.totalDiscounts.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200">
                            <div className="text-center">
                                <ArrowLeft className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm mb-2">إجمالي الاستردادات</p>
                                <p className="text-2xl font-bold text-pink-600">
                                    {yearFinancials?.totalRefunds.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>

                        <Card className={`p-6 border ${yearFinancials?.netDue && yearFinancials.netDue > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                            <div className="text-center">
                                <Wallet className={`h-8 w-8 mx-auto mb-2 ${yearFinancials?.netDue && yearFinancials.netDue > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                <p className="text-gray-600 text-sm mb-2">الصافي المستحق</p>
                                <p className={`text-2xl font-bold ${yearFinancials?.netDue && yearFinancials.netDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {yearFinancials?.netDue.toLocaleString() || 0} ج
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* تنبيه: لا توجد بيانات مالية */}
                    {(!studentProfile?.schoolFees || studentProfile.schoolFees.totalAmount === 0) && (
                        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-amber-200">
                                    <AlertTriangle className="h-6 w-6 text-amber-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                                        ⚠️ لم يتم إعداد الملف المالي بعد
                                    </h3>
                                    <p className="text-amber-800 mb-4">
                                        هذا الطالب لا يحتوي على بيانات مالية أساسية. يبدو أنه تم استيراده من ملف خارجي.
                                        يرجى إعداد الملف المالي لتتمكن من إدارة المصروفات والأقساط بشكل صحيح.
                                    </p>
                                    <Button
                                        onClick={() => setShowSetupDialog(true)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                                    >
                                        <Settings className="h-4 w-4" />
                                        إعداد الملف المالي الآن
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* القسم أ: الملف الأساسي للمصروفات (Read-Only) */}
                    <Card className="p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            الملف الأساسي للمصروفات الدراسية
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* المرحلة الدراسية */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">المرحلة الدراسية</p>
                                <p className="text-lg font-semibold">{studentProfile?.enrollmentData?.stage || 'غير محدد'}</p>
                            </div>

                            {/* المبلغ الإجمالي */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">المبلغ الإجمالي للمصروفات الدراسية</p>
                                <p className="text-lg font-semibold text-green-600">
                                    {studentProfile?.schoolFees?.totalAmount?.toLocaleString() || 0} ج
                                </p>
                            </div>

                            {/* الدفعة المقدمة */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">الدفعة المقدمة</p>
                                <p className="text-lg font-semibold text-blue-600">
                                    {studentProfile?.schoolFees?.advancePayment?.toLocaleString() || 0} ج
                                </p>
                            </div>

                            {/* عدد الأقساط */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">عدد الأقساط</p>
                                <p className="text-lg font-semibold">{studentProfile?.schoolFees?.installmentCount || 1}</p>
                            </div>

                            {/* المصروفات الأخرى */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">المصروفات الأخرى المبدئية</p>
                                <div className="space-y-1">
                                    {studentProfile?.otherExpenses && studentProfile.otherExpenses.length > 0 ? (
                                        studentProfile.otherExpenses.map((expense, index) => (
                                            <div key={index} className="text-sm">
                                                {expense.expenseType}: {expense.totalPrice.toLocaleString()} ج
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">لا توجد مصروفات أخرى</p>
                                    )}
                                </div>
                            </div>

                            {/* تفاصيل الأقساط */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">تفاصيل الأقساط</p>
                                <div className="space-y-1 max-h-20 overflow-y-auto">
                                    {studentProfile?.schoolFees?.installments && studentProfile.schoolFees.installments.length > 0 ? (
                                        studentProfile.schoolFees.installments.map((installment, index) => (
                                            <div key={index} className="text-xs">
                                                القسط {installment.installmentNumber}: {installment.amount.toLocaleString()} ج
                                                ({installment.dueDate})
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">لا توجد تفاصيل أقساط</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                ℹ️ هذا الملف الأساسي للقراءة فقط. أي تعديل جوهري يجب أن يتم عبر عملية محددة مع تسجيل سبب التعديل.
                            </p>
                        </div>
                    </Card>

                    {/* المنطقة الثانية: إجراءات إدارة السجل */}
                    <Card className="p-6 bg-gray-50 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات إدارة السجل المالي</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* تسجيل دفعة جديدة */}
                            <Dialog open={showPaymentModal && !selectedInstallment} onOpenChange={(open) => {
                                if (!open) setShowPaymentModal(false);
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                                        <Plus className="h-4 w-4" />
                                        تسجيل دفعة جديدة
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="payment-amount">المبلغ</Label>
                                            <Input
                                                id="payment-amount"
                                                type="number"
                                                placeholder="أدخل المبلغ"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment-date">تاريخ الدفع</Label>
                                            <Input
                                                id="payment-date"
                                                type="date"
                                                value={paymentForm.paymentDate}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment-method">طريقة الدفع</Label>
                                            <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                                                <SelectTrigger id="payment-method">
                                                    <SelectValue placeholder="اختر طريقة الدفع" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="نقدي">نقدي</SelectItem>
                                                    <SelectItem value="شيك">شيك</SelectItem>
                                                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                                                    <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="payer-name">اسم الدافع</Label>
                                            <Input
                                                id="payer-name"
                                                placeholder="أدخل اسم الشخص الذي يدفع القسط"
                                                value={paymentForm.payerName}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payer-relation">صلة القرابة</Label>
                                            <Select value={paymentForm.payerRelation} onValueChange={(value) => setPaymentForm({ ...paymentForm, payerRelation: value })}>
                                                <SelectTrigger id="payer-relation">
                                                    <SelectValue placeholder="اختر صلة القرابة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="الأب">الأب</SelectItem>
                                                    <SelectItem value="الأم">الأم</SelectItem>
                                                    <SelectItem value="الأخ">الأخ</SelectItem>
                                                    <SelectItem value="الأخت">الأخت</SelectItem>
                                                    <SelectItem value="الجد">الجد</SelectItem>
                                                    <SelectItem value="الجدة">الجدة</SelectItem>
                                                    <SelectItem value="العم">العم</SelectItem>
                                                    <SelectItem value="العمة">العمة</SelectItem>
                                                    <SelectItem value="الخال">الخال</SelectItem>
                                                    <SelectItem value="الخالة">الخالة</SelectItem>
                                                    <SelectItem value="ولي أمر">ولي أمر</SelectItem>
                                                    <SelectItem value="أخرى">أخرى</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="payment-phone">رقم هاتف الدافع</Label>
                                            <Input
                                                id="payment-phone"
                                                type="tel"
                                                placeholder="أدخل رقم الهاتف"
                                                value={paymentForm.payerPhone}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, payerPhone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment-national-id">الرقم القومي للدافع (اختياري)</Label>
                                            <Input
                                                id="payment-national-id"
                                                placeholder="أدخل الرقم القومي"
                                                value={paymentForm.payerNationalId}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, payerNationalId: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment-description">الوصف (اختياري)</Label>
                                            <Input
                                                id="payment-description"
                                                placeholder="مثال: سداد القسط الثاني"
                                                value={paymentForm.description}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleRecordPayment} className="flex-1">
                                                حفظ الدفعة
                                            </Button>
                                            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* إضافة مصروف إضافي */}
                            <Dialog open={showAdditionalFeeModal} onOpenChange={setShowAdditionalFeeModal}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
                                        <Plus className="h-4 w-4" />
                                        إضافة مصروف إضافي
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>إضافة مصروف إضافي</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="fee-type">نوع المصروف</Label>
                                            <Select value={additionalFeeForm.feeType} onValueChange={(value) => setAdditionalFeeForm({ ...additionalFeeForm, feeType: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر نوع المصروف" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="نقل">نقل</SelectItem>
                                                    <SelectItem value="رحلة">رحلة</SelectItem>
                                                    <SelectItem value="نشاط">نشاط</SelectItem>
                                                    <SelectItem value="كتب">كتب</SelectItem>
                                                    <SelectItem value="أخرى">أخرى</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="fee-amount">المبلغ</Label>
                                            <Input
                                                id="fee-amount"
                                                type="number"
                                                placeholder="أدخل المبلغ"
                                                value={additionalFeeForm.amount}
                                                onChange={(e) => setAdditionalFeeForm({ ...additionalFeeForm, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="fee-description">الوصف</Label>
                                            <Input
                                                id="fee-description"
                                                placeholder="وصف المصروف"
                                                value={additionalFeeForm.description}
                                                onChange={(e) => setAdditionalFeeForm({ ...additionalFeeForm, description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="fee-date">تاريخ المعاملة</Label>
                                            <Input
                                                id="fee-date"
                                                type="date"
                                                value={additionalFeeForm.transactionDate}
                                                onChange={(e) => setAdditionalFeeForm({ ...additionalFeeForm, transactionDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddAdditionalFee} className="flex-1">
                                                إضافة المصروف
                                            </Button>
                                            <Button variant="outline" onClick={() => setShowAdditionalFeeModal(false)}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* إضافة خصم */}
                            <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
                                        <Minus className="h-4 w-4" />
                                        إضافة خصم
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>إضافة خصم</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="discount-amount">المبلغ</Label>
                                            <Input
                                                id="discount-amount"
                                                type="number"
                                                placeholder="أدخل مبلغ الخصم"
                                                value={discountForm.amount}
                                                onChange={(e) => setDiscountForm({ ...discountForm, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="discount-reason">سبب الخصم</Label>
                                            <Input
                                                id="discount-reason"
                                                placeholder="مثال: خصم بسبب أخ"
                                                value={discountForm.reason}
                                                onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="discount-date">تاريخ المعاملة</Label>
                                            <Input
                                                id="discount-date"
                                                type="date"
                                                value={discountForm.transactionDate}
                                                onChange={(e) => setDiscountForm({ ...discountForm, transactionDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddDiscount} className="flex-1">
                                                إضافة الخصم
                                            </Button>
                                            <Button variant="outline" onClick={() => setShowDiscountModal(false)}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* طلب استرداد أموال */}
                            <Button
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => navigate(`/student/${studentId}/refund-request`)}
                            >
                                <RefreshCw className="h-4 w-4" />
                                طلب استرداد أموال
                            </Button>

                            {/* عرض سجل المعاملات الكامل */}
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={() => {
                                    // Scroll to transaction log section
                                    const element = document.getElementById('transaction-log');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                <Eye className="h-4 w-4" />
                                عرض السجل الكامل
                            </Button>

                            {/* طباعة كشف الحساب */}
                            <Button
                                onClick={() => setShowPrintReport(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Printer className="h-4 w-4" />
                                طباعة الكشف
                            </Button>
                        </div>
                    </Card>

                    {/* حالة الأقساط */}
                    <Card className="p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            حالة الأقساط
                        </h3>

                        {studentProfile?.schoolFees?.installments && studentProfile.schoolFees.installments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {studentProfile.schoolFees.installments
                                    .sort((a, b) => a.installmentNumber - b.installmentNumber)
                                    .map((installment) => {
                                        const today = new Date();
                                        const dueDate = new Date(installment.dueDate);
                                        const isOverdue = !installment.paid && dueDate < today;
                                        const isPaid = installment.paid;

                                        return (
                                            <div
                                                key={installment.id || installment.installmentNumber}
                                                onClick={() => !isPaid && handleOpenInstallmentPaymentModal(installment)}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isPaid
                                                    ? 'border-green-200 bg-green-50'
                                                    : isOverdue
                                                        ? 'border-red-200 bg-red-50 hover:shadow-lg hover:shadow-red-200 hover:scale-105'
                                                        : 'border-yellow-200 bg-yellow-50 hover:shadow-lg hover:shadow-yellow-200 hover:scale-105'
                                                    } ${!isPaid ? 'hover:border-blue-400' : ''}`}
                                                title={!isPaid ? 'انقر لتسجيل دفع' : ''}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-900">
                                                        القسط {installment.installmentNumber}
                                                    </h4>
                                                    <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-green-500' :
                                                        isOverdue ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                        }`} />
                                                </div>

                                                <p className="text-lg font-bold mb-1">
                                                    {installment.amount.toLocaleString()} ج
                                                </p>

                                                <p className="text-sm text-gray-600 mb-1">
                                                    تاريخ الاستحقاق: {installment.dueDate}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-800' :
                                                        isOverdue ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {isPaid ? 'مدفوع' : isOverdue ? 'متأخر' : 'غير مدفوع'}
                                                    </span>
                                                    {isPaid && installment.paidDate && (
                                                        <span className="text-xs text-gray-500">
                                                            ({installment.paidDate})
                                                        </span>
                                                    )}
                                                </div>

                                                {!isPaid && (
                                                    <p className="text-xs text-blue-600 mt-2 font-semibold">
                                                        💳 انقر لتسجيل دفع
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>لا توجد أقساط محددة</p>
                                <p className="text-sm mt-2">يجب إعداد تفاصيل الأقساط في بيانات المصروفات</p>
                            </div>
                        )}
                    </Card>

                    {/* المصروفات الإضافية - قسم ديناميكي */}
                    {(() => {
                        const additionalFees = studentProfile?.financialTransactions || [];
                        const additionalExpenses = additionalFees
                            .filter(t => t.transactionType === 'مصروف إضافي');

                        if (additionalExpenses.length === 0) {
                            return null;
                        }

                        return (
                            <Card className="p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-orange-600" />
                                    المصروفات الإضافية
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {additionalExpenses.map((expense, index) => {
                                        const today = new Date();
                                        const expenseDate = new Date(expense.transactionDate);

                                        return (
                                            <div
                                                key={expense.id || index}
                                                onClick={() => {
                                                    setSelectedInstallment({
                                                        id: expense.id || `exp-${index}`,
                                                        installmentNumber: 0,
                                                        amount: expense.amount,
                                                        dueDate: expense.transactionDate,
                                                        paid: false
                                                    });
                                                    setPaymentForm({
                                                        installmentId: expense.id || `exp-${index}`,
                                                        amount: expense.amount.toString(),
                                                        paymentDate: getEgyptianDateString(),
                                                        description: `سداد: ${expense.description}`,
                                                        payerName: '',
                                                        payerRelation: '',
                                                        payerPhone: '',
                                                        payerNationalId: '',
                                                        paymentMethod: 'نقدي'
                                                    });
                                                    setShowPaymentModal(true);
                                                }}
                                                className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50 hover:shadow-lg hover:shadow-orange-200 hover:scale-105 cursor-pointer transition-all duration-200"
                                                title="انقر لتسجيل دفع"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-900 text-sm flex-1">
                                                        {expense.description}
                                                    </h4>
                                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                                </div>

                                                <p className="text-lg font-bold mb-1 text-orange-600">
                                                    {expense.amount.toLocaleString()} ج
                                                </p>

                                                <p className="text-sm text-gray-600 mb-2">
                                                    التاريخ: {expense.transactionDate}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                                        غير مدفوع
                                                    </span>
                                                </div>

                                                <p className="text-xs text-blue-600 mt-2 font-semibold">
                                                    💳 انقر لتسجيل دفع
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    })()}

                    {/* Modal for installment-specific payment */}
                    <Dialog open={showPaymentModal && !!selectedInstallment} onOpenChange={(open) => {
                        if (!open) handleClosePaymentModal();
                    }}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>تسجيل دفع {selectedInstallment ? `للقسط ${selectedInstallment.installmentNumber}` : ''}</DialogTitle>
                            </DialogHeader>
                            {selectedInstallment && (
                                <div className="space-y-4">
                                    {/* Installment Info - Read Only */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-600">المبلغ المستحق:</p>
                                                <p className="font-semibold text-blue-600">{selectedInstallment.amount.toLocaleString()} ج</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">تاريخ الاستحقاق:</p>
                                                <p className="font-semibold">{selectedInstallment.dueDate}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Form */}
                                    <div>
                                        <Label htmlFor="install-payment-amount">المبلغ المدفوع</Label>
                                        <Input
                                            id="install-payment-amount"
                                            type="number"
                                            placeholder="أدخل المبلغ المدفوع"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payment-date">تاريخ الدفع</Label>
                                        <Input
                                            id="install-payment-date"
                                            type="date"
                                            value={paymentForm.paymentDate}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payment-method">طريقة الدفع</Label>
                                        <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                                            <SelectTrigger id="install-payment-method">
                                                <SelectValue placeholder="اختر طريقة الدفع" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="نقدي">نقدي</SelectItem>
                                                <SelectItem value="شيك">شيك</SelectItem>
                                                <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                                                <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payer-name">اسم الدافع</Label>
                                        <Input
                                            id="install-payer-name"
                                            placeholder="أدخل اسم الدافع"
                                            value={paymentForm.payerName}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payer-relation">صلة القرابة</Label>
                                        <Select value={paymentForm.payerRelation} onValueChange={(value) => setPaymentForm({ ...paymentForm, payerRelation: value })}>
                                            <SelectTrigger id="install-payer-relation">
                                                <SelectValue placeholder="اختر صلة القرابة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="الأب">الأب</SelectItem>
                                                <SelectItem value="الأم">الأم</SelectItem>
                                                <SelectItem value="الأخ">الأخ</SelectItem>
                                                <SelectItem value="الأخت">الأخت</SelectItem>
                                                <SelectItem value="الجد">الجد</SelectItem>
                                                <SelectItem value="الجدة">الجدة</SelectItem>
                                                <SelectItem value="العم">العم</SelectItem>
                                                <SelectItem value="العمة">العمة</SelectItem>
                                                <SelectItem value="الخال">الخال</SelectItem>
                                                <SelectItem value="الخالة">الخالة</SelectItem>
                                                <SelectItem value="ولي أمر">ولي أمر</SelectItem>
                                                <SelectItem value="أخرى">أخرى</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payer-phone">رقم هاتف الدافع</Label>
                                        <Input
                                            id="install-payer-phone"
                                            type="tel"
                                            placeholder="أدخل رقم الهاتف"
                                            value={paymentForm.payerPhone}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payerPhone: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payer-national-id">الرقم القومي للدافع (اختياري)</Label>
                                        <Input
                                            id="install-payer-national-id"
                                            placeholder="أدخل الرقم القومي"
                                            value={paymentForm.payerNationalId}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payerNationalId: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="install-payment-note">ملاحظات / رقم الإيصال (اختياري)</Label>
                                        <Input
                                            id="install-payment-note"
                                            placeholder="أدخل ملاحظات أو رقم الإيصال"
                                            value={paymentForm.description}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleRecordPayment} className="flex-1 bg-green-600 hover:bg-green-700">
                                            تأكيد الدفع
                                        </Button>
                                        <Button variant="outline" onClick={handleClosePaymentModal} className="flex-1">
                                            إلغاء
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* القسم ب: سجل المعاملات المالية */}
                    <Card id="transaction-log" className="p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            سجل المعاملات المالية
                        </h3>

                        {yearFinancials?.transactions && yearFinancials.transactions.length > 0 ? (
                            <div className="space-y-3">
                                {yearFinancials.transactions
                                    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                                    .map((transaction, index) => (
                                        <div key={transaction.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-3 h-3 rounded-full ${transaction.transactionType === 'دفعة' ? 'bg-green-500' :
                                                    (transaction.transactionType === 'خصم' || transaction.transactionType === 'غرامة') ? 'bg-purple-500' :
                                                        'bg-orange-500'
                                                    }`} />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {transaction.transactionType === 'دفعة' ? 'دفعة' :
                                                            (transaction.transactionType === 'خصم' || transaction.transactionType === 'غرامة') ? 'خصم' :
                                                                'مصروف إضافي'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{transaction.description}</p>
                                                    {transaction.transactionType === 'دفعة' && transaction.payerName && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            <p>الدافع: <span className="font-semibold text-gray-700">{transaction.payerName}</span></p>
                                                            {transaction.payerRelation && (
                                                                <p>الصلة: <span className="font-semibold text-gray-700">{transaction.payerRelation}</span></p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-semibold ${transaction.transactionType === 'دفعة' ? 'text-green-600' :
                                                    (transaction.transactionType === 'خصم' || transaction.transactionType === 'غرامة') ? 'text-purple-600' :
                                                        'text-orange-600'
                                                    }`}>
                                                    {transaction.transactionType === 'دفعة' ? '+' :
                                                        (transaction.transactionType === 'خصم' || transaction.transactionType === 'غرامة') ? '-' :
                                                            '+'}
                                                    {transaction.amount.toLocaleString()} ج
                                                </p>
                                                <p className="text-xs text-gray-500">{transaction.transactionDate}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>لا توجد معاملات مالية مسجلة لهذه السنة</p>
                            </div>
                        )}

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                ℹ️ هذا السجل يوثق كل الحركات المالية. لا يتم حذف أو تعديل معاملة تمت، بل يتم إضافة معاملة جديدة لتصحيحها.
                            </p>
                        </div>
                    </Card>

                    {/* قسم طلبات الاسترداد */}
                    <Card className="p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-600" />
                            تتبع طلبات الاسترداد
                        </h3>
                        <RefundTracking studentId={studentId || ''} />
                    </Card>
                </div>
            </div>

            {showPrintReport && studentProfile && (
                <FinancialReportPrint
                    studentProfile={studentProfile}
                    studentId={studentId || ''}
                    selectedYear={selectedYear}
                    onClose={() => setShowPrintReport(false)}
                />
            )}

            {/* حوار إعداد الملف المالي */}
            <SetupFinancialDialog
                studentId={studentId || ''}
                enrollmentData={studentProfile?.enrollmentData}
                open={showSetupDialog}
                onOpenChange={setShowSetupDialog}
                onSuccess={async () => {
                    await refreshStudentData();
                    setShowSetupDialog(false);
                    toast.success('تم إعداد الملف المالي بنجاح! 🎉');
                }}
            />
        </DashboardLayout>
    );
}
