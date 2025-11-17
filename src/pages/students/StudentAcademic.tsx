import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AcademicSection } from '@/components/StudentProfile/AcademicSection';
import { StudentNavigation } from '@/components/StudentProfile/StudentNavigation';
import { HierarchicalGradeForm } from '@/components/StudentProfile/HierarchicalGradeForm';
import { HierarchicalAcademicDisplay } from '@/components/StudentProfile/HierarchicalAcademicDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * صفحة البيانات الأكاديمية الكاملة للطالب
 * 
 * تحتوي على:
 * 1. عرض البيانات الأكاديمية - شجرة زمنية منظمة
 * 2. إدخال الدرجات - خطوات إجبارية 6
 * 3. البيانات الأكاديمية العامة
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
            <div className="space-y-8 max-w-7xl mx-auto py-6 px-4">
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

                {/* تبويبات الأقسام الأكاديمية */}
                <Tabs defaultValue="view" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="view">🔍 عرض البيانات</TabsTrigger>
                        <TabsTrigger value="add">➕ إدخال درجة</TabsTrigger>
                        <TabsTrigger value="summary">📊 الملخص</TabsTrigger>
                    </TabsList>

                    {/* تبويب عرض البيانات */}
                    <TabsContent value="view" className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">🌳 السجل الأكاديمي - عرض هرمي</h2>
                            <p className="text-gray-600">السنوات الدراسية مع الفصول والمواد والتقييمات</p>
                        </div>
                        <HierarchicalAcademicDisplay studentId={studentId} />
                    </TabsContent>

                    {/* تبويب إدخال درجة */}
                    <TabsContent value="add" className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">➕ إدخال درجة جديدة</h2>
                            <p className="text-gray-600">اتبع الخطوات الستة لإضافة درجة محددة السياق</p>
                        </div>
                        <HierarchicalGradeForm studentId={studentId} />
                    </TabsContent>

                    {/* تبويب الملخص */}
                    <TabsContent value="summary" className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">📊 الملخص الأكاديمي</h2>
                            <p className="text-gray-600">البيانات الأكاديمية العامة والمتوسطات</p>
                        </div>
                        <AcademicSection isReadOnly={false} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}