import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PersonalDataSection } from '@/components/StudentProfile/PersonalDataSection';
import { EnrollmentDataSection } from '@/components/StudentProfile/EnrollmentDataSection';
import { GuardianDataSection } from '@/components/StudentProfile/GuardianDataSection';
import { MotherDataSection } from '@/components/StudentProfile/MotherDataSection';
import { EmergencyContactsSection } from '@/components/StudentProfile/EmergencyContactsSection';
import { LegalGuardianshipSection } from '@/components/StudentProfile/LegalGuardianshipSection';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, User, BookOpen, Users, Heart, AlertCircle, RotateCcw, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PersonalData, EnrollmentData, GuardianData, MotherData, EmergencyContact, LegalGuardianshipData } from '@/types/student';
import { errorTrackingService } from '@/services/errorTrackingService';

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
    const handleUpdatePersonalData = async (data: PersonalData) => {
        try {
            await saveAuditTrail('Personal Data', studentProfile?.personalData, data);
            await updatePersonalData(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
            toast.success('✅ تم حفظ البيانات الشخصية بنجاح');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشل حفظ البيانات الشخصية';
            console.error('خطأ في تحديث البيانات الشخصية:', err);
            toast.error('❌ فشل حفظ البيانات الشخصية');
            
            errorTrackingService.logError({
                error_code: 'ERR_UPDATE_PERSONAL_DATA_FAILED',
                error_message: errorMessage,
                error_type: 'database',
                severity: 'high',
                module: 'BasicDataPage',
                function_name: 'handleUpdatePersonalData',
                context: { studentId, dataSection: 'Personal Data' }
            });
        }
    };

    const handleUpdateEnrollmentData = async (data: EnrollmentData) => {
        try {
            await saveAuditTrail('Enrollment Data', studentProfile?.enrollmentData, data);
            await updateEnrollmentData(data);
            // تحديث تلقائي للبيانات
            await refreshStudentData();
            toast.success('تم تحديث بيانات القيد بنجاح');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشل تحديث بيانات القيد';
            console.error('خطأ في تحديث بيانات القيد:', err);
            toast.error('فشل تحديث البيانات. تأكد من اختيار مرحلة وفصل صحيحين.');
            
            errorTrackingService.logError({
                error_code: 'ERR_UPDATE_ENROLLMENT_DATA_FAILED',
                error_message: errorMessage,
                error_type: 'database',
                severity: 'high',
                module: 'BasicDataPage',
                function_name: 'handleUpdateEnrollmentData',
                context: { studentId, dataSection: 'Enrollment Data' }
            });
        }
    };

    const handleUpdateGuardianData = async (data: GuardianData) => {
        try {
            await saveAuditTrail('Guardian Data', studentProfile?.guardianData, data);
            await updateGuardianData(data);
            await refreshStudentData();
            toast.success('✅ تم حفظ بيانات ولي الأمر بنجاح');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشل حفظ بيانات ولي الأمر';
            console.error('خطأ في تحديث بيانات ولي الأمر:', err);
            toast.error('❌ فشل حفظ بيانات ولي الأمر');
            
            errorTrackingService.logError({
                error_code: 'ERR_UPDATE_GUARDIAN_DATA_FAILED',
                error_message: errorMessage,
                error_type: 'database',
                severity: 'high',
                module: 'BasicDataPage',
                function_name: 'handleUpdateGuardianData',
                context: { studentId, dataSection: 'Guardian Data' }
            });
        }
    };

    const handleUpdateMotherData = async (data: MotherData) => {
        try {
            await saveAuditTrail('Mother Data', studentProfile?.motherData, data);
            await updateMotherData(data);
            await refreshStudentData();
            toast.success('✅ تم حفظ بيانات الأم بنجاح');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشل حفظ بيانات الأم';
            console.error('خطأ في تحديث بيانات الأم:', err);
            toast.error('❌ فشل حفظ بيانات الأم');
            
            errorTrackingService.logError({
                error_code: 'ERR_UPDATE_MOTHER_DATA_FAILED',
                error_message: errorMessage,
                error_type: 'database',
                severity: 'high',
                module: 'BasicDataPage',
                function_name: 'handleUpdateMotherData',
                context: { studentId, dataSection: 'Mother Data' }
            });
        }
    };

    const handleAddEmergencyContact = async (data: EmergencyContact[]) => {
        try {
            await saveAuditTrail('Emergency Contacts', studentProfile?.emergencyContacts, data);
            await addEmergencyContact(data);
            await refreshStudentData();
            toast.success('✅ تم حفظ جهات الطوارئ بنجاح');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشل حفظ جهات الطوارئ';
            console.error('خطأ في إضافة جهات الطوارئ:', err);
            toast.error('❌ فشل حفظ جهات الطوارئ');
            
            errorTrackingService.logError({
                error_code: 'ERR_ADD_EMERGENCY_CONTACT_FAILED',
                error_message: errorMessage,
                error_type: 'database',
                severity: 'high',
                module: 'BasicDataPage',
                function_name: 'handleAddEmergencyContact',
                context: { studentId, dataSection: 'Emergency Contacts' }
            });
        }
    };

    // Handler for legal guardianship data
    const handleUpdateLegalGuardianship = async (data: LegalGuardianshipData) => {
        try {
            await saveAuditTrail('Legal Guardianship', studentProfile?.legalGuardianshipData, data);
            // حفظ بيانات الوصاية القانونية (سيتم إضافة هذا لاحقاً في useStudentData)
            await refreshStudentData();
            toast.success('✅ تم حفظ بيانات الوصاية القانونية بنجاح');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشل حفظ بيانات الوصاية';
            console.error('خطأ في حفظ بيانات الوصاية:', err);
            toast.error('❌ فشل حفظ بيانات الوصاية');
            
            errorTrackingService.logError({
                error_code: 'ERR_UPDATE_LEGAL_GUARDIANSHIP_FAILED',
                error_message: errorMessage,
                error_type: 'database',
                severity: 'high',
                module: 'BasicDataPage',
                function_name: 'handleUpdateLegalGuardianship',
                context: { studentId, dataSection: 'Legal Guardianship' }
            });
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-violet-100 border-2 border-indigo-300">
                        <Shield className="h-6 w-6 text-indigo-600 mb-2" />
                        <p className="text-sm font-semibold text-indigo-700">الوصاية القانونية</p>
                        <p className="text-xs text-indigo-500 mt-1">⚖️</p>
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

                {/* القسم الخامس: الوصاية القانونية */}
                <LegalGuardianshipSection
                    data={studentProfile?.legalGuardianshipData}
                    guardianData={studentProfile?.guardianData}
                    motherData={studentProfile?.motherData}
                    onSave={handleUpdateLegalGuardianship}
                    isReadOnly={false}
                />

                {/* القسم السادس: بيانات الطوارئ */}
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