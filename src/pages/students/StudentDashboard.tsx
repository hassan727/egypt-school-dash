import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useStudentData } from '@/hooks/useStudentData';
import { useNotifications } from '@/hooks/useNotifications';
import { AcademicAuditLog } from '@/components/AcademicAuditLog';
import { GuardianWhatsAppDialog } from '@/components/GuardianWhatsAppDialog';
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
    Plus,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PrintOptionsModal } from '@/components/StudentProfile/PrintOptionsModal';

/**
 * صفحة Dashboard بروفايل الطالب
 * هذه صفحة عرض فقط تعرض ملخصات سريعة من جميع الأقسام
 * تحتوي على روابط للصفحات المتخصصة لكل قسم
 */
export default function StudentDashboard() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { studentProfile, loading, error } = useStudentData(studentId || '');
    const { notifications } = useNotifications({ student_id: studentId || '' });

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
                <div className="text-center py-10 space-y-4">
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-800 mb-2">الطالب غير موجود</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-600 mb-4">
                            الطالب ذو المعرف "{studentId}" غير موجود في قاعدة البيانات
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={() => navigate('/students')}
                                variant="outline"
                                className="gap-2"
                            >
                                <ArrowRight className="h-4 w-4" />
                                قائمة الطلاب
                            </Button>
                            <Button
                                onClick={() => navigate('/students/create')}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4" />
                                إضافة طالب جديد
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const studentName = studentProfile?.personalData?.fullNameAr || 'الطالب';
    const currentClass = studentProfile?.enrollmentData?.class || 'غير محدد';
    const guardianName = studentProfile?.guardianData?.fullName || 'غير محدد';

    // Country codes mapping
    const COUNTRY_CODES: Record<string, string> = {
        'مصري': '20',
        'سعودي': '966',
        'إماراتي': '971',
        'كويتي': '965',
        'قطري': '974',
        'بحريني': '973',
        'عماني': '968',
        'يمني': '967',
        'أردني': '962',
        'لبناني': '961',
        'سوري': '963',
        'عراقي': '964',
        'فلسطيني': '970',
        'سوداني': '249',
        'ليبي': '218',
        'تونسي': '216',
        'جزائري': '213',
        'مغربي': '212',
        'موريتاني': '222',
        'صومالي': '252',
        'جيبوتي': '253',
        'قمري': '269',
    };

    // Format phone number for WhatsApp with country code
    const formatPhoneForWhatsApp = (phone: string | undefined, nationality: string | undefined): string => {
        if (!phone) return '';

        // Remove all non-numeric characters
        let cleanPhone = phone.replace(/[^0-9]/g, '');

        // If phone already starts with country code (like 20, 966, etc.), return as is
        if (cleanPhone.length > 10) {
            return cleanPhone;
        }

        // Remove leading zero if present
        if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1);
        }

        // Get country code based on nationality (default to Egypt)
        const countryCode = COUNTRY_CODES[nationality || 'مصري'] || '20';

        return countryCode + cleanPhone;
    };

    // Get the formatted WhatsApp number
    const guardianWhatsApp = studentProfile?.guardianData?.whatsappNumber || studentProfile?.guardianData?.phone;
    const guardianNationality = studentProfile?.guardianData?.nationality;
    const formattedWhatsAppNumber = formatPhoneForWhatsApp(guardianWhatsApp, guardianNationality);

    // حساب إحصائيات أكاديمية
    const academicRecords = studentProfile?.academicRecords || [];
    const currentGPA = academicRecords.length > 0 ? academicRecords[0].currentGPA || 0 : 0;
    const totalMarks = academicRecords.length > 0 ? academicRecords[0].totalMarks || 0 : 0;

    // حساب إحصائيات مالية (المستحق مقابل المدفوع الفعلي)
    const schoolFees = studentProfile?.schoolFees;
    const totalAmount = schoolFees?.totalAmount || 0;
    const transactions = studentProfile?.financialTransactions || [];
    const totalPaid = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const remaining = Math.max(totalAmount - totalPaid, 0);

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
    const behavioralRecord = studentProfile?.behavioralRecords?.[0];
    const conductRating = behavioralRecord?.conductRating || 'جيد';
    const disciplinaryIssues = behavioralRecord?.disciplinaryIssues || false;
    const behavioralNotes: any[] = []; // Placeholder - needs proper implementation
    const administrativeRecords: any[] = []; // Placeholder - needs proper implementation
    const notesCount = 0;
    const adminReportsCount = 0;

    // إعداد بيانات الرسوم البيانية
    const financialChartData = [
        { name: 'المسدد', value: totalPaid, fill: '#10b981' },
        { name: 'المتبقي', value: remaining, fill: '#ef4444' }
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
                {/* Navigation & Actions */}
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/students')}
                        className="gap-2"
                    >
                        <ArrowRight className="h-4 w-4" /> {/* ArrowRight because logical RTL? Wait, lucide is LTR. In RTL UI ArrowRight points Left? No, usually ArrowRight points Right. ArrowLeft points Left. */}
                        {/* Checking existing imports: ArrowRight is imported. ArrowLeft is NOT imported. */}
                        {/* In RTL (Arabic), "Back" usually means pointing to the list (Right? or Left?). */}
                        {/* In `StudentProfileDashboard.tsx` it used ArrowLeft. Let's stick to ArrowRight if that's what is imported, or check. */}
                        {/* Actually, let's look at line 15: ArrowRight is imported. */}
                        {/* Let's double check standard RTL back icon direction. Usually it points to the start of flow. In RTL start is Right. So ArrowRight is correct for "Back" to parent? */}
                        {/* Wait, the browser back button points Left in LTR. In RTL it points Right. */}
                        {/* Let's just use ArrowRight as it is already imported and used in the error view (line 75). */}
                        العودة لقائمة الطلاب
                    </Button>

                    <div className="flex gap-2">
                        <PrintOptionsModal
                            studentId={studentId || ''}
                            studentName={studentName}
                        />
                    </div>
                </div>

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

                {/* ⚖️ بطاقة الوصاية القانونية البارزة */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 border-2 border-indigo-300 rounded-xl p-6 shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-600 rounded-xl shadow-md">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                    ⚖️ الوصاية القانونية
                                </h2>
                                <p className="text-sm text-indigo-600 mt-1">
                                    الشخص المخول قانونياً باتخاذ القرارات نيابة عن الطالب
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {/* اسم الوصي القانوني */}
                        <div className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                            <p className="text-xs text-indigo-500 font-semibold uppercase mb-1">الوصي القانوني</p>
                            <p className="text-lg font-bold text-indigo-900">
                                {guardianName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                صلة القرابة: {studentProfile?.guardianData?.relationship || 'أب'}
                            </p>
                        </div>

                        {/* رقم الهاتف */}
                        <div className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                            <p className="text-xs text-indigo-500 font-semibold uppercase mb-1">📱 الهاتف</p>
                            <p className="text-lg font-bold text-gray-800 dir-ltr text-right">
                                {studentProfile?.guardianData?.phone || 'غير محدد'}
                            </p>
                        </div>

                        {/* رقم الواتساب مع زر الإرسال */}
                        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                            <p className="text-xs text-green-600 font-semibold uppercase mb-1">📲 واتساب</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-bold text-gray-800 dir-ltr">
                                        {guardianWhatsApp || 'غير محدد'}
                                    </p>
                                    {formattedWhatsAppNumber && (
                                        <p className="text-xs text-green-600 dir-ltr">
                                            +{formattedWhatsAppNumber}
                                        </p>
                                    )}
                                </div>
                                {formattedWhatsAppNumber && (
                                    <GuardianWhatsAppDialog
                                        studentId={studentId}
                                        studentName={studentName}
                                        guardianName={guardianName}
                                        formattedPhoneNumber={formattedWhatsAppNumber}
                                        displayPhoneNumber={guardianWhatsApp || ''}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ملاحظة */}
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700">
                            💡 <strong>ملاحظة:</strong> سيتم إرسال إشعار واتساب تلقائي للوصي القانوني عند تنفيذ أي معاملة مالية أو إدارية.
                        </p>
                    </div>
                </div>

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
                            <div className="flex gap-2">
                                <Button
                                    onClick={() =>
                                        navigate(`/student/${studentId}/behavioral-dashboard`)
                                    }
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                                >
                                    <Award className="h-3 w-3" />
                                    إدارة
                                </Button>
                            </div>
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

                {/* بطاقة الإشعارات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-indigo-100">
                                    <AlertTriangle className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الإشعارات</h2>
                            </div>
                            <Button
                                onClick={() =>
                                    navigate(`/student/${studentId}/notifications`)
                                }
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                <span className="text-gray-700">إجمالي الإشعارات</span>
                                <span className="text-2xl font-bold text-indigo-600">{notifications.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <span className="text-gray-700">غير مقروءة</span>
                                <span className="text-2xl font-bold text-orange-600">{notifications.filter(n => n.status !== 'read').length}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Placeholder for future card or keep it single */}
                    <div></div>
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

                {/* سجل التغييرات الأكاديمية */}
                <AcademicAuditLog studentId={studentId || ''} />
            </div>
        </DashboardLayout>
    );
}
