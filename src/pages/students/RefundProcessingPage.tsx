import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { RefundCalculationDetailedForm } from '@/components/RefundCalculationDetailedForm';
import { StudentService } from '@/services/studentService';
import type { Refund } from '@/types/student';
import { createRefundFromCalculation, type RefundCalculationResult } from '@/utils/refundCalculation';
import { useSystemSchoolId } from '@/context/SystemContext';

export default function RefundProcessingPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const schoolId = useSystemSchoolId();
    const [selectedYear, setSelectedYear] = useState<string>('');

    const {
        studentProfile,
        loading,
        error,
    } = useStudentData(studentId || '', selectedYear || undefined);

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
    const academicYear = selectedYear || studentProfile?.enrollmentData?.academicYear || 'غير محدد';

    const handleCalculate = (result: RefundCalculationResult) => {
        setCalculationResult(result);
    };

    const handleSubmit = async (refundData: Partial<Refund>) => {
        try {
            setFormLoading(true);

            if (!schoolId) {
                toast.error('لم يتم تحديد المدرسة');
                setFormLoading(false);
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
                        <h1 className="text-3xl font-bold">معالجة طلب الاسترداد - نموذج تفصيلي</h1>
                        <p className="text-gray-600 mt-1">نموذج خاص بموظفي الإدارة المالية - {studentName} | السنة الدراسية: {academicYear}</p>
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

                {/* Info Banner */}
                <Card className="border-blue-200 bg-blue-50">
                    <div className="p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="text-blue-800">
                            <p className="font-semibold">شرح الفورم:</p>
                            <ul className="list-disc mr-5 mt-2 space-y-1 text-sm">
                                <li><strong>الأقسام 1-2:</strong> بيانات مستخلصة من النظام (قراءة فقط)</li>
                                <li><strong>القسم 3:</strong> يتم إدخال بيانات الانسحاب من قبلك</li>
                                <li><strong>القسم 4:</strong> يتم حسابها تلقائياً - اضغط "حساب المبلغ المسترد"</li>
                                <li><strong>القسم 5:</strong> أضف ملاحظات وأكمل الموافقة</li>
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Detailed Form */}
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
        </DashboardLayout>
    );
}
