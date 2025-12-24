import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { FinancialTransactionsSection } from '@/components/StudentProfile/FinancialTransactionsSection';
import { SchoolFeesSection } from '@/components/StudentProfile/SchoolFeesSection';
import { StudentNavigation } from '@/components/StudentProfile/StudentNavigation';
import { SetupFinancialDialog } from '@/components/StudentProfile/SetupFinancialDialog';
import { useStudentData } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Loader, Settings } from 'lucide-react';

/**
 * صفحة المالية الكاملة للطالب
 */
export default function StudentFinancial() {
    const { studentId } = useParams<{ studentId: string }>();
    const { studentProfile, loading, error, refreshStudentData } = useStudentData(studentId || '');
    const [showSetupDialog, setShowSetupDialog] = useState(false);

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

    // التحقق من وجود بيانات مالية أساسية
    const hasFinancialData = studentProfile?.schoolFees &&
        studentProfile.schoolFees.totalAmount > 0;

    const handleSetupSuccess = async () => {
        // تحديث البيانات بعد إكمال الإعداد المالي
        await refreshStudentData();
        setShowSetupDialog(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* رأس الصفحة */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        البيانات المالية
                    </h1>
                    <p className="text-gray-600 mb-6">
                        معرّف الطالب: <span className="font-semibold">{studentId}</span>
                    </p>
                    <StudentNavigation studentId={studentId} />
                </div>

                {/* تنبيه: لا توجد بيانات مالية */}
                {!hasFinancialData && (
                    <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-amber-200">
                                <AlertTriangle className="h-6 w-6 text-amber-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-amber-900 mb-2">
                                    لم يتم إعداد الملف المالي بعد
                                </h3>
                                <p className="text-amber-800 mb-4">
                                    هذا الطالب لا يحتوي على بيانات مالية أساسية. يبدو أنه تم استيراده من ملف خارجي.
                                    يرجى إعداد الملف المالي لتتمكن من إدارة المصروفات والأقساط.
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

                {/* قسم المصروفات الدراسية */}
                {hasFinancialData ? (
                    <>
                        <SchoolFeesSection isReadOnly={false} />
                        {/* قسم المعاملات المالية */}
                        <FinancialTransactionsSection isReadOnly={false} />
                    </>
                ) : (
                    <Card className="p-8 bg-gray-50 border border-gray-200">
                        <div className="text-center text-gray-500">
                            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg">
                                قم بإعداد الملف المالي أولاً لعرض المصروفات والأقساط
                            </p>
                        </div>
                    </Card>
                )}

                {/* حوار إعداد الملف المالي */}
                <SetupFinancialDialog
                    studentId={studentId}
                    enrollmentData={studentProfile?.enrollmentData}
                    open={showSetupDialog}
                    onOpenChange={setShowSetupDialog}
                    onSuccess={handleSetupSuccess}
                />
            </div>
        </DashboardLayout>
    );
}