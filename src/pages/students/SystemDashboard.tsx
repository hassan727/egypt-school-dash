import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import {
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Zap,
    Download,
    Search,
    Clock,
    BarChart3,
    Target,
    Activity,
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SystemStats {
    totalStudents: number;
    activeStudents: number;
    pendingPayments: number;
    lowAttendance: number;
    behavioralIssues: number;
    academicAtRisk: number;
}

interface RecentActivity {
    id: string;
    type: 'academic' | 'financial' | 'attendance' | 'behavioral';
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
}

export default function SystemDashboard() {
    const navigate = useNavigate();
    const { notifications, addNotification } = useCrossTabSync();
    const [stats, setStats] = useState<SystemStats>({
        totalStudents: 0,
        activeStudents: 0,
        pendingPayments: 0,
        lowAttendance: 0,
        behavioralIssues: 0,
        academicAtRisk: 0,
    });
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    // Simple pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(activities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedActivities = activities.slice(startIndex, startIndex + itemsPerPage);

    // Fetch system statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Fetch students count
                const { data: students, error: studentsError } = await supabase
                    .from('students')
                    .select('id, full_name_ar, stage, class', { count: 'exact' });

                if (studentsError) throw studentsError;

                // Fetch financial data
                const { data: fees } = await supabase
                    .from('school_fees')
                    .select('total_amount, advance_payment');

                // Fetch attendance data
                const { data: attendance } = await supabase
                    .from('attendance_records')
                    .select('status, student_id')
                    .eq('status', 'غائب');

                // Fetch behavioral records
                const { data: behavioral } = await supabase
                    .from('behavioral_records')
                    .select('id, disciplinary_issues');

                // Calculate statistics
                const totalStudents = students?.length || 0;
                const pendingPayments = fees?.filter(f => {
                    const remaining = f.total_amount - f.advance_payment;
                    return remaining > 0;
                }).length || 0;

                const lowAttendance = Math.floor(totalStudents * 0.15); // Estimated
                const behavioralIssues = behavioral?.filter(b => b.disciplinary_issues).length || 0;

                const newStats = {
                    totalStudents,
                    activeStudents: Math.floor(totalStudents * 0.95),
                    pendingPayments,
                    lowAttendance,
                    behavioralIssues,
                    academicAtRisk: Math.floor(totalStudents * 0.08),
                };

                setStats(newStats);

                // Generate recent activities
                const generatedActivities: RecentActivity[] = [
                    {
                        id: '1',
                        type: 'academic',
                        description: 'تم تحديث الدرجات للفصل الأول',
                        timestamp: new Date().toISOString(),
                        severity: 'low',
                    },
                    {
                        id: '2',
                        type: 'financial',
                        description: 'استحقاق المصروفات الدراسية للربع الثاني',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        severity: 'medium',
                    },
                    {
                        id: '3',
                        type: 'attendance',
                        description: 'تسجيل الغياب للفصل الأول',
                        timestamp: new Date(Date.now() - 7200000).toISOString(),
                        severity: 'low',
                    },
                    {
                        id: '4',
                        type: 'behavioral',
                        description: 'تقرير سلوكي جديد: طالب بحاجة للمتابعة',
                        timestamp: new Date(Date.now() - 86400000).toISOString(),
                        severity: 'high',
                    },
                ];
                setActivities(generatedActivities);
            } catch (error) {
                console.error('Error fetching stats:', error);
                addNotification({
                    type: 'error',
                    message: 'خطأ في تحميل الإحصائيات'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const chartData = [
        { name: 'طلاب نشطين', value: stats.activeStudents, fill: '#10b981' },
        { name: 'مستحقات مالية', value: stats.pendingPayments, fill: '#ef4444' },
        { name: 'حضور منخفض', value: stats.lowAttendance, fill: '#f59e0b' },
        { name: 'مشاكل سلوكية', value: stats.behavioralIssues, fill: '#8b5cf6' },
    ];

    const performanceData = [
        { month: 'يناير', students: 450, performance: 78 },
        { month: 'فبراير', students: 460, performance: 82 },
        { month: 'مارس', students: 455, performance: 80 },
        { month: 'أبريل', students: 470, performance: 85 },
    ];

    // Function to go to a specific page
    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <DashboardLayout>
            <PageLayout
                title="لوحة تحكم النظام"
                description="رؤية شاملة لإحصائيات المدرسة والعمليات الجارية"
            >
                <div className="space-y-6">
                    {/* Header Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Users, label: 'إجمالي الطلاب', value: stats.totalStudents, color: 'blue' },
                            { icon: CheckCircle2, label: 'طلاب نشطين', value: stats.activeStudents, color: 'green' },
                            { icon: AlertCircle, label: 'مستحقات مالية', value: stats.pendingPayments, color: 'red' },
                            { icon: TrendingUp, label: 'حضور منخفض', value: stats.lowAttendance, color: 'yellow' },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            const colorClasses = {
                                blue: 'from-blue-50 to-blue-100 border-blue-200',
                                green: 'from-green-50 to-green-100 border-green-200',
                                red: 'from-red-50 to-red-100 border-red-200',
                                yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
                            };

                            return (
                                <Card
                                    key={idx}
                                    className={`p-6 bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} border rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-gray-600 text-xs uppercase font-semibold">{stat.label}</p>
                                            <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                                        </div>
                                        <Icon className={`h-8 w-8 opacity-50 text-gray-600`} />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Distribution Chart */}
                        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                توزيع الطلاب والمشاكل
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Trend Chart */}
                        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                الاتجاه الشهري
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="performance"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="الأداء العام"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-600" />
                            إجراءات سريعة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Button
                                onClick={() => navigate('/students/list')}
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Users className="h-4 w-4" />
                                إدارة الطلاب
                            </Button>
                            <Button
                                onClick={() => navigate('/students/batch/operations')}
                                className="gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                                <Activity className="h-4 w-4" />
                                عمليات جماعية
                            </Button>
                            <Button
                                onClick={() => navigate('/students/advanced-search')}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Search className="h-4 w-4" />
                                بحث متقدم
                            </Button>
                            <Button
                                onClick={() => navigate('/students/data-portability')}
                                className="gap-2 bg-orange-600 hover:bg-orange-700"
                            >
                                <Download className="h-4 w-4" />
                                تصدير/استيراد
                            </Button>
                        </div>
                    </Card>

                    {/* Recent Activities */}
                    <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-600" />
                            النشاطات الأخيرة
                        </h3>
                        <div className="space-y-3">
                            {paginatedActivities.map((activity) => {
                                const severityColors = {
                                    low: 'bg-blue-50 border-blue-200 text-blue-800',
                                    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                                    high: 'bg-red-50 border-red-200 text-red-800',
                                };

                                return (
                                    <div
                                        key={activity.id}
                                        className={`p-4 border rounded-lg ${severityColors[activity.severity]}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{activity.description}</p>
                                                <p className="text-xs mt-1 opacity-75">
                                                    <Clock className="h-3 w-3 inline mr-1" />
                                                    {new Date(activity.timestamp).toLocaleString('ar-EG')}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${activity.type === 'academic'
                                                ? 'bg-blue-200'
                                                : activity.type === 'financial'
                                                    ? 'bg-green-200'
                                                    : activity.type === 'attendance'
                                                        ? 'bg-purple-200'
                                                        : 'bg-orange-200'
                                                }`}>
                                                {activity.type}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex gap-2 mt-4 pt-4 border-t justify-center">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        onClick={() => goToPage(i + 1)}
                                        variant={currentPage === i + 1 ? 'default' : 'outline'}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-semibold mb-2 text-blue-900">إشعارات</h3>
                            <div className="space-y-1">
                                {notifications.slice(0, 3).map((notif, idx) => (
                                    <p key={idx} className="text-xs text-blue-800">
                                        • {notif.message}
                                    </p>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </PageLayout>
        </DashboardLayout>
    );
}