import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AttendanceRecordsSection } from '@/components/StudentProfile/AttendanceRecordsSection';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, Calendar, TrendingUp, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * صفحة إدارة الحضور
 * تركز على تسجيل وإدارة الحضور والغياب
 * 
 * هذه صفحة جماعية تدعم:
 * - تسجيل الحضور والغياب
 * - عرض تقارير الحضور الشهرية
 * - التعديل الجماعي (مثل تسجيل حضور لعدة طلاب)
 * - حفظ جميع التعديلات دفعة واحدة
 */
export default function AttendanceManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const {
        studentProfile,
        loading,
        error,
        updateAttendanceRecords,
        refreshStudentData,
        saveAuditTrail,
        undoLastChange,
    } = useStudentData(studentId || '');

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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

    const handleUpdateAttendanceRecords = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Attendance Data', studentProfile?.attendanceRecords, data);
            await updateAttendanceRecords(data);
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث سجل الحضور:', err);
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

    // حساب إحصائيات الحضور
    const attendanceRecords = studentProfile?.attendanceRecords || [];
    const attendanceCount = attendanceRecords.filter(
        (r) => r.status === 'حاضر'
    ).length;
    const absenceCount = attendanceRecords.filter(
        (r) => r.status === 'غائب'
    ).length;
    const latenessCount = attendanceRecords.filter(
        (r) => r.status === 'متأخر'
    ).length;
    const excusedCount = attendanceRecords.filter(
        (r) => r.status === 'معذور'
    ).length;
    const attendanceRate =
        attendanceRecords.length > 0
            ? Math.round((attendanceCount / attendanceRecords.length) * 100)
            : 0;

    // إعداد بيانات الرسم البياني
    const chartData = [
        { name: 'الحضور', value: attendanceCount, fill: '#10b981' },
        { name: 'الغياب', value: absenceCount, fill: '#ef4444' },
        { name: 'التأخر', value: latenessCount, fill: '#f59e0b' },
        { name: 'معذور', value: excusedCount, fill: '#8b5cf6' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
                {/* رأس محسّن */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white rounded-lg p-8 shadow-lg flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-8 w-8" />
                            <h1 className="text-4xl font-bold">إدارة الحضور والغياب</h1>
                        </div>
                        <p className="text-orange-100">معرّف الطالب: {studentId}</p>
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
                            className="bg-orange-700 hover:bg-orange-900 text-white flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            العودة
                        </Button>
                    </div>
                </div>

                {/* الإحصائيات السريعة محسّنة */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* نسبة الحضور - هام */}
                    <Card className={`p-6 bg-gradient-to-br border rounded-lg hover:shadow-lg transition-shadow ${attendanceRate >= 90
                        ? 'from-green-50 to-green-100 border-green-200'
                        : attendanceRate >= 75
                            ? 'from-yellow-50 to-yellow-100 border-yellow-200'
                            : 'from-red-50 to-red-100 border-red-200'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-xs mb-1">نسبة الحضور</p>
                                <p className={`text-3xl font-bold ${attendanceRate >= 90
                                    ? 'text-green-600'
                                    : attendanceRate >= 75
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                    }`}>
                                    {attendanceRate}%
                                </p>
                            </div>
                            <TrendingUp className="h-6 w-6 text-gray-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-xs mb-1">الحضور</p>
                                <p className="text-3xl font-bold text-green-600">{attendanceCount}</p>
                            </div>
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-xs mb-1">الغياب</p>
                                <p className="text-3xl font-bold text-red-600">{absenceCount}</p>
                            </div>
                            <AlertCircle className="h-6 w-6 text-red-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-xs mb-1">التأخر</p>
                                <p className="text-3xl font-bold text-yellow-600">{latenessCount}</p>
                            </div>
                            <Calendar className="h-6 w-6 text-yellow-400" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-xs mb-1">معذور</p>
                                <p className="text-3xl font-bold text-purple-600">{excusedCount}</p>
                            </div>
                            <CheckCircle2 className="h-6 w-6 text-purple-400" />
                        </div>
                    </Card>
                </div>

                {/* رسم بياني الحضور */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">توزيع الحضور والغياب</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* تقارير الحضور الشهرية محسّنة */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        تقارير الحضور الشهرية
                    </h3>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                📅 اختر الشهر
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                            />
                        </div>
                        <Button
                            onClick={() => {
                                console.log(`Generating report for ${selectedMonth}`);
                            }}
                            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                        >
                            📊 إنشاء تقرير
                        </Button>
                    </div>
                </Card>

                {/* Info Card محسّن */}
                <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">ℹ️</span>
                        <div>
                            <p className="font-semibold text-gray-800 mb-1">نصيحة مهمة</p>
                            <p className="text-gray-700 text-sm">
                                يمكنك تسجيل الحضور والغياب مباشرة أدناه. استخدم الحقول لتحديث بيانات الحضور والنقر على "حفظ جميع التعديلات" عند الانتهاء.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Attendance Records Section */}
                <AttendanceRecordsSection
                    data={attendanceRecords}
                    onSave={handleUpdateAttendanceRecords}
                    isReadOnly={false}
                />

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