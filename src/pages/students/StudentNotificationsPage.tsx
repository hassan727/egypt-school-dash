import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import NotificationsTab from '@/components/student-profile/NotificationsTab';
import { useStudentData } from '@/hooks/useStudentData';
import { Loader } from 'lucide-react';

export function StudentNotificationsPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const { studentProfile, loading } = useStudentData(studentId || '');

    const studentName = studentProfile?.personalData?.fullNameAr || 'الطالب';

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

    return (
        <DashboardLayout>
            <NotificationsTab
                studentId={studentId || ''}
                studentName={studentName}
            />
        </DashboardLayout>
    );
}

export default StudentNotificationsPage;
