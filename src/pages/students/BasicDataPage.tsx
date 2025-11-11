import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PersonalDataSection } from '@/components/StudentProfile/PersonalDataSection';
import { EnrollmentDataSection } from '@/components/StudentProfile/EnrollmentDataSection';
import { GuardianDataSection } from '@/components/StudentProfile/GuardianDataSection';
import { MotherDataSection } from '@/components/StudentProfile/MotherDataSection';
import { EmergencyContactsSection } from '@/components/StudentProfile/EmergencyContactsSection';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, User, BookOpen, Users, Heart, AlertCircle, RotateCcw } from 'lucide-react';

/**
 * صفحة البيانات الأساسية للطالب
 * تجمع 5 أقسام:
 * 1. البيانات الشخصية
 * 2. بيانات القيد الدراسي
 * 3. بيانات ولي الأمر
 * 4. بيانات الأم
 * 5. بيانات الطوارئ
 */
export default function BasicDataPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const {
        studentProfile,
        loading,
        error,
        saveAuditTrail,
        updatePersonalData,
        updateEnrollmentData,
        updateGuardianData,
        updateMotherData,
        addEmergencyContact,
        refreshStudentData,
        undoLastChange,
    } = useStudentData(studentId || '');

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
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
                    <p className="text-red-500">حدث خطأ: {error}</p>
                </div>
            </DashboardLayout>
        );
    }

    // Handler functions for updating data with automatic refresh
    const handleUpdatePersonalData = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Personal Data', studentProfile?.personalData, data);
            await updatePersonalData(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث البيانات الشخصية:', err);
        }
    };

    const handleUpdateEnrollmentData = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Enrollment Data', studentProfile?.enrollmentData, data);
            await updateEnrollmentData(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث بيانات القيد:', err);
        }
    };

    const handleUpdateGuardianData = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Guardian Data', studentProfile?.guardianData, data);
            await updateGuardianData(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث بيانات ولي الأمر:', err);
        }
    };

    const handleUpdateMotherData = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Mother Data', studentProfile?.motherData, data);
            await updateMotherData(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث بيانات الأم:', err);
        }
    };

    const handleAddEmergencyContact = async (data: Record<string, unknown>) => {
        try {
            await saveAuditTrail('Emergency Contacts', studentProfile?.emergencyContacts, data);
            await addEmergencyContact(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في إضافة جهات الطوارئ:', err);
        }
    };

    const handleUndoLastChange = async () => {
        try {
            await undoLastChange();
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في التراجع عن آخر تغيير:', err);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* Header with navigation */}
                <div className="mb-8 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <User className="h-8 w-8" />
                                <h1 className="text-4xl font-bold">
                                    البيانات الأساسية
                                </h1>
                            </div>
                            <p className="text-indigo-100">
                                معرّف الطالب: <span className="font-semibold">{studentId}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUndoLastChange}
                                variant="outline"
                                className="flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 border-none"
                            >
                                <RotateCcw className="h-4 w-4" />
                                التراجع
                            </Button>
                            <Button
                                onClick={() => navigate(`/student/${studentId}/dashboard`)}
                                variant="outline"
                                className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                العودة
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info Card with sections guide */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <User className="h-6 w-6 text-blue-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">البيانات الشخصية</p>
                        <p className="text-xs text-gray-500 mt-1">👤</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                        <BookOpen className="h-6 w-6 text-green-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">بيانات القيد</p>
                        <p className="text-xs text-gray-500 mt-1">📚</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                        <Users className="h-6 w-6 text-purple-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">ولي الأمر</p>
                        <p className="text-xs text-gray-500 mt-1">👨‍👩‍👧</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200">
                        <Heart className="h-6 w-6 text-pink-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">بيانات الأم</p>
                        <p className="text-xs text-gray-500 mt-1">👩</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                        <AlertCircle className="h-6 w-6 text-orange-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">الطوارئ</p>
                        <p className="text-xs text-gray-500 mt-1">🆘</p>
                    </Card>
                </div>

                {/* القسم الأول: البيانات الشخصية */}
                <PersonalDataSection
                    data={studentProfile?.personalData}
                    onSave={handleUpdatePersonalData}
                    isReadOnly={false}
                />

                {/* القسم الثاني: بيانات القيد الدراسي */}
                <EnrollmentDataSection
                    data={studentProfile?.enrollmentData}
                    onSave={handleUpdateEnrollmentData}
                    isReadOnly={false}
                />

                {/* القسم الثالث: بيانات ولي الأمر */}
                <GuardianDataSection
                    data={studentProfile?.guardianData}
                    onSave={handleUpdateGuardianData}
                    isReadOnly={false}
                />

                {/* القسم الرابع: بيانات الأم */}
                <MotherDataSection
                    data={studentProfile?.motherData}
                    onSave={handleUpdateMotherData}
                    isReadOnly={false}
                />

                {/* القسم الخامس: بيانات الطوارئ */}
                <EmergencyContactsSection
                    data={studentProfile?.emergencyContacts}
                    onSave={handleAddEmergencyContact}
                    isReadOnly={false}
                />

                {/* Footer Navigation */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        onClick={() => navigate(`/student/${studentId}/dashboard`)}
                        variant="outline"
                    >
                        العودة
                    </Button>
                    <div className="text-sm text-gray-500">
                        تم تحديث البيانات بنجاح
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}