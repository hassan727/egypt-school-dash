import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherNavigation } from '@/components/TeacherProfile/TeacherNavigation';
import { PrintOptionsModal } from '@/components/TeacherProfile/PrintOptionsModal';
import { useTeacherData } from '@/hooks/useTeacherData';
import {
    User,
    Phone,
    Briefcase,
    DollarSign,
    BookOpen,
    Star,
    Calendar,
    Bell,
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    AlertCircle,
    ArrowRight,
    FileText,
    Award,
    Users,
    Plus,
    History
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';

export default function TeacherProfileDashboard() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const { teacherProfile, loading, error } = useTeacherData(teacherId || '');

    if (!teacherId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500 text-lg">لم يتم تحديد معرّف المعلم</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !teacherProfile) {
        return (
            <DashboardLayout>
                <div className="text-center py-10 space-y-4">
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-800 mb-2">المعلم غير موجود</h2>
                        <p className="text-red-600 mb-4">{error || 'البيانات غير متاحة'}</p>
                        <p className="text-sm text-gray-600 mb-4">
                            المعلم ذو المعرف "{teacherId}" غير موجود في قاعدة البيانات
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={() => navigate('/teachers')}
                                variant="outline"
                                className="gap-2"
                            >
                                <ArrowRight className="h-4 w-4" />
                                قائمة المعلمين
                            </Button>
                            <Button
                                onClick={() => navigate('/teachers/new')}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4" />
                                إضافة معلم جديد
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const { personalData, employmentData, currentSalary, teachingAssignments, evaluations, attendanceRecords, leaveBalance, notifications, salaryPayments } = teacherProfile;

    const teacherName = personalData?.fullNameAr || 'المعلم';
    const jobTitle = employmentData?.jobTitle || 'غير محدد';

    // الحسابات الديناميكية
    const totalWeeklyHours = teachingAssignments.reduce((sum, a) => sum + a.weeklyHours, 0);
    const totalClasses = [...new Set(teachingAssignments.map(a => a.classId))].length;
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyAttendance = attendanceRecords.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const presentDays = monthlyAttendance.filter(r => r.status === 'حاضر').length;
    const absentDays = monthlyAttendance.filter(r => r.status === 'غائب').length;
    const lateDays = monthlyAttendance.filter(r => r.status === 'متأخر').length;
    const attendanceRate = monthlyAttendance.length > 0 ? Math.round(((presentDays + lateDays) / monthlyAttendance.length) * 100) : 100;

    const latestEvaluation = evaluations[0];

    // إعداد بيانات الرسوم البيانية
    const salaryChartData = [
        { name: 'الراتب الأساسي', value: currentSalary?.baseSalary || 0, fill: '#10b981' },
        { name: 'البدلات', value: currentSalary?.totalAllowances || 0, fill: '#3b82f6' },
        { name: 'الاستقطاعات', value: currentSalary?.totalDeductions || 0, fill: '#ef4444' }
    ];

    const attendanceChartData = [
        { name: 'حضور', value: presentDays, fill: '#10b981' },
        { name: 'غياب', value: absentDays, fill: '#ef4444' },
        { name: 'تأخير', value: lateDays, fill: '#f59e0b' }
    ];

    // إرسال واتساب
    const handleWhatsApp = () => {
        if (personalData?.whatsappNumber || personalData?.phone) {
            const phone = (personalData.whatsappNumber || personalData.phone).replace(/\D/g, '');
            window.open(`https://wa.me/${phone}`, '_blank');
            toast.success('تم فتح واتساب');
        } else {
            toast.error('لا يوجد رقم واتساب مسجل');
        }
    };

    // التنبيهات
    const alerts: { type: string; message: string; severity: 'warning' | 'error' }[] = [];
    if (attendanceRate < 80) alerts.push({ type: 'attendance', message: `نسبة الحضور منخفضة: ${attendanceRate}%`, severity: 'warning' });
    if (absentDays > 3) alerts.push({ type: 'attendance', message: `عدد أيام الغياب مرتفع: ${absentDays} يوم`, severity: 'error' });
    if (unreadNotifications > 5) alerts.push({ type: 'notifications', message: `${unreadNotifications} إشعار غير مقروء`, severity: 'warning' });
    if (salaryPayments?.filter(p => p.paymentStatus === 'متأخر').length > 0) {
        alerts.push({ type: 'financial', message: 'يوجد رواتب متأخرة', severity: 'error' });
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                {/* Navigation & Actions */}
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/teachers')}
                        className="gap-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                        <ArrowRight className="h-4 w-4" />
                        العودة لقائمة المعلمين
                    </Button>

                    <div className="flex gap-2">
                        <PrintOptionsModal teacherProfile={teacherProfile} />
                    </div>
                </div>

                {/* شريط التنقل */}
                <TeacherNavigation teacherId={teacherId || ''} activeSection="dashboard" />

                {/* رأس الصفحة مع تدرج */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
                                {teacherName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold mb-2">لوحة التحكم</h1>
                                <p className="text-blue-100">مرحباً، {teacherName}</p>
                                <p className="text-blue-200 text-sm mt-2">
                                    {jobTitle} | الرقم الوظيفي: {employmentData?.employeeNumber}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${employmentData?.employmentStatus === 'نشط' ? 'bg-green-500' :
                                            employmentData?.employmentStatus === 'إجازة' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                        }`}>
                                        {employmentData?.employmentStatus}
                                    </span>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleWhatsApp}
                                        className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        واتساب
                                    </Button>
                                </div>
                            </div>
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

                {/* 📞 بطاقة بيانات الاتصال السريع */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 border-2 border-indigo-300 rounded-xl p-6 shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-600 rounded-xl shadow-md">
                                <Phone className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                    📞 بيانات الاتصال
                                </h2>
                                <p className="text-sm text-indigo-600 mt-1">
                                    تواصل مباشر مع المعلم
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {/* رقم الهاتف */}
                        <div className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                            <p className="text-xs text-indigo-500 font-semibold uppercase mb-1">📱 الهاتف</p>
                            <p className="text-lg font-bold text-gray-800 dir-ltr text-right">
                                {personalData?.phone || 'غير محدد'}
                            </p>
                        </div>

                        {/* البريد الإلكتروني */}
                        <div className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                            <p className="text-xs text-indigo-500 font-semibold uppercase mb-1">📧 البريد الإلكتروني</p>
                            <p className="text-lg font-bold text-blue-600 truncate">
                                {personalData?.email || 'غير محدد'}
                            </p>
                        </div>

                        {/* واتساب */}
                        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                            <p className="text-xs text-green-600 font-semibold uppercase mb-1">📲 واتساب</p>
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-bold text-gray-800 dir-ltr">
                                    {personalData?.whatsappNumber || personalData?.phone || 'غير محدد'}
                                </p>
                                {(personalData?.whatsappNumber || personalData?.phone) && (
                                    <Button
                                        size="sm"
                                        onClick={handleWhatsApp}
                                        className="gap-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        إرسال
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* شبكة الملخصات السريعة */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* بطاقة سريعة: الراتب */}
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">الراتب الصافي</p>
                                <p className="text-3xl font-bold text-green-600">{currentSalary?.netSalary?.toLocaleString() || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">جنيه/شهر</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-200">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                    </Card>

                    {/* بطاقة سريعة: الحضور */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">نسبة الحضور</p>
                                <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
                                <p className="text-xs text-gray-500 mt-1">{presentDays} يوم حاضر</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-200">
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    {/* بطاقة سريعة: الساعات */}
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">ساعات تدريسية</p>
                                <p className="text-3xl font-bold text-purple-600">{totalWeeklyHours}</p>
                                <p className="text-xs text-gray-500 mt-1">ساعة/أسبوع • {totalClasses} فصل</p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-200">
                                <BookOpen className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </Card>

                    {/* بطاقة سريعة: التقييم */}
                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">آخر تقييم</p>
                                <p className="text-3xl font-bold text-orange-600">{latestEvaluation?.overallRating || 'غير متاح'}</p>
                                <p className="text-xs text-gray-500 mt-1">{latestEvaluation?.evaluationDate || '-'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-200">
                                <Star className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* الملخص المالي والحضور مع الرسوم البيانية */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* بطاقة الملخص المالي مع رسم بياني */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-green-100">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الملخص المالي</h2>
                            </div>
                            <Button
                                onClick={() => navigate(`/teacher/${teacherId}/financial`)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salaryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {salaryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value.toLocaleString()} جنيه`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* بطاقة الحضور مع رسم بياني */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-blue-100">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الحضور والغياب</h2>
                            </div>
                            <Button
                                onClick={() => navigate(`/teacher/${teacherId}/attendance`)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
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
                </div>

                {/* البيانات الأساسية */}
                <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-blue-100">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">البيانات الأساسية</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-xs uppercase font-semibold">الاسم</p>
                                    <p className="text-lg font-semibold text-gray-800 mt-1">{teacherName}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-xs uppercase font-semibold">المسمى الوظيفي</p>
                                    <p className="text-lg font-semibold text-gray-800 mt-1">{jobTitle}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-xs uppercase font-semibold">التخصص</p>
                                    <p className="text-lg font-semibold text-gray-800 mt-1">{employmentData?.specialization || 'غير محدد'}</p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/teacher/${teacherId}/basic-data`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap"
                        >
                            <ArrowRight className="h-4 w-4" />
                            تعديل
                        </Button>
                    </div>
                </Card>

                {/* الأكاديمي والتقييمات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* المهام التدريسية */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-purple-100">
                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">المهام التدريسية</h2>
                            </div>
                            <Button
                                onClick={() => navigate(`/teacher/${teacherId}/professional`)}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {teachingAssignments.length > 0 ? (
                                teachingAssignments.slice(0, 4).map((a, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            <span className="font-medium text-gray-700">{a.subjectName}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{a.className} • {a.weeklyHours} ساعة</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-4">لا توجد مهام مسجلة</p>
                            )}
                        </div>
                    </Card>

                    {/* التقييمات */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-orange-100">
                                    <Star className="h-6 w-6 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">التقييمات والسلوك</h2>
                            </div>
                            <Button
                                onClick={() => navigate(`/teacher/${teacherId}/evaluations`)}
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                إدارة
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <span className="text-gray-700">آخر تقييم</span>
                                <span className="text-2xl font-bold text-orange-600">{latestEvaluation?.overallRating || 'لم يتم'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-gray-700">عدد التقييمات</span>
                                <span className="text-2xl font-bold text-green-600">{evaluations.length}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* الإشعارات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-indigo-100">
                                    <Bell className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">الإشعارات</h2>
                                {unreadNotifications > 0 && (
                                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{unreadNotifications}</span>
                                )}
                            </div>
                            <Button
                                onClick={() => navigate(`/teacher/${teacherId}/notifications`)}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                عرض
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                <span className="text-gray-700">إجمالي الإشعارات</span>
                                <span className="text-2xl font-bold text-indigo-600">{notifications.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <span className="text-gray-700">غير مقروءة</span>
                                <span className="text-2xl font-bold text-orange-600">{unreadNotifications}</span>
                            </div>
                        </div>
                    </Card>

                    {/* سجل التغييرات */}
                    <Card className="p-8 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 rounded-lg bg-gray-100">
                                        <History className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">سجل التغييرات</h2>
                                </div>
                                <p className="text-gray-600">
                                    عرض كل التغييرات التي تمت على بيانات المعلم مع التفاصيل الكاملة
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate(`/teacher/${teacherId}/log`)}
                                className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2 whitespace-nowrap ml-4"
                            >
                                <ArrowRight className="h-4 w-4" />
                                عرض السجل
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* زر العودة */}
                <div className="flex justify-end">
                    <Button
                        onClick={() => navigate('/teachers')}
                        variant="outline"
                        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                        <Users className="h-4 w-4" />
                        العودة إلى قائمة المعلمين
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
