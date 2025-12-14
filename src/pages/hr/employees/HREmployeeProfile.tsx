/**
 * صفحة ملف الموظف - نظام الموارد البشرية
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, Mail, MapPin, Briefcase, Calendar, FileText, Wallet, History, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const HREmployeeProfile = () => {
    const { employeeId } = useParams();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) fetchEmployee();
    }, [employeeId]);

    const fetchEmployee = async () => {
        try {
            const { data, error } = await supabase.from('employees').select('*').eq('id', employeeId).single();
            if (error) throw error;
            setEmployee(data);
        } catch (error) {
            toast.error('فشل في تحميل بيانات الموظف');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
    if (!employee) return <DashboardLayout><div className="text-center py-20 text-gray-500">الموظف غير موجود</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {employee.full_name_ar?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{employee.full_name_ar}</h1>
                            <p className="text-gray-500">{employee.job_title} • {employee.employee_code}</p>
                        </div>
                    </div>
                    <Link to="/hr/employees"><Button variant="outline"><ArrowRight className="h-4 w-4 ml-2" />العودة</Button></Link>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Link to={`/hr/employees/${employeeId}/documents`}><Button variant="outline" size="sm"><FileText className="h-4 w-4 ml-2" />المستندات</Button></Link>
                    <Link to={`/hr/employees/${employeeId}/financial`}><Button variant="outline" size="sm"><Wallet className="h-4 w-4 ml-2" />الملف المالي</Button></Link>
                    <Link to={`/hr/employees/${employeeId}/job`}><Button variant="outline" size="sm"><Briefcase className="h-4 w-4 ml-2" />الملف الوظيفي</Button></Link>
                    <Link to={`/hr/employees/${employeeId}/history`}><Button variant="outline" size="sm"><History className="h-4 w-4 ml-2" />التاريخ الوظيفي</Button></Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />البيانات الشخصية</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-500">الرقم القومي:</span><span>{employee.national_id}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">تاريخ الميلاد:</span><span>{employee.birth_date}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">الجنس:</span><span>{employee.gender}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">الحالة الاجتماعية:</span><span>{employee.marital_status}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">الجنسية:</span><span>{employee.nationality}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-green-600" />بيانات الاتصال</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-500">الهاتف:</span><span>{employee.phone}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">البريد:</span><span>{employee.email || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">العنوان:</span><span>{employee.address || '-'}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-600" />البيانات الوظيفية</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-500">نوع الموظف:</span><Badge>{employee.employee_type}</Badge></div>
                            <div className="flex justify-between"><span className="text-gray-500">المسمى الوظيفي:</span><span>{employee.job_title}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">تاريخ التعيين:</span><span>{employee.hire_date}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">نوع العقد:</span><span>{employee.contract_type}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">الحالة:</span><Badge variant="outline">{employee.status}</Badge></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-amber-600" />البيانات المالية</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-500">الراتب الأساسي:</span><span className="font-bold">{employee.base_salary?.toLocaleString()} ج.م</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">البنك:</span><span>{employee.bank_name || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">رقم الحساب:</span><span>{employee.bank_account || '-'}</span></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HREmployeeProfile;
