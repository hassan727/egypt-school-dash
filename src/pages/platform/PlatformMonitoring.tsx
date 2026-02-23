import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SchoolStatus {
    id: string;
    school_name: string;
    school_code: string;
    is_active: boolean;
    status: string;
    plan_name: string;
    student_count: number;
    created_at: string;
}

export default function PlatformMonitoring() {
    const [schools, setSchools] = useState<SchoolStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbStats, setDbStats] = useState({ tables: 0, totalRows: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                const { data: schoolsData } = await supabase.from('schools').select('id, school_name, school_code, is_active, created_at');
                const { data: subs } = await supabase.from('subscriptions').select('school_id, status, plan:subscription_plans(plan_name_ar)');
                const { data: students } = await supabase.from('students').select('school_id');

                const studentCounts: Record<string, number> = {};
                students?.forEach((s: any) => { studentCounts[s.school_id] = (studentCounts[s.school_id] || 0) + 1; });

                const merged = (schoolsData || []).map((school: any) => {
                    const sub = subs?.find((s: any) => s.school_id === school.id);
                    return { ...school, status: sub?.status || 'unknown', plan_name: (sub?.plan as any)?.plan_name_ar || 'بدون خطة', student_count: studentCounts[school.id] || 0 };
                });
                setSchools(merged);

                const tables = ['students', 'employees', 'schools', 'grades', 'attendance_records', 'financial_transactions'];
                let totalRows = 0;
                for (const table of tables) {
                    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
                    totalRows += count || 0;
                }
                setDbStats({ tables: tables.length, totalRows });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const statusColors: Record<string, string> = {
        trial: 'bg-amber-100 text-amber-700', active: 'bg-emerald-100 text-emerald-700',
        expired: 'bg-red-100 text-red-700', suspended: 'bg-orange-100 text-orange-700', unknown: 'bg-gray-100 text-gray-700',
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">مراقبة النظام</h1>
                    <p className="text-muted-foreground mt-1">حالة المدارس والنظام في الوقت الفعلي</p>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-t-4 border-t-emerald-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-emerald-600" />
                                <span className="text-muted-foreground text-sm">حالة النظام</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-600 font-bold">يعمل بشكل طبيعي</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span className="text-muted-foreground text-sm">المدارس المتصلة</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground">{schools.length}</span>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-purple-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                <span className="text-muted-foreground text-sm">إجمالي السجلات</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground">{dbStats.totalRows.toLocaleString('ar-EG')}</span>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-amber-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="text-muted-foreground text-sm">تنبيهات</span>
                            </div>
                            <span className="text-2xl font-bold text-amber-600">
                                {schools.filter(s => s.status === 'expired' || s.status === 'suspended').length}
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* Schools Table */}
                <Card>
                    <div className="p-4 border-b border-border">
                        <h3 className="text-foreground font-semibold">حالة المدارس</h3>
                    </div>
                    {loading ? (
                        <CardContent className="p-8 text-center text-muted-foreground">جاري التحميل...</CardContent>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-right p-3 text-muted-foreground font-medium">المدرسة</th>
                                        <th className="text-right p-3 text-muted-foreground font-medium">الكود</th>
                                        <th className="text-right p-3 text-muted-foreground font-medium">الحالة</th>
                                        <th className="text-right p-3 text-muted-foreground font-medium">الخطة</th>
                                        <th className="text-right p-3 text-muted-foreground font-medium">الطلاب</th>
                                        <th className="text-right p-3 text-muted-foreground font-medium">تاريخ الإنشاء</th>
                                        <th className="text-right p-3 text-muted-foreground font-medium">الاتصال</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schools.map(school => (
                                        <tr key={school.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="p-3 text-foreground font-medium">{school.school_name}</td>
                                            <td className="p-3 text-muted-foreground">{school.school_code}</td>
                                            <td className="p-3">
                                                <Badge className={statusColors[school.status] || statusColors.unknown}>
                                                    {school.status === 'active' ? 'نشط' : school.status === 'trial' ? 'تجربة' : school.status === 'expired' ? 'منتهي' : school.status === 'suspended' ? 'موقوف' : school.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-primary text-xs">{school.plan_name}</td>
                                            <td className="p-3 text-foreground">{school.student_count}</td>
                                            <td className="p-3 text-muted-foreground text-xs">{new Date(school.created_at).toLocaleDateString('ar-EG')}</td>
                                            <td className="p-3">
                                                <div className={`h-2.5 w-2.5 rounded-full ${school.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
