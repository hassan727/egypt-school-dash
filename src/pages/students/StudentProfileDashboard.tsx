import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AcademicSummaryCards } from '@/components/StudentProfile/AcademicSummaryCards';
import { AcademicAuditLog } from '@/components/StudentProfile/AcademicAuditLog';

/**
 * صفحة بروفايل الطالب - Dashboard الرئيسي
 * 
 * هذه صفحة عرض فقط (لا تعديل مباشر)
 * وظيفتها: عرض ملخصات سريعة من جميع أقسام البيانات
 * 
 * المميزات:
 * - تعرض لمحة عامة سريعة عن حالة الطالب
 * - تحتوي على روابط سريعة للصفحات المتخصصة
 * - تحديث تلقائي عند العودة من صفحات التعديل
 */

interface StudentDashboardData {
    // البيانات الأساسية
    studentId: string;
    fullNameAr: string;
    stage: string;
    class: string;
    guardianFullName?: string;

    // ملخص أكاديمي
    currentGPA?: number;
    averageMarks?: number;
    academicNotes?: string;

    // ملخص مالي
    totalAmount?: number;
    advancePayment?: number;
    remainingAmount?: number;

    // ملخص الحضور
    attendanceRate?: number;
    absences?: number;

    // ملخص السلوك
    disciplinaryIssues?: boolean;
    disciplinaryDetails?: string;
    conductRating?: string;
}

export function StudentProfileDashboard() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStudentDashboard = async () => {
            if (!studentId) {
                setError('معرف الطالب غير محدد');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // جلب البيانات الأساسية من جدول students
                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .select(`
            student_id,
            full_name_ar,
            stage,
            class,
            guardian_full_name
          `)
                    .eq('student_id', studentId)
                    .single();

                if (studentError) throw studentError;
                if (!studentData) {
                    setError('لم يتم العثور على الطالب');
                    return;
                }

                // جلب البيانات الأكاديمية
                const { data: academicData } = await supabase
                    .from('academic_records')
                    .select('current_gpa, average_marks, academic_notes')
                    .eq('student_id', studentId)
                    .single();

                // جلب البيانات المالية
                const { data: feesData } = await supabase
                    .from('school_fees')
                    .select('total_amount, advance_payment')
                    .eq('student_id', studentId)
                    .single();

                // جلب بيانات الحضور
                const { data: behavioralData } = await supabase
                    .from('behavioral_records')
                    .select('attendance_rate, absences, disciplinary_issues, conduct_rating')
                    .eq('student_id', studentId)
                    .single();

                // دمج البيانات
                const dashboardData: StudentDashboardData = {
                    ...studentData,
                    ...academicData,
                    ...feesData,
                    ...behavioralData,
                    remainingAmount: feesData
                        ? feesData.total_amount - (feesData.advance_payment || 0)
                        : 0,
                };

                setData(dashboardData);
            } catch (err) {
                console.error('خطأ في تحميل البيانات:', err);
                setError('حدث خطأ في تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };

        loadStudentDashboard();
    }, [studentId]);

    if (loading) {
        return (
            <PageLayout title="تحميل البيانات..." showBreadcrumb={false}>
                <div className="space-y-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </PageLayout>
        );
    }

    if (error || !data) {
        return (
            <PageLayout title="خطأ" showBreadcrumb={false}>
                <Card className="p-6 bg-red-50">
                    <p className="text-red-800">{error || 'حدث خطأ في تحميل البيانات'}</p>
                    <Button onClick={() => navigate(-1)} className="mt-4">
                        العودة
                    </Button>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={`بروفايل الطالب - ${data.fullNameAr}`}
            showBreadcrumb={false}
        >
            {/* زر العودة */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    العودة
                </Button>
            </div>

            {/* Academic Summary Cards - Now Dynamic */}
            <div className="mb-6">
                <AcademicSummaryCards studentId={studentId!} />
            </div>

            {/* Academic Audit Log */}
            <div className="mb-6">
                <AcademicAuditLog />
            </div>

            {/* شبكة البطاقات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* بطاقة البيانات الأساسية */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">البيانات الأساسية</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">الاسم:</span>
                                <span className="font-semibold">{data.fullNameAr}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">الصف:</span>
                                <span className="font-semibold">{data.stage} - {data.class}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">ولي الأمر:</span>
                                <span className="font-semibold">{data.guardianFullName || '-'}</span>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/basic-data`)}
                            className="w-full"
                        >
                            تعديل البيانات الأساسية
                        </Button>
                    </div>
                </Card>

                {/* بطاقة الملخص الأكاديمي */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">الملخص الأكاديمي</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">المعدل:</span>
                                <span className="font-semibold">{data.currentGPA?.toFixed(2) || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">متوسط الدرجات:</span>
                                <span className="font-semibold">{data.averageMarks?.toFixed(2) || '-'}</span>
                            </div>
                            {data.academicNotes && (
                                <div>
                                    <span className="text-gray-600">ملاحظات:</span>
                                    <p className="text-sm mt-1">{data.academicNotes}</p>
                                </div>
                            )}
                        </div>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/academic`)}
                            className="w-full"
                        >
                            الإدارة الأكاديمية
                        </Button>
                    </div>
                </Card>

                {/* بطاقة الملخص المالي */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">الملخص المالي</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">المستحق:</span>
                                <span className="font-semibold">{data.totalAmount || '0'} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">المسدد:</span>
                                <span className="font-semibold text-green-600">{data.advancePayment || '0'} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">المتبقي:</span>
                                <span className="font-semibold text-red-600">{data.remainingAmount || '0'} ج.م</span>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/finance`)}
                            className="w-full"
                        >
                            الإدارة المالية
                        </Button>
                    </div>
                </Card>

                {/* بطاقة الحضور */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">الحضور</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">نسبة الحضور:</span>
                                <span className="font-semibold">{data.attendanceRate || '0'}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">أيام الغياب:</span>
                                <span className="font-semibold">{data.absences || '0'}</span>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/attendance`)}
                            className="w-full"
                        >
                            إدارة الحضور
                        </Button>
                    </div>
                </Card>

                {/* بطاقة السلوك والإدارة */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">السلوك</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">التقييم:</span>
                                <span className="font-semibold">{data.conductRating || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">مشاكل سلوكية:</span>
                                <span className={`font-semibold ${data.disciplinaryIssues ? 'text-red-600' : 'text-green-600'}`}>
                                    {data.disciplinaryIssues ? 'نعم' : 'لا'}
                                </span>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/behavioral`)}
                            className="w-full"
                        >
                            الإدارة السلوكية
                        </Button>
                    </div>
                </Card>

                {/* بطاقة السجل */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">السجل</h3>
                        <p className="text-gray-600 text-sm">عرض سجل جميع التغييرات التي طرأت على بيانات الطالب</p>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/log`)}
                            className="w-full"
                        >
                            عرض السجل
                        </Button>
                    </div>
                </Card>

            </div>
        </PageLayout>
    );
}

export default StudentProfileDashboard;