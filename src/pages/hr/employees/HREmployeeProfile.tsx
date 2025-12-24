import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Mail, MapPin, Briefcase, Calendar, FileText, Wallet, History, ArrowRight, Loader2, Clock, Edit2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PersonalDataForm } from '@/components/hr/employees/PersonalDataForm';

const HREmployeeProfile = () => {
    const { employeeId } = useParams();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceStats, setAttendanceStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        lateMinutes: 0,
        overtimeMinutes: 0
    });

    // Basic Info Edit State
    const [openBasicInfoDialog, setOpenBasicInfoDialog] = useState(false);
    const [savingBasicInfo, setSavingBasicInfo] = useState(false);
    const [basicInfoForm, setBasicInfoForm] = useState({
        full_name_ar: '',
        national_id: '',
        birth_date: '',
        gender: '',
        marital_status: '',
        nationality: '',
        religion: ''
    });

    useEffect(() => {
        if (employeeId) {
            fetchEmployee();
            fetchAttendanceStats();
        }
    }, [employeeId]);

    const fetchEmployee = async () => {
        try {
            const { data, error } = await supabase.from('employees').select('*').eq('id', employeeId).single();
            if (error) throw error;
            setEmployee(data);

            // Initialize form data
            setBasicInfoForm({
                full_name_ar: data.full_name_ar || '',
                national_id: data.national_id || '',
                birth_date: data.birth_date || '',
                gender: data.gender || '',
                marital_status: data.marital_status || '',
                nationality: data.nationality || '',
                religion: data.religion || ''
            });
        } catch (error) {
            toast.error('فشل في تحميل بيانات الموظف');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceStats = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Format dates as YYYY-MM-DD manually to avoid timezone issues
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);

        const formatDate = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const startOfMonth = formatDate(start);
        const endOfMonth = formatDate(end);

        const { data } = await supabase
            .from('employee_attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);

        if (data) {
            const stats = {
                present: data.filter(r => r.status === 'حاضر').length,
                absent: data.filter(r => r.status === 'غائب').length,
                late: data.filter(r => r.status === 'متأخر').length,
                lateMinutes: data.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
                overtimeMinutes: data.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0)
            };
            setAttendanceStats(stats);
        }
    };

    const handleSaveBasicInfo = async () => {
        if (!basicInfoForm.national_id || !basicInfoForm.birth_date || !basicInfoForm.gender || !basicInfoForm.full_name_ar) {
            toast.error('يرجى ملء كافة البيانات الأساسية');
            return;
        }

        setSavingBasicInfo(true);
        try {
            // Get old data for history
            const { data: oldData } = await supabase.from('employees').select('national_id, birth_date').eq('id', employeeId).single();

            const { error } = await supabase
                .from('employees')
                .update({
                    full_name_ar: basicInfoForm.full_name_ar,
                    national_id: basicInfoForm.national_id,
                    birth_date: basicInfoForm.birth_date,
                    gender: basicInfoForm.gender,
                    marital_status: basicInfoForm.marital_status,
                    nationality: basicInfoForm.nationality,
                    religion: basicInfoForm.religion
                })
                .eq('id', employeeId);

            if (error) throw error;

            toast.success('تم تحديث البيانات الشخصية بنجاح');

            // Log history
            if (oldData && oldData.national_id !== basicInfoForm.national_id) {
                await supabase.from('employment_history').insert([{
                    employee_id: employeeId,
                    event_type: 'personal_data_update',
                    description: 'تحديث الرقم القومي',
                    old_value: oldData.national_id,
                    new_value: basicInfoForm.national_id,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }]);
            } else {
                // Generic log if other fields changed
                await supabase.from('employment_history').insert([{
                    employee_id: employeeId,
                    event_type: 'personal_data_update',
                    description: 'تحديث البيانات الشخصية',
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }]);
            }

            setOpenBasicInfoDialog(false);
            fetchEmployee(); // Refresh data

        } catch (error) {
            console.error('Error updating basic info:', error);
            toast.error('حدث خطأ أثناء حفظ البيانات');
        } finally {
            setSavingBasicInfo(false);
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
                    <Link to="/hr/employees"><Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white"><ArrowRight className="h-4 w-4 ml-2" />العودة</Button></Link>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Link to={`/hr/employees/${employeeId}/documents`}><Button variant="outline" size="sm"><FileText className="h-4 w-4 ml-2" />المستندات</Button></Link>
                    <Link to={`/hr/employees/${employeeId}/financial`}><Button variant="outline" size="sm"><Wallet className="h-4 w-4 ml-2" />الملف المالي</Button></Link>
                    <Link to={`/hr/employees/${employeeId}/job`}><Button variant="outline" size="sm"><Briefcase className="h-4 w-4 ml-2" />الملف الوظيفي</Button></Link>
                    <Link to={`/hr/employees/${employeeId}/history`}><Button variant="outline" size="sm"><History className="h-4 w-4 ml-2" />التاريخ الوظيفي</Button></Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info Card - Interactive */}
                    <Card
                        className="group cursor-pointer transition-all hover:bg-blue-50/50 hover:shadow-md border-blue-100/50 relative overflow-hidden"
                        onClick={() => setOpenBasicInfoDialog(true)}
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/0 group-hover:bg-blue-500 transition-all" />
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    البيانات الشخصية
                                </div>
                                <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between border-b border-dashed pb-2 border-slate-100"><span className="text-gray-500">الرقم القومي:</span><span className="font-medium text-slate-700">{employee.national_id}</span></div>
                            <div className="flex justify-between border-b border-dashed pb-2 border-slate-100"><span className="text-gray-500">تاريخ الميلاد:</span><span className="font-medium text-slate-700">{employee.birth_date}</span></div>
                            <div className="flex justify-between border-b border-dashed pb-2 border-slate-100"><span className="text-gray-500">الجنس:</span><span className="font-medium text-slate-700">{employee.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
                            <div className="flex justify-between border-b border-dashed pb-2 border-slate-100"><span className="text-gray-500">الحالة الاجتماعية:</span><span className="font-medium text-slate-700">{employee.marital_status}</span></div>
                            <div className="flex justify-between border-b border-dashed pb-2 border-slate-100"><span className="text-gray-500">الجنسية:</span><span className="font-medium text-slate-700">{employee.nationality}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">الديانة:</span><span className="font-medium text-slate-700">{employee.religion}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-orange-600" />ملخص الحضور (هذا الشهر)</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-2 bg-green-50 rounded">
                                    <p className="text-lg font-bold text-green-700">{attendanceStats.present}</p>
                                    <p className="text-xs text-gray-500">أيام حضور</p>
                                </div>
                                <div className="p-2 bg-red-50 rounded">
                                    <p className="text-lg font-bold text-red-700">{attendanceStats.absent}</p>
                                    <p className="text-xs text-gray-500">أيام غياب</p>
                                </div>
                                <div className="p-2 bg-yellow-50 rounded">
                                    <p className="text-lg font-bold text-yellow-700">{attendanceStats.late} <span className="text-xs">({attendanceStats.lateMinutes}د)</span></p>
                                    <p className="text-xs text-gray-500">تأخير</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded">
                                    <p className="text-lg font-bold text-blue-700">{attendanceStats.overtimeMinutes}د</p>
                                    <p className="text-xs text-gray-500">إضافي</p>
                                </div>
                            </div>
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

                {/* Basic Info Edit Dialog */}
                <Dialog open={openBasicInfoDialog} onOpenChange={setOpenBasicInfoDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>تعديل البيانات الشخصية</DialogTitle>
                        </DialogHeader>
                        <PersonalDataForm
                            data={basicInfoForm}
                            onChange={(field, value) => setBasicInfoForm(prev => ({ ...prev, [field]: value }))}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpenBasicInfoDialog(false)}>إلغاء</Button>
                            <Button onClick={handleSaveBasicInfo} disabled={savingBasicInfo}>
                                {savingBasicInfo ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                                حفظ التغييرات
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default HREmployeeProfile;
