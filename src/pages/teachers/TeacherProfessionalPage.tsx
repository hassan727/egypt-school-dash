import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeacherNavigation } from '@/components/TeacherProfile/TeacherNavigation';
import { TeachingAssignmentsSection } from '@/components/TeacherProfile/TeachingAssignmentsSection';
import { PrintOptionsModal } from '@/components/TeacherProfile/PrintOptionsModal';
import { useTeacherData } from '@/hooks/useTeacherData';
import { AlertTriangle, ArrowRight, BookOpen, GraduationCap, Clock } from 'lucide-react';

export default function TeacherProfessionalPage() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const { teacherProfile, loading, error } = useTeacherData(teacherId || '');

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
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
    const totalWeeklyHours = teacherProfile.teachingAssignments.reduce((sum, a) => sum + a.weeklyHours, 0);
    const totalClasses = [...new Set(teacherProfile.teachingAssignments.map(a => a.classId))].length;
    const certificationsCount = teacherProfile.certifications?.length || 0;

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
                <TeacherNavigation teacherId={teacherId || ''} activeSection="professional" />

                {/* رأس الصفحة مع تدرج */}
                <div className="bg-gradient-to-r from-cyan-600 to-teal-700 text-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-xl">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">المهني والتدريسي</h1>
                                <p className="text-cyan-100">
                                    {teacherName} • المهام التدريسية والدورات والشهادات
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-left">
                                <p className="text-cyan-100 text-sm">ساعات أسبوعية</p>
                                <p className="text-2xl font-bold flex items-center gap-1">
                                    <Clock className="h-5 w-5" />
                                    {totalWeeklyHours}
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-cyan-100 text-sm">الفصول</p>
                                <p className="text-2xl font-bold">{totalClasses}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-cyan-100 text-sm">الشهادات</p>
                                <p className="text-2xl font-bold flex items-center gap-1">
                                    <GraduationCap className="h-5 w-5" />
                                    {certificationsCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* قسم المهام التدريسية */}
                <TeachingAssignmentsSection
                    assignments={teacherProfile.teachingAssignments}
                    courses={teacherProfile.trainingCourses}
                    certifications={teacherProfile.certifications}
                />
            </div>
        </DashboardLayout>
    );
}
