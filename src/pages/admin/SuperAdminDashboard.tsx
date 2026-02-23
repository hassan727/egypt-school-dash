import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [schools, setSchools] = useState<any[]>([]);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchoolsAndStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('schools')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data) {
                    setSchools(data);
                }

                // Fetch total system users count
                const { count } = await supabase
                    .from('system_users')
                    .select('*', { count: 'exact', head: true });

                setTotalUsers(count || 0);
            } catch (error) {
                console.error('Error fetching schools:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchoolsAndStats();
    }, []);

    const totalSchools = schools.length;
    const trialSchools = schools.filter(s => s.is_trial === true || s.settings?.is_trial === true).length;
    const activeSchools = totalSchools - trialSchools;

    return (
        <div className="min-h-screen bg-slate-100 p-8" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">لوحة تحكم المطور (Super Admin)</h1>
                    <p className="text-muted-foreground mt-2">نظرة شاملة على جميع المدارس والاشتراكات في النظام</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/login')}>تسجيل الخروج</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المدارس</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSchools}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مدارس نشطة</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{activeSchools}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">فترات تجريبية</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{trialSchools}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مستخدمي النظام</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>قائمة المدارس المسجلة</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>جاري التحميل...</p>
                    ) : (
                        <div className="w-full overflow-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="border-b bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">كود المدرسة</th>
                                        <th className="px-4 py-3 font-medium">الاسم</th>
                                        <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
                                        <th className="px-4 py-3 font-medium">حالة الاشتراك</th>
                                        <th className="px-4 py-3 font-medium">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {schools.map(school => (
                                        <tr key={school.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-mono text-xs">{school.school_code}</td>
                                            <td className="px-4 py-3 font-medium">{school.school_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {new Date(school.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {school.is_trial || school.settings?.is_trial ? (
                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                                                        فترة تجريبية
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                        نشط
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button size="sm" variant="outline">إدارة</Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {schools.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">لا توجد مدارس مسجلة في النظام بعد.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
