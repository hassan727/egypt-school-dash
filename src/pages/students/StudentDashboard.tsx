import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User,
    BookOpen,
    DollarSign,
    Calendar,
    AlertTriangle,
    ArrowRight,
    FileText,
    Users,
    Loader,
    TrendingUp,
    Award,
    Clock,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * صفحة Dashboard بروفايل الطالب
 * هذه صفحة عرض فقط تعرض ملخصات سريعة من جميع الأقسام
 * تحتوي على روابط للصفحات المتخصصة لكل قسم
 */
export default function StudentDashboard() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { studentProfile, loading, error } = useStudentData(studentId || '');

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500 text-lg">لم يتم تحديد معرّف الطالب</p>
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
                    <p className="text-red-500 text-lg">حدث خطأ: {error}</p>
                </div>
            </DashboardLayout>
        );
    }

    const studentName = studentProfile?.personalData?.fullNameAr || 'الطالب';
    const currentClass = studentProfile?.enrollmentData?.class || 'غير محدد';
    const guardianName = studentProfile?.guardianData?.fullName || 'غير محدد';

    // حساب إحصائيات أكاديمية
    const academicRecords = studentProfile?.academicRecords || [];
    const currentGPA = academicRecords.length > 0 ? academicRecords[0].currentGPA || 0 : 0;
    const totalMarks = academicRecords.length > 0 ? academicRecords[0].totalMarks || 0 : 0;

    // حساب إحصائيات مالية
    const schoolFees = studentProfile?.schoolFees;
    const totalAmount = schoolFees?.totalAmount || 0;
    const advancePayment = schoolFees?.advancePayment || 0;
    const remaining = totalAmount - advancePayment;

    // حساب إحصائيات الحضور
    const attendanceRecords = studentProfile?.attendanceRecords || [];
    const attendanceCount = attendanceRecords.filter(
        (r) => r.status === 'حاضر'
    ).length;
    const absenceCount = attendanceRecords.filter(
        (r) => r.status === 'غائب'
    ).length;
    const attendanceRate =
        attendanceRecords.length > 0
            ? Math.round((attendanceCount / attendanceRecords.length) * 100)
            : 0;

    // حساب إحصائيات السلوك
    const conductRating = studentProfile?.behavioralData?.conductRating || 'جيد';
    const disciplinaryIssues = studentProfile?.behavioralData?.disciplinaryIssues || false;
    const behavioralNotes = studentProfile?.behavioralData?.notes || [];
    const administrativeRecords = studentProfile?.administrativeData?.records || [];
    const notesCount = Array.isArray(behavioralNotes) ? behavioralNotes.length : 0;
    const adminReportsCount = Array.isArray(administrativeRecords) ? administrativeRecords.length : 0;

    // إعداد بيانات الرسوم البيانية
    const financialChartData = [
        { name: 'المسدد', value: advancePayment, fill: '#10b981' },
        { name: 'المتبقي', value: Math.max(remaining, 0), fill: '#ef4444' }
    ];

    const attendanceChartData = [
        { name: 'الحضور', value: attendanceCount, fill: '#10b981' },
        { name: 'الغياب', value: absenceCount, fill: '#ef4444' }
    ];

    // التنبيهات
    const alerts = [];
    if (remaining > 0) alerts.push({ type: 'financial', message: `المتبقي: ${remaining.toLocaleString()} جنيه`, severity: 'warning' });
    if (attendanceRate < 80) alerts.push({ type: 'attendance', message: `نسبة الحضور منخفضة: ${attendanceRate}%`, severity: 'warning' });
    if (disciplinaryIssues) alerts.push({ type: 'behavioral', message: 'يوجد مشاكل سلوكية', severity: 'error' });
    if (currentGPA < 2.0) alerts.push({ type: 'academic', message: `المعدل منخفض: ${currentGPA.toFixed(2)}`, severity: 'error' });

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                {/* رأس الصفحة محسّن */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">لوحة التحكم</h1>
                            <p className="text-blue-100">مرحباً بك، {studentName}</p>
                            <p className="text-blue-200 text-sm mt-2">الصف: {currentClass} | المعرّف: {studentId}</p>
                        </div>
                        <Award className="h-16 w-16 text-blue-200 opacity-50" />
                    </div>
                </div>

                {/* التنبيهات */}
                {alerts.length > 0 && (
                    <div className="space-y-2">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg flex items-center gap-3 ${alert.severity === 'error'
                                    ? 'bg-red-50 border border-red-200 text-red-800'
                                    : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                    }`}
                            >
                                <AlertTriangle className="h-5 w-5" />
                                <span className="text-sm font-medium">{alert.message}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* شبكة الملخصات السريعة */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* بطاقة سريعة: GPA */}
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">المعدل التراكمي</p>
                                <p className="text-3xl font-bold text-green-600">{currentGPA.toFixed(2)}</p>
                                <p className="text-xs text-gray-500 mt-1">{academicRecords.length} مواد</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-400" />
                        </div>
                    </Card>

                    {/* بطاقة سريعة: الحضور */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">نسبة الحضور</p>
                                <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
                                <p className="text-xs text-gray-500 mt-1">{attendanceCount} يوم حاضر</p>
                            </div>
                            <Calendar className="h-8 w-8 text-blue-400" />
                        </div>
                    </Card>

                    {/* بطاقة سريعة: المبلغ المتبقي */}
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">المتبقي</p>
                                <p className="text-3xl font-bold text-purple-600">{Math.round(remaining)}</p>
                                <p className="text-xs text-gray-500 mt-1">جنيه</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-400" />
                        </div>
                    </Card>

                    {/* بطاقة سريعة: السلوك */}
                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">تقييم السلوك</p>
                                <p className="text-3xl font-bold text-orange-600">{conductRating}</p>
                                <p className="text-xs text-gray-500 mt-1">{disciplinaryIssues ? 'مشاكل' : 'جيد'}</p>
                            </div>
                            <Award className="h-8 w-8 text-orange-400" />
                        </div>
                    </Card>
                </div>

                {/* بطاقة البيانات الأساسية */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-blue-100">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    البيانات الأساسية
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-xs uppercase font-semibold">الاسم</p>
                                    <p className="text-lg font-semibold text-gray-800 mt-1">
                                        {studentName}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-xs uppercase font-semibold">الصف</p>
                                    <p className="text-lg font-semibold text-gray-800 mt-1">
                                        {currentClass}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-xs uppercase font-semibold">ولي الأمر</p>
                                    <p className="text-lg font-semibold text-gray-800 mt-1">
                                        {guardianName}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() =>
                                navigate(`/student/${studentId}/basic-data`)
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap"
                        >
                            <ArrowRight className="h-4 w-4" />
                            تعديل
                        </Button>
                    </div>
                </Card>

                {/* الملخص الأكاديمي والمالي */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* بطاقة الملخص الأكاديمي */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-green-100">
                                    <BookOpen className="h-6 w-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الملخص الأكاديمي</h2>
                            </div>
                            <Button
                                onClick={() =>
                                    navigate(`/student/${studentId}/academic-management`)
                                }
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-gray-700">المعدل التراكمي</span>
                                <span className="text-2xl font-bold text-green-600">{currentGPA.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-gray-700">عدد المواد</span>
                                <span className="text-2xl font-bold text-blue-600">{academicRecords.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <span className="text-gray-700">آخر تقييم</span>
                                <span className="text-2xl font-bold text-purple-600">{totalMarks > 0 ? totalMarks : 'لم يتم'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* بطاقة الملخص المالي مع رسم بياني */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-purple-100">
                                    <DollarSign className="h-6 w-6 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الملخص المالي</h2>
                            </div>
                            <Button
                                onClick={() =>
                                    navigate(`/student/${studentId}/financial-management`)
                                }
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={financialChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {financialChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value.toLocaleString()} جنيه`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* الحضور والسلوك */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* بطاقة الحضور مع رسم بياني */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-orange-100">
                                    <Calendar className="h-6 w-6 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الحضور والغياب</h2>
                            </div>
                            <Button
                                onClick={() =>
                                    navigate(`/student/${studentId}/attendance-management`)
                                }
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={attendanceChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {attendanceChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* بطاقة السلوك والإدارة */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-red-100">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">السلوك والإدارة</h2>
                            </div>
                            <Button
                                onClick={() =>
                                    navigate(`/student/${studentId}/behavioral-management`)
                                }
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <span className="text-gray-700">عدد الملاحظات</span>
                                <span className="text-2xl font-bold text-red-600">{notesCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                <span className="text-gray-700">التقارير الإدارية</span>
                                <span className="text-2xl font-bold text-yellow-600">{adminReportsCount}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* بطاقة السجل */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-gray-100">
                                    <FileText className="h-6 w-6 text-gray-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    سجل التغييرات
                                </h2>
                            </div>
                            <p className="text-gray-600">
                                عرض كل التغييرات التي تمت على بيانات الطالب مع التفاصيل الكاملة والمستخدم الذي قام بالتعديل
                            </p>
                        </div>
                        <Button
                            onClick={() =>
                                navigate(`/student/${studentId}/log`)
                            }
                            className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2 whitespace-nowrap ml-4"
                        >
                            <ArrowRight className="h-4 w-4" />
                            عرض السجل
                        </Button>
                    </div>
                </Card>

                {/* زر العودة */}
                <div className="flex justify-end">
                    <Button
                        onClick={() => navigate('/students')}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        العودة إلى قائمة الطلاب
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}