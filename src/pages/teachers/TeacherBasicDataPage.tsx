import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeacherNavigation } from '@/components/TeacherProfile/TeacherNavigation';
import { PersonalDataSection } from '@/components/TeacherProfile/PersonalDataSection';
import { PrintOptionsModal } from '@/components/TeacherProfile/PrintOptionsModal';
import { useTeacherData } from '@/hooks/useTeacherData';
import { AlertTriangle, ArrowRight, User, Plus } from 'lucide-react';

export default function TeacherBasicDataPage() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const {
        teacherProfile,
        loading,
        error,
        updatePersonalData,
        updateEmploymentData
    } = useTeacherData(teacherId || '');

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

    const teacherName = teacherProfile.personalData.fullNameAr;

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
                <TeacherNavigation teacherId={teacherId || ''} activeSection="basic-data" />

                {/* رأس الصفحة مع تدرج */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/20 rounded-xl">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">البيانات الأساسية</h1>
                            <p className="text-blue-100">
                                {teacherName} • البيانات الشخصية والوظيفية
                            </p>
                        </div>
                    </div>
                </div>

                {/* قسم البيانات */}
                <PersonalDataSection
                    personalData={teacherProfile.personalData}
                    employmentData={teacherProfile.employmentData}
                    onUpdatePersonal={updatePersonalData}
                    onUpdateEmployment={updateEmploymentData}
                />
            </div>
        </DashboardLayout>
    );
}
