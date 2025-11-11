import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AcademicSection } from '@/components/StudentProfile/AcademicSection';
import { StudentNavigation } from '@/components/StudentProfile/StudentNavigation';

/**
 * صفحة البيانات الأكاديمية الكاملة للطالب
 */
export default function StudentAcademic() {
    const { studentId } = useParams<{ studentId: string }>();

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* رأس الصفحة */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        البيانات الأكاديمية
                    </h1>
                    <p className="text-gray-600 mb-6">
                        معرّف الطالب: <span className="font-semibold">{studentId}</span>
                    </p>
                    <StudentNavigation studentId={studentId} />
                </div>

                {/* قسم الأكاديمية */}
                <AcademicSection isReadOnly={false} />
            </div>
        </DashboardLayout>
    );
}