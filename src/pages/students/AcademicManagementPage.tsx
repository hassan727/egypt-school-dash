import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GradeManagementForm } from '@/components/StudentProfile/GradeManagementForm';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, BookOpen, TrendingUp, Award, BarChart3, RotateCcw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * صفحة الإدارة الأكاديمية
 * تركز على قسم البيانات الأكاديمية
 * 
 * هذه صفحة جماعية تدعم:
 * - التعديل على درجات الطلاب
 * - إضافة تقييمات
 * - الفلترة حسب المادة والفصل الدراسي
 * - حفظ جميع التعديلات دفعة واحدة
 */
export default function AcademicManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const {
        studentProfile,
        loading,
        error,
        updateAcademicData,
        refreshStudentData,
        saveAuditTrail,
        undoLastChange,
    } = useStudentData(studentId || '');

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

    const handleUpdateAcademicData = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Academic Data', studentProfile?.academicRecords, data);
            await updateAcademicData(data);
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث البيانات الأكاديمية:', err);
        }
    };

    const handleUndoLastChange = async () => {
        try {
            await undoLastChange();
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في التراجع عن آخر تغيير:', err);
        }
    };

    // حساب الإحصائيات الأكاديمية
    const academicRecords = studentProfile?.academicRecords || [];
    const currentGPA = academicRecords.length > 0 ? academicRecords[0].currentGPA || 0 : 0;
    const averageMarks = academicRecords.length > 0 ? academicRecords[0].averageMarks || 0 : 0;
    const passingStatus = academicRecords.length > 0 ? academicRecords[0].passingStatus || 'غير محدد' : 'غير محدد';

    // إعداد بيانات الرسم البياني
    const chartData = [
        { name: 'المعدل التراكمي', value: currentGPA, fill: '#10b981' },
        { name: 'متوسط الدرجات', value: averageMarks, fill: '#3b82f6' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
                {/* رأس محسّن */}
                <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8 shadow-lg flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="h-8 w-8" />
                            <h1 className="text-4xl font-bold">الإدارة الأكاديمية</h1>
                        </div>
                        <p className="text-green-100">معرّف الطالب: {studentId}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleUndoLastChange}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            التراجع
                        </Button>
                        <Button
                            onClick={() => navigate(`/student/${studentId}/dashboard`)}
                            className="bg-green-700 hover:bg-green-900 text-white flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            العودة
                        </Button>
                    </div>
                </div>

                {/* شبكة الإحصائيات السريعة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">المعدل التراكمي</p>
                                <p className="text-3xl font-bold text-green-600">{currentGPA.toFixed(2)}</p>
                                <p className="text-xs text-gray-500 mt-1">{academicRecords.length} مادة</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">متوسط الدرجات</p>
                                <p className="text-3xl font-bold text-blue-600">{averageMarks.toFixed(1)}</p>
                                <p className="text-xs text-gray-500 mt-1">من 100</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">حالة النجاح</p>
                                <p className={`text-3xl font-bold ${passingStatus === 'ناجح' ? 'text-green-600' : 'text-red-600'}`}>
                                    {passingStatus}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">الفصل الحالي</p>
                            </div>
                            <Award className="h-8 w-8 text-purple-400" />
                        </div>
                    </Card>
                </div>

                {/* رسم بياني الأداء الأكاديمي */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">رسم بياني الأداء الأكاديمي</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* معلومات مهمة */}
                <Card className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold text-amber-900 mb-1">ملاحظة مهمة جداً</p>
                            <p className="text-amber-800 text-sm">
                                ✅ استخدم هذه الواجهة لإضافة درجات جديدة للطالب<br />
                                ✅ اختر المادة أولاً، ثم اختر نوع التقييم<br />
                                ✅ بناءً على نوع التقييم، ستظهر حقول إضافية (الشهر أو الترم)<br />
                                ✅ أدخل الدرجة والملاحظات ثم احفظ<br />
                                ✅ يتم حساب الدرجة النهائية والتقدير تلقائياً
                            </p>
                        </div>
                    </div>
                </Card>

                {/* نموذج إدارة الدرجات - المنطق الصحيح */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        إدارة الدرجات والتقييمات
                    </h3>
                    <GradeManagementForm
                        studentId={studentId || ''}
                        studentName={studentProfile?.personalData?.fullNameAr || 'الطالب'}
                    />
                </Card>

                {/* Footer Navigation */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        onClick={() => navigate(`/student/${studentId}/dashboard`)}
                        variant="outline"
                    >
                        العودة
                    </Button>
                    <div className="text-sm text-gray-500">
                        آخر تحديث: الآن
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}