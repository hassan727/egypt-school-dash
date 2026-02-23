import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeacherNavigation } from '@/components/TeacherProfile/TeacherNavigation';
import { AttendanceRecordsSection } from '@/components/TeacherProfile/AttendanceRecordsSection';
import { PrintOptionsModal } from '@/components/TeacherProfile/PrintOptionsModal';
import { useTeacherData } from '@/hooks/useTeacherData';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle } from 'lucide-react';

export default function TeacherAttendancePage() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const { teacherProfile, loading, error, createLeaveRequest } = useTeacherData(teacherId || '');

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28" />)}
                    </div>
                    <Skeleton className="h-64 w-full" />
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
                        <h2 className="text-xl font-semibold text-red-800 mb-2">خطأ في تحميل البيانات</h2>
                        <p className="text-red-600 mb-4">{error || 'المعلم غير موجود'}</p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={() => navigate('/teachers')}
                                variant="outline"
                                className="gap-2"
                            >
                                <ArrowRight className="h-4 w-4" />
                                قائمة المعلمين
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const teacherName = teacherProfile.personalData.fullNameAr;

    // حساب نسبة الحضور
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyAttendance = teacherProfile.attendanceRecords.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const presentDays = monthlyAttendance.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
    const attendanceRate = monthlyAttendance.length > 0 ? Math.round((presentDays / monthlyAttendance.length) * 100) : 100;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                {/* Navigation & Actions Bar */}
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
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
                <TeacherNavigation teacherId={teacherId || ''} activeSection="attendance" />

                {/* رأس الصفحة مع تدرج */}
                <div className="bg-gradient-to-r from-purple-600 to-violet-700 text-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-xl">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">الحضور والإجازات</h1>
                                <p className="text-purple-100">
                                    {teacherName} • سجل الحضور وأرصدة وطلبات الإجازات
                                </p>
                            </div>
                        </div>
                        <div className="text-left flex items-center gap-4">
                            <div>
                                <p className="text-purple-100 text-sm">نسبة الحضور</p>
                                <p className="text-3xl font-bold">{attendanceRate}%</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* قسم سجل الحضور */}
                <AttendanceRecordsSection
                    attendanceRecords={teacherProfile.attendanceRecords}
                    leaveRequests={teacherProfile.leaveRequests}
                    leaveBalance={teacherProfile.leaveBalance}
                    onCreateLeaveRequest={createLeaveRequest}
                />
            </div>
        </DashboardLayout>
    );
}
