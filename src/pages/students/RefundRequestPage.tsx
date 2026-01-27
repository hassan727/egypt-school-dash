import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useStudentData } from '@/hooks/useStudentData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader, AlertTriangle, CheckCircle, Clock, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { RefundCalculationDetailedForm } from '@/components/RefundCalculationDetailedForm';
import { StudentService } from '@/services/studentService';
import { type RefundCalculationResult } from '@/utils/refundCalculation';
import type { Refund } from '@/types/student';
import { useSystemSchoolId } from '@/context/SystemContext';

export default function RefundRequestPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const schoolId = useSystemSchoolId();

    const {
        studentProfile,
        loading,
        error,
    } = useStudentData(studentId || '');

    const [formLoading, setFormLoading] = useState(false);
    const [calculationResult, setCalculationResult] = useState<RefundCalculationResult | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    const studentName = studentProfile?.personalData?.fullNameAr || 'غير محدد';
    const academicYear = studentProfile?.enrollmentData?.academicYear || 'غير محدد';

    const handleCalculate = (result: RefundCalculationResult) => {
        setCalculationResult(result);
    };

    const handleSubmit = async (refundData: Partial<Refund>) => {
        try {
            setFormLoading(true);

            if (!schoolId) {
                toast.error('لم يتم تحديد المدرسة');
                return;
            }

            const createdRefund = await StudentService.createRefundRequest(schoolId, refundData);

            if (createdRefund.id && calculationResult?.deductions.length) {
                const deductionsWithRefundId = calculationResult.deductions.map(d => ({
                    ...d,
                    refundId: createdRefund.id
                }));
                await StudentService.addRefundDeductions(schoolId, deductionsWithRefundId);
            }

            setSubmitSuccess(true);
            toast.success('تم حفظ طلب الاسترداد بنجاح ✓');

            setTimeout(() => {
                navigate(-1);
            }, 2000);
        } catch (error) {
            console.error('خطأ في حفظ طلب الاسترداد:', error);
            toast.error('حدث خطأ أثناء حفظ طلب الاسترداد');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">طلب استرداد الأموال</h1>
                        <p className="text-gray-600 mt-1">{studentName} | السنة الدراسية: {academicYear}</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        العودة
                    </Button>
                </div>

                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {submitSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                            تم حفظ طلب الاسترداد بنجاح! سيتم إعادة التوجيه خلال قليل...
                        </AlertDescription>
                    </Alert>
                )}

                {/* Policy Section */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                        <Info className="w-6 h-6" />
                        سياسة استرداد المصروفات
                    </h2>

                    {/* Non-Refundable Fees */}
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                                <XCircle className="w-5 h-5" />
                                الرسوم غير القابلة للاسترداد مطلقاً
                            </CardTitle>
                            <CardDescription className="text-red-700">
                                تغطي تكاليف خدمات تم تقديمها أو تحملتها المدرسة مسبقاً
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex gap-3 pb-3 border-b">
                                    <div className="w-1 bg-red-500 rounded"></div>
                                    <div>
                                        <p className="font-semibold">رسوم القبول والتسجيل</p>
                                        <p className="text-sm text-gray-600">المبلغ المدفوع عند إتمام إجراءات القبول لأول مرة</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pb-3 border-b">
                                    <div className="w-1 bg-red-500 rounded"></div>
                                    <div>
                                        <p className="font-semibold">رسوم الكتب والزى المدرسي</p>
                                        <p className="text-sm text-gray-600">قيمة المواد الدراسية والزي التي تم استلامها</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1 bg-red-500 rounded"></div>
                                    <div>
                                        <p className="font-semibold">رسوم الأنشطة الاختيارية</p>
                                        <p className="text-sm text-gray-600">في حال تم تحديدها كرسوم غير قابلة للاسترداد عند التسجيل</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Refundable Fees */}
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                                <CheckCircle className="w-5 h-5" />
                                الرسوم القابلة للاسترداد
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-green-800">
                                الرسوم الوحيدة القابلة للاسترداد هي <span className="font-semibold">المصروفات الدراسية الشهرية/الفصلية</span>، ويتم حسابها بناءً على عدد الأشهر أو الفصول الدراسية المتبقية من العام الدراسي.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Administrative Fees */}
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                                <AlertTriangle className="w-5 h-5" />
                                الرسوم الإدارية الثابتة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-orange-800">
                                يتم خصم مبلغ إداري ثابت قدره <span className="font-semibold">[قابل للتعديل]</span> من أي مبلغ مسترد، وذلك لتغطية تكاليف معالجة الطلب والأعمال الإدارية المصاحبة له. هذا المبلغ ثابت ولا يتغير بقيمة المبلغ المسترد.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Withdrawal Date Rules */}
                    <Card className="border-indigo-200 bg-indigo-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                                <Clock className="w-5 h-5" />
                                قواعد الحساب بناءً على تاريخ الانسحاب
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Case A */}
                            <div className="space-y-2 pb-4 border-b">
                                <div className="flex items-start gap-3">
                                    <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">أ</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-indigo-900">الانسحاب قبل بدء العام الدراسي</p>
                                        <p className="text-sm text-indigo-700 mt-1">يتم استرداد <span className="font-semibold">كامل المبلغ المدفوع</span> (ما عدا الرسوم غير القابلة للاسترداد والرسوم الإدارية الثابتة)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Case B */}
                            <div className="space-y-2 pb-4 border-b">
                                <div className="flex items-start gap-3">
                                    <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">ب</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-indigo-900">الانسحاب خلال أول 30 يوم من بدء الدراسة</p>
                                        <p className="text-sm text-indigo-700 mt-1">يتم استرداد المبلغ المدفوع بعد خصم الرسوم غير القابلة للاسترداد والرسوم الإدارية الثابتة وقيمة الأيام التي حضرها الطالب في الشهر الأول (يتم احتساب الشهر بنسبة 30 يوماً)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Case C */}
                            <div className="space-y-2 pb-4 border-b">
                                <div className="flex items-start gap-3">
                                    <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">ج</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-indigo-900">الانسحاب بعد مرور 30 يوم وقبل نهاية الفصل الدراسي الأول</p>
                                        <ul className="text-sm text-indigo-700 mt-1 space-y-1 mr-4">
                                            <li>• <span className="font-semibold">لا يتم</span> استرداد قيمة الفصل الدراسي الأول كاملاً</li>
                                            <li>• يتم استرداد قيمة المصروفات الدراسية الخاصة بالفصل الدراسي الثاني (إن وجد) بعد خصم الرسوم الإدارية الثابتة</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Case D */}
                            <div className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">د</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-indigo-900">الانسحاب بعد بدء الفصل الدراسي الثاني</p>
                                        <p className="text-sm text-indigo-700 mt-1"><span className="font-semibold">لا يحق</span> للطالب أي استرداد مالي للمصروفات الدراسية المتبقية</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Section */}
                <div className="space-y-6 mt-8 pt-8 border-t-2">
                    <h2 className="text-2xl font-bold">نموذج حساب الاسترداد التفصيلي</h2>

                    {studentProfile && (
                        <RefundCalculationDetailedForm
                            studentProfile={studentProfile}
                            studentId={studentId}
                            academicYear={academicYear}
                            onCalculate={handleCalculate}
                            onSubmit={handleSubmit}
                            loading={formLoading}
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
