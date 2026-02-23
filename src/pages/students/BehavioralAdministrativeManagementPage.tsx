import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BehavioralSection } from '@/components/StudentProfile/BehavioralSection';
import { AdministrativeSection } from '@/components/StudentProfile/AdministrativeSection';
import { useStudentData } from '@/hooks/useStudentData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, AlertTriangle, BarChart3, TrendingUp, Clock, RotateCcw, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * صفحة الإدارة السلوكية والإدارية
 * تجمع 2 قسم:
 * 1. البيانات السلوكية
 * 2. البيانات الإدارية
 * 
 * هذه صفحة جماعية تدعم:
 * - تسجيل الملاحظات السلوكية
 * - إدارة التقارير الإدارية
 * - تتبع الحوادث والمشاكل السلوكية
 * - حفظ جميع التعديلات دفعة واحدة
 */
export default function BehavioralAdministrativeManagementPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const {
        studentProfile,
        loading,
        error,
        updateAdministrativeData,
        updateBehavioralData,
        refreshStudentData,
        undoLastChange,
        saveAuditTrail,
    } = useStudentData(studentId || '');

    interface BehavioralRecordRow {
        id: string;
        student_id: string;
        conduct_rating: string | null;
        attendance_rate: number | null;
        absences: number | null;
        tardiness: number | null;
        disciplinary_issues: boolean | null;
        disciplinary_details: string | null;
        participation_level: string | null;
        classroom_behavior: string | null;
        social_interaction: string | null;
        counselor_notes: string | null;
        last_incident_date: string | null;
        created_at: string;
    }
    const [behavioralRecords, setBehavioralRecords] = useState<BehavioralRecordRow[]>([]);
    const [behavioralLoading, setBehavioralLoading] = useState(true);

    // Year selection state (align with financial page)
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [showYearView, setShowYearView] = useState<boolean>(false);
    const [yearStart, setYearStart] = useState<string>('');
    const [yearEnd, setYearEnd] = useState<string>('');
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 8 }, (_, i) => {
        const startYear = currentYear - 2 + i;
        const endYear = startYear + 1;
        return `${startYear}-${endYear}`;
    });

    // Default selected year from enrollment data
    useEffect(() => {
        if (studentProfile?.enrollmentData?.academicYear && !selectedYear) {
            setSelectedYear(studentProfile.enrollmentData.academicYear);
        }
    }, [studentProfile, selectedYear]);

    // Fetch year bounds from academic_years
    useEffect(() => {
        const fetchYearBounds = async () => {
            if (!selectedYear) return;
            const { data, error } = await supabase
                .from('academic_years')
                .select('start_date, end_date')
                .eq('year_code', selectedYear)
                .maybeSingle();
            if (!error && data) {
                setYearStart(data.start_date);
                setYearEnd(data.end_date);
            }
        };
        fetchYearBounds();
    }, [selectedYear]);

    const handleViewYearBehavioral = () => {
        if (selectedYear) setShowYearView(true);
    };

    // Year-filtered records and stats
    const recordsInYear = behavioralRecords.filter((r) => {
        if (!yearStart || !yearEnd) return true;
        const dateStr = r.last_incident_date || r.created_at;
        const d = new Date(dateStr);
        return d >= new Date(yearStart) && d <= new Date(yearEnd);
    });
    const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const monthlyIncidents = monthNames.map((name, idx) => {
        const count = recordsInYear.filter((r) => {
            const dateStr = r.last_incident_date || r.created_at;
            const d = new Date(dateStr);
            return d.getMonth() === idx && ((r.disciplinary_issues === true) || (!!r.disciplinary_details));
        }).length;
        return { month: name, incidents: count };
    });
    const yearNotesCount = recordsInYear.length;
    const yearIncidentsCount = recordsInYear.filter((r) => (r.disciplinary_issues === true) || (!!r.disciplinary_details)).length;
    const yearAvgAttendance = recordsInYear.length > 0
        ? Math.round((recordsInYear.reduce((sum, r) => sum + (r.attendance_rate || 0), 0) / recordsInYear.length))
        : (studentProfile?.behavioralRecords?.[0]?.attendanceRate || 0);
    const yearTotalAbsences = recordsInYear.reduce((sum, r) => sum + (r.absences || 0), 0);
    const yearTotalTardiness = recordsInYear.reduce((sum, r) => sum + (r.tardiness || 0), 0);

    // Fetch behavioral records
    useEffect(() => {
        if (!studentId) return;

        const fetchBehavioralRecords = async () => {
            try {
                setBehavioralLoading(true);
                const { data, error } = await supabase
                    .from('behavioral_records')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setBehavioralRecords((data || []) as BehavioralRecordRow[]);
            } catch (err) {
                console.error('Error fetching behavioral records:', err);
            } finally {
                setBehavioralLoading(false);
            }
        };

        fetchBehavioralRecords();
    }, [studentId]);

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading || behavioralLoading) {
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

    const handleUpdateAdministrativeData = async (data: Record<string, unknown>) => {
        try {
            // Convert data to AdministrativeData type
            const administrativeData = {
                studentId: studentId || '',
                admissionDate: data.admissionDate as string || '',
                studentIdNumber: data.studentIdNumber as string || '',
                fileStatus: data.fileStatus as 'نشط' | 'معطل' | 'مغلق' | 'معلق' || 'نشط',
                infoUpdateDate: data.infoUpdateDate as string || '',
                transportationStatus: data.transportationStatus as 'لا يستخدم' | 'يستخدم' || 'لا يستخدم',
                busNumber: data.busNumber as string || '',
                pickupPoint: data.pickupPoint as string || '',
                schoolDocumentsComplete: Boolean(data.schoolDocumentsComplete),
                documentsNotes: data.documentsNotes as string || '',
                healthInsurance: Boolean(data.healthInsurance),
                healthInsuranceNumber: data.healthInsuranceNumber as string || '',
                administrativeNotes: data.administrativeNotes as string || '',
                emergencyContactUpdated: data.emergencyContactUpdated as string || '',
            };
            
            await saveAuditTrail('Administrative Data', studentProfile?.administrativeData, administrativeData);
            await updateAdministrativeData(administrativeData);
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث البيانات الإدارية:', err);
        }
    };

    const handleUpdateBehavioralData = async (data: Record<string, unknown>) => {
        try {
            // Convert data to BehavioralRecord type
            const behavioralData = {
                studentId: studentId || '',
                conductRating: data.conductRating as 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف' || 'جيد',
                attendanceRate: Number(data.attendanceRate) || 0,
                absences: Number(data.absences) || 0,
                tardiness: Number(data.tardiness) || 0,
                disciplinaryIssues: Boolean(data.disciplinaryIssues),
                disciplinaryDetails: data.disciplinaryDetails as string || '',
                participationLevel: data.participationLevel as 'عالي' | 'متوسط' | 'منخفض' || 'متوسط',
                classroomBehavior: data.classroomBehavior as string || '',
                socialInteraction: data.socialInteraction as string || '',
                counselorNotes: data.counselorNotes as string || '',
                lastIncidentDate: data.lastIncidentDate as string || '',
            };
            
            // Save audit trail with behavioral records data
            await saveAuditTrail('Behavioral Data', studentProfile?.behavioralRecords?.[0], behavioralData);
            await updateBehavioralData(behavioralData);
            await refreshStudentData();
        } catch (err) {
            console.error('خطأ في تحديث البيانات السلوكية:', err);
        }
    };

    const handleUndoLastChange = async () => {
        try {
            const success = await undoLastChange();
            if (success) {
                console.log('تم التراجع عن آخر تغيير بنجاح');
                await refreshStudentData();
            } else {
                console.warn('فشل التراجع عن التغيير');
            }
        } catch (err) {
            console.error('خطأ في التراجع:', err);
        }
    };

    // حساب الإحصائيات
    const notesCount = behavioralRecords.length;
    const recentIncidents = behavioralRecords.filter((r) => r.disciplinary_details).length;
    const conductRating = studentProfile?.behavioralRecords?.[0]?.conductRating || 'جيد';
    const disciplinaryIssues = studentProfile?.behavioralRecords?.[0]?.disciplinaryIssues || false;

    // بيانات الرسم البياني
    const chartData = [
        { name: 'الملاحظات', count: notesCount, fill: '#F59E0B' },
        { name: 'الحوادث', count: recentIncidents, fill: '#EF4444' },
        { name: 'الشهادات', count: Math.max(0, 5 - recentIncidents), fill: '#10B981' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
                {/* Header with navigation */}
                <div className="mb-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="h-8 w-8" />
                                <h1 className="text-4xl font-bold">
                                    الإدارة السلوكية والإدارية
                                </h1>
                            </div>
                            <p className="text-red-100">
                                معرّف الطالب: <span className="font-semibold">{studentId}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleUndoLastChange}
                                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                <RotateCcw className="h-4 w-4" />
                                التراجع
                            </Button>
                            <Button
                                onClick={() => navigate(`/student/${studentId}/dashboard`)}
                                variant="outline"
                                className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 border-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                العودة
                            </Button>
                        </div>
                </div>
            </div>

            {/* Year Selection */}
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div className="text-center space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">اختيار السنة الدراسية</h2>
                        <p className="text-gray-600">اختر السنة الدراسية لعرض السجل السلوكي</p>
                    </div>

                    <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر السنة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((year) => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleViewYearBehavioral}
                            disabled={!selectedYear}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Eye className="h-4 w-4" />
                            عرض
                        </Button>
                    </div>

                    <div className="text-sm text-gray-500">السنة الافتراضية: {studentProfile?.enrollmentData?.academicYear || 'غير محدد'}</div>
                </div>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    تقييم السلوك
                                </p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {conductRating}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    الملاحظات السلوكية
                                </p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {notesCount}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    الحوادث المسجلة
                                </p>
                                <p className={`text-3xl font-bold ${recentIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {recentIncidents}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {recentIncidents > 0 ? '⚠️ تنبيه' : '✅ نظيف'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

            {/* Year Dashboard (shown after selection) */}
            {showYearView && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"><div className="text-center"><p className="text-gray-600 text-sm mb-2">نسبة الحضور</p><p className="text-2xl font-bold text-blue-600">{yearAvgAttendance}%</p></div></Card>
                        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200"><div className="text-center"><p className="text-gray-600 text-sm mb-2">الملاحظات</p><p className="text-2xl font-bold text-yellow-600">{yearNotesCount}</p></div></Card>
                        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200"><div className="text-center"><p className="text-gray-600 text-sm mb-2">الحوادث</p><p className="text-2xl font-bold text-red-600">{yearIncidentsCount}</p></div></Card>
                        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"><div className="text-center"><p className="text-gray-600 text-sm mb-2">أيام الغياب</p><p className="text-2xl font-bold text-purple-600">{yearTotalAbsences}</p></div></Card>
                        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200"><div className="text-center"><p className="text-gray-600 text-sm mb-2">أيام التأخير</p><p className="text-2xl font-bold text-green-600">{yearTotalTardiness}</p></div></Card>
                    </div>

                    <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الحوادث شهرياً</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyIncidents}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="incidents" name="الحوادث" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {recordsInYear.length > 0 && (
                        <Card className="p-6 border border-gray-200 mt-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">سجل الملاحظات للسنة المختارة</h3>
                            <div className="space-y-3">
                                {recordsInYear.slice(0, 10).map((record) => (
                                    <div key={record.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between mb-2">
                                            <p className="font-semibold text-gray-800">{record.disciplinary_details || 'ملاحظة سلوكية'}</p>
                                            <p className="text-sm text-gray-500">{new Date(record.created_at).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                        <p className="text-sm text-gray-600">{record.counselor_notes || 'لا توجد ملاحظات إضافية'}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Charts Section */}
            {notesCount > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Chart */}
                        <Card className="p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-red-600" />
                                ملخص السلوك
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8B5CF6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Timeline Chart */}
                        <Card className="p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-red-600" />
                                اتجاه الملاحظات
                            </h3>
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-sm">بيانات الاتجاه تُحدّث تلقائياً</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Warning Card */}
                <Card className="p-6 bg-red-50 border border-red-200">
                    <div className="flex gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">
                                ملاحظة هامة
                            </h3>
                            <p className="text-gray-700 text-sm">
                                هذه الصفحة تحتوي على بيانات حساسة تتعلق بسلوك الطالب. يرجى التأكد من
                                دقة جميع المعلومات المدخلة والالتزام بسياسات الخصوصية.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Info Card */}
                <Card className="p-6 bg-blue-50 border border-blue-200">
                    <p className="text-gray-700 text-sm">
                        ℹ️ يمكنك تسجيل الملاحظات السلوكية والبيانات الإدارية أدناه. استخدم هذه
                        الصفحة لتوثيق الحوادث والقضايا السلوكية والنقر على "حفظ جميع التعديلات" عند الانتهاء.
                    </p>
                </Card>

                {/* القسم الأول: البيانات السلوكية */}
                <BehavioralSection
                    data={{
                        conductRating: (studentProfile?.behavioralRecords?.[0]?.conductRating as 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف') || 'جيد',
                        attendanceRate: studentProfile?.behavioralRecords?.[0]?.attendanceRate || 0,
                        absences: studentProfile?.behavioralRecords?.[0]?.absences || 0,
                        tardiness: studentProfile?.behavioralRecords?.[0]?.tardiness || 0,
                        disciplinaryIssues: studentProfile?.behavioralRecords?.[0]?.disciplinaryIssues || false,
                        disciplinaryDetails: studentProfile?.behavioralRecords?.[0]?.disciplinaryDetails || '',
                        participationLevel: (studentProfile?.behavioralRecords?.[0]?.participationLevel as 'عالي' | 'متوسط' | 'منخفض') || 'متوسط',
                        classroomBehavior: studentProfile?.behavioralRecords?.[0]?.classroomBehavior || '',
                        socialInteraction: studentProfile?.behavioralRecords?.[0]?.socialInteraction || '',
                        counselorNotes: studentProfile?.behavioralRecords?.[0]?.counselorNotes || '',
                        lastIncidentDate: studentProfile?.behavioralRecords?.[0]?.lastIncidentDate || '',
                    }}
                    onSave={handleUpdateBehavioralData}
                    isReadOnly={false}
                />

                {/* القسم الثاني: البيانات الإدارية */}
                <AdministrativeSection
                    data={{
                        admissionDate: studentProfile?.administrativeData?.admissionDate || '',
                        studentIdNumber: studentProfile?.administrativeData?.studentIdNumber || '',
                        fileStatus: (studentProfile?.administrativeData?.fileStatus as 'نشط' | 'معطل' | 'مغلق' | 'معلق') || 'نشط',
                        infoUpdateDate: studentProfile?.administrativeData?.infoUpdateDate || '',
                        transportationStatus: (studentProfile?.administrativeData?.transportationStatus as 'لا يستخدم' | 'يستخدم') || 'لا يستخدم',
                        busNumber: studentProfile?.administrativeData?.busNumber || '',
                        pickupPoint: studentProfile?.administrativeData?.pickupPoint || '',
                        schoolDocumentsComplete: studentProfile?.administrativeData?.schoolDocumentsComplete || false,
                        documentsNotes: studentProfile?.administrativeData?.documentsNotes || '',
                        healthInsurance: studentProfile?.administrativeData?.healthInsurance || false,
                        healthInsuranceNumber: studentProfile?.administrativeData?.healthInsuranceNumber || '',
                        administrativeNotes: studentProfile?.administrativeData?.administrativeNotes || '',
                        emergencyContactUpdated: studentProfile?.administrativeData?.emergencyContactUpdated || '',
                    }}
                    onSave={handleUpdateAdministrativeData}
                    isReadOnly={false}
                />

                {/* Behavioral Records History */}
                {behavioralRecords.length > 0 && (
                    <Card className="p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            سجل الملاحظات السلوكية
                        </h3>
                        <div className="space-y-3">
                            {behavioralRecords.slice(0, 5).map((record, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                                >
                                    <div className="flex justify-between mb-2">
                                        <p className="font-semibold text-gray-800">
                                            {record.disciplinary_details || 'ملاحظة سلوكية'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(
                                                record.created_at
                                            ).toLocaleDateString('ar-EG')}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {record.counselor_notes || 'لا توجد ملاحظات إضافية'}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {behavioralRecords.length > 5 && (
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => navigate(`/student/${studentId}/log`)}
                            >
                                عرض جميع الملاحظات
                            </Button>
                        )}
                    </Card>
                )}

                {/* Footer Navigation */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        onClick={() => navigate(`/student/${studentId}/dashboard`)}
                        variant="outline"
                    >
                        العودة
                    </Button>
                    <div className="text-sm text-gray-500">
                        آخر تحديث: الآن
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}