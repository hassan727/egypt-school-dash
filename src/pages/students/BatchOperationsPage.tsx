import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBatchContext } from "@/components/batch/BatchContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Calendar,
    Bell,
    FileText,
    Archive,
    ArrowRight,
    GraduationCap,
    ClipboardCheck,
    MessageSquare,
    UserCog,
    History,
    AlertCircle
} from "lucide-react";

const BatchOperationsPage = () => {
    const { classId, className, stageName } = useBatchContext();
    const navigate = useNavigate();
    const [stats, setStats] = React.useState({
        totalStudents: 0,
        attendanceRate: 0,
        unexcusedAbsence: 0,
        behavioralAlerts: 0,
        isLoading: false
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            if (!classId) return;

            setStats(prev => ({ ...prev, isLoading: true }));
            try {
                // 1. Get total students
                const { count: studentCount, error: countError } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', classId)
                    .eq('registration_status', 'active');

                if (countError) throw countError;

                // 2. جلب إحصائيات الحضور الفعلية من قاعدة البيانات
                const today = new Date().toISOString().split('T')[0];

                // جلب معرفات الطلاب المسجلين في هذا الفصل
                const { data: studentsInClass } = await supabase
                    .from('students')
                    .select('student_id')
                    .eq('class_id', classId)
                    .eq('registration_status', 'active');

                const studentIds = studentsInClass?.map(s => s.student_id) || [];

                let attendanceRate = 0;
                let unexcusedCount = 0;
                let alertsCount = 0;

                if (studentIds.length > 0) {
                    // حضور اليوم
                    const { count: attendedToday } = await supabase
                        .from('attendance_records')
                        .select('*', { count: 'exact', head: true })
                        .in('student_id', studentIds)
                        .eq('date', today)
                        .eq('status', 'حاضر');

                    // الغياب غير المبرر
                    const { count: unexcused } = await supabase
                        .from('attendance_records')
                        .select('*', { count: 'exact', head: true })
                        .in('student_id', studentIds)
                        .eq('date', today)
                        .eq('status', 'غائب');

                    // التنبيهات السلوكية النشطة
                    const { count: alerts } = await supabase
                        .from('behavioral_records')
                        .select('*', { count: 'exact', head: true })
                        .in('student_id', studentIds)
                        .eq('disciplinary_issues', true);

                    attendanceRate = studentCount && attendedToday
                        ? Math.round((attendedToday / studentCount) * 100)
                        : 0;
                    unexcusedCount = unexcused || 0;
                    alertsCount = alerts || 0;
                }

                setStats({
                    totalStudents: studentCount || 0,
                    attendanceRate,
                    unexcusedAbsence: unexcusedCount,
                    behavioralAlerts: alertsCount,
                    isLoading: false
                });

            } catch (error) {
                console.error("Error fetching stats:", error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchStats();
    }, [classId]);

    const navigateTo = (path: string) => {
        if (classId) {
            navigate(`${path}?classId=${classId}`);
        } else {
            navigate(path);
        }
    };



    return (
        <div className="space-y-6">
            {!classId && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-3 text-yellow-800 mb-6">
                    <div className="bg-yellow-100 p-2 rounded-full">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="font-bold">تنبيه: لم يتم اختيار فصل دراسي</h3>
                        <p className="text-sm">يرجى اختيار المرحلة والفصل من القائمة العلوية لتفعيل أدوات الإدارة وعرض البيانات.</p>
                    </div>
                </div>
            )}

            {/* Dashboard Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Academic Card */}
                <Card
                    className="cursor-pointer transition-all duration-300 hover:shadow-md border bg-blue-50/50 hover:bg-blue-100/50 border-blue-200"
                    onClick={() => navigateTo("/students/batch/academic")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <GraduationCap className="w-8 h-8 text-blue-600" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-blue-600">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </Button>
                        </div>
                        <CardTitle className="mt-4 text-xl">نقل وتسكين الفصول</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                            تصحيح الفصول، النقل الداخلي، وتوزيع الطلاب على الفصول (للعام الحالي).
                        </CardDescription>
                        <div className="mt-auto pt-4 border-t border-blue-200">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-blue-800 font-medium">إجمالي الطلاب:</span>
                                <span className="font-bold text-blue-900">{stats.isLoading ? "..." : stats.totalStudents}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Card */}
                <Card
                    className="cursor-pointer transition-all duration-300 hover:shadow-md border bg-green-50/50 hover:bg-green-100/50 border-green-200"
                    onClick={() => navigateTo("/students/batch/attendance")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <ClipboardCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-green-600">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </Button>
                        </div>
                        <CardTitle className="mt-4 text-xl">الحضور والغياب</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                            تسجيل الحضور اليومي، رصد الغياب الجماعي، وإدارة الاستثناءات.
                        </CardDescription>
                        <div className="mt-auto pt-4 border-t border-green-200">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-green-800 font-medium">نسبة الحضور اليوم:</span>
                                <span className="font-bold text-green-900">
                                    {stats.isLoading ? "..." : (stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : "--")}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card
                    className="cursor-pointer transition-all duration-300 hover:shadow-md border bg-purple-50/50 hover:bg-purple-100/50 border-purple-200"
                    onClick={() => navigateTo("/students/batch/notifications")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <MessageSquare className="w-8 h-8 text-purple-600" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-purple-600">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </Button>
                        </div>
                        <CardTitle className="mt-4 text-xl">الإشعارات والتواصل</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                            إرسال رسائل جماعية للطلاب وأولياء الأمور، وإدارة التنبيهات.
                        </CardDescription>
                        <div className="mt-auto pt-4 border-t border-purple-200">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-purple-800 font-medium">رسائل مرسلة اليوم:</span>
                                <span className="font-bold text-purple-900">--</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profiles Card */}
                <Card
                    className="cursor-pointer transition-all duration-300 hover:shadow-md border bg-orange-50/50 hover:bg-orange-100/50 border-orange-200"
                    onClick={() => navigateTo("/students/batch/profiles")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <UserCog className="w-8 h-8 text-orange-600" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-orange-600">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </Button>
                        </div>
                        <CardTitle className="mt-4 text-xl">إدارة البيانات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                            تحديث بيانات الاتصال، استيراد البيانات، وتعديل الملفات.
                        </CardDescription>
                        <div className="mt-auto pt-4 border-t border-orange-200">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-orange-800 font-medium">نواقص بيانات:</span>
                                <span className="font-bold text-orange-900">{stats.isLoading ? "..." : "--"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Archive Card */}
                <Card
                    className="cursor-pointer transition-all duration-300 hover:shadow-md border bg-red-50/50 hover:bg-red-100/50 border-red-200"
                    onClick={() => navigateTo("/students/batch/archive")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <History className="w-8 h-8 text-red-600" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-600">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </Button>
                        </div>
                        <CardTitle className="mt-4 text-xl">الترقية والترحيل السنوي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                            الترقية للسنة القادمة، التخرج، أو النقل النهائي خارج المدرسة.
                        </CardDescription>
                        <div className="mt-auto pt-4 border-t border-red-200">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-red-800 font-medium">حالات منقولة:</span>
                                <span className="font-bold text-red-900">--</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>


        </div>
    );
};

export default BatchOperationsPage;
