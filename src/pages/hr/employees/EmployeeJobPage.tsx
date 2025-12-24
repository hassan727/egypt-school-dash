import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ArrowRight, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { JobDataForm } from '@/components/hr/employees/JobDataForm';

const EmployeeJobPage = () => {
    const { employeeId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        job_title: '',
        employee_type: '',
        contract_type: '',
        hire_date: '',
        status: ''
    });

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeData();
        }
    }, [employeeId]);

    const fetchEmployeeData = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', employeeId)
                .single();

            if (error) throw error;

            setFormData({
                job_title: data.job_title || '',
                employee_type: data.employee_type || 'full_time',
                contract_type: data.contract_type || 'permanent',
                hire_date: data.hire_date || '',
                status: data.status || 'active'
            });
        } catch (error) {
            console.error('Error fetching employee job data:', error);
            toast.error('فشل في تحميل البيانات الوظيفية');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Get old data for history logging
            const { data: oldData } = await supabase.from('employees').select('job_title, status').eq('id', employeeId).single();

            const { error } = await supabase
                .from('employees')
                .update({
                    job_title: formData.job_title,
                    employee_type: formData.employee_type,
                    contract_type: formData.contract_type,
                    hire_date: formData.hire_date,
                    status: formData.status
                })
                .eq('id', employeeId);

            if (error) throw error;

            toast.success('تم حفظ البيانات الوظيفية بنجاح');

            // Log history if key fields changed
            if (oldData && oldData.job_title !== formData.job_title) {
                await supabase.from('employment_history').insert([{
                    employee_id: employeeId,
                    event_type: 'promotion',
                    description: 'تغيير المسمى الوظيفي',
                    old_value: oldData.job_title,
                    new_value: formData.job_title,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }]);
            }
            if (oldData && oldData.status !== formData.status) {
                await supabase.from('employment_history').insert([{
                    employee_id: employeeId,
                    event_type: 'status_change',
                    description: 'تغيير حالة الموظف',
                    old_value: oldData.status,
                    new_value: formData.status,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }]);
            }

        } catch (error: any) {
            console.error('Error saving job data:', error);
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/hr/employees/${employeeId}`}>
                            <Button variant="default" size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white"><ArrowRight className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">الملف الوظيفي</h1>
                            <p className="text-gray-500">إدارة المسمى الوظيفي والعقود</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                        حفظ التغييرات
                    </Button>
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> تفاصيل الوظيفة</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <JobDataForm
                            data={formData}
                            onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                            isReadOnly={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeJobPage;
