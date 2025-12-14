import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle, MessageSquare, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AcademicSummaryCards } from '@/components/StudentProfile/AcademicSummaryCards';
import { AcademicAuditLog } from '@/components/StudentProfile/AcademicAuditLog';
import { Progress } from "@/components/ui/progress";
import { MessageModal } from '@/components/notifications/MessageModal';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PrintOptionsModal } from '@/components/StudentProfile/PrintOptionsModal';

interface NotificationLog {
    id: string;
    created_at: string;
    type: 'internal' | 'whatsapp';
    status: string;
    title?: string;
    content: string;
}

interface StudentDashboardData {
    // البيانات الأساسية
    studentId: string;
    fullNameAr: string;
    stage: string;
    class: string;
    guardianFullName?: string;
    guardianPhone?: string;
    registrationStatus?: string;

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

    // الإشعارات
    recentNotifications?: NotificationLog[];
}

export function StudentProfileDashboard() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        guardian_full_name,
        guardian_phone,
        registration_status
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

            // جلب آخر الإشعارات
            const { data: notificationsData } = await supabase
                .from('notifications')
                .select('*')
                .eq('student_id', studentData.student_id) // Assuming linking by string ID, if UUID check schema. Schema uses student_id VARCHAR FK.
                .order('created_at', { ascending: false })
                .limit(3);

            // دمج البيانات
            const dashboardData: StudentDashboardData = {
                studentId: studentData.student_id,
                fullNameAr: studentData.full_name_ar,
                stage: studentData.stage,
                class: studentData.class,
                guardianFullName: studentData.guardian_full_name,
                guardianPhone: studentData.guardian_phone,
                registrationStatus: studentData.registration_status,
                ...academicData,
                ...feesData,
                ...behavioralData,
                remainingAmount: feesData
                    ? feesData.total_amount - (feesData.advance_payment || 0)
                    : 0,
                recentNotifications: notificationsData || []
            };

            setData(dashboardData);
        } catch (err) {
            console.error('خطأ في تحميل البيانات:', err);
            setError('حدث خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudentDashboard();
    }, [studentId]);

    if (loading) {
        return (
            <PageLayout title="تحميل البيانات...">
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
            <PageLayout title="خطأ">
                <Card className="p-6 bg-red-50">
                    <p className="text-red-800">{error || 'حدث خطأ في تحميل البيانات'}</p>
                    <Button onClick={() => navigate(-1)} className="mt-4">
                        العودة
                    </Button>
                </Card>
            </PageLayout>
        );
    }

    const isProvisionallyRegistered = data.registrationStatus === 'provisionally_registered';

    return (
        <PageLayout
            title={`بروفايل الطالب - ${data.fullNameAr}`}
        >
            {/* زر العودة */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        العودة
                    </Button>

                    <PrintOptionsModal
                        studentId={data.studentId}
                        studentName={data.fullNameAr}
                    />
                </div>

                {isProvisionallyRegistered && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        مسجل مبدئياً
                    </span>
                )}
            </div>

            {/* Incomplete Profile Warning */}
            {isProvisionallyRegistered && (
                <Card className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                ملف الطالب غير مكتمل
                            </h3>
                            <p className="text-yellow-700 mb-3">
                                يرجى استكمال البيانات المطلوبة لتفعيل ملف الطالب وتمكينه من الظهور في التقارير الرسمية.
                            </p>
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-xs text-yellow-800 mb-1">
                                    <span>نسبة الإكمال</span>
                                    <span>40%</span>
                                </div>
                                <Progress value={40} className="h-2 bg-yellow-200" indicatorClassName="bg-yellow-600" />
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/students/${studentId}/complete-profile`)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
                        >
                            إكمال البيانات الآن
                        </Button>
                    </div>
                </Card>
            )}

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

                {/* بطاقة التواصل والإشعارات - NEW */}
                <Card className="p-6 hover:shadow-lg transition-shadow border-blue-100 bg-blue-50/30">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-blue-800">
                            <MessageSquare className="w-5 h-5" />
                            التواصل والإشعارات
                        </h3>

                        {/* Sent Logs Preview */}
                        <div className="space-y-3 min-h-[100px]">
                            {data.recentNotifications && data.recentNotifications.length > 0 ? (
                                data.recentNotifications.map((notif) => (
                                    <div key={notif.id} className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2 last:border-0">
                                        <Badge variant={notif.type === 'whatsapp' ? 'secondary' : 'outline'} className="text-[10px] px-1 h-5">
                                            {notif.type === 'whatsapp' ? 'W' : 'S'}
                                        </Badge>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-gray-700 font-medium text-xs">
                                                {notif.title || notif.content}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {format(new Date(notif.created_at), 'dd/MM p', { locale: ar })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4">لا توجد رسائل سابقة</p>
                            )}
                        </div>

                        <MessageModal
                            studentId={data.studentId}
                            studentName={data.fullNameAr}
                            parentPhone={data.guardianPhone || ""}
                            trigger={
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    إرسال رسالة جديدة
                                </Button>
                            }
                        />
                    </div>
                </Card>

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
                            onClick={() => navigate(`/student/${studentId}/behavioral-management`)}
                            className="w-full"
                        >
                            الإدارة السلوكية
                        </Button>
                    </div>
                </Card>

                {/* بطاقة الإشعارات */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">الإشعارات</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">إجمالي الإشعارات:</span>
                                <span className="font-semibold">{data.recentNotifications?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">غير مقروءة:</span>
                                <span className="font-semibold text-orange-600">
                                    {data.recentNotifications?.filter(n => n.status !== 'read').length || 0}
                                </span>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(`/student/${studentId}/notifications`)}
                            className="w-full"
                        >
                            إدارة الإشعارات
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
