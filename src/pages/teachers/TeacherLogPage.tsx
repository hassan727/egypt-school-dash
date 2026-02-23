import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeacherNavigation } from '@/components/TeacherProfile/TeacherNavigation';
import { AuditTrailSection } from '@/components/TeacherProfile/AuditTrailSection';
import { PrintOptionsModal } from '@/components/TeacherProfile/PrintOptionsModal';
import { useTeacherData } from '@/hooks/useTeacherData';
import { AlertTriangle, ArrowRight, History, FileText } from 'lucide-react';

export default function TeacherLogPage() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const { teacherProfile, loading, error } = useTeacherData(teacherId || '');

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-96 w-full" />
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
            </DashboardLayout>
        );
    }

    const teacherName = teacherProfile.personalData.fullNameAr;
    const totalChanges = teacherProfile.auditTrail?.length || 0;

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
                <TeacherNavigation teacherId={teacherId || ''} activeSection="log" />

                {/* رأس الصفحة مع تدرج */}
                <div className="bg-gradient-to-r from-gray-700 to-slate-800 text-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-xl">
                                <History className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">سجل التغييرات</h1>
                                <p className="text-gray-300">
                                    {teacherName} • تاريخ جميع التغييرات على بيانات المعلم
                                </p>
                            </div>
                        </div>
                        <div className="text-left flex items-center gap-3">
                            <div>
                                <p className="text-gray-300 text-sm">إجمالي التغييرات</p>
                                <p className="text-3xl font-bold">{totalChanges}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full">
                                <FileText className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ملاحظة */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                        💡 <strong>ملاحظة:</strong> يتم تسجيل جميع التغييرات تلقائياً مع اسم المستخدم الذي قام بالتعديل والتاريخ والوقت.
                    </p>
                </div>

                {/* قسم سجل التغييرات */}
                <AuditTrailSection auditTrail={teacherProfile.auditTrail} />
            </div>
        </DashboardLayout>
    );
}
