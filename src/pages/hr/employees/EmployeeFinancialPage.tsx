import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowRight, Save, Loader2, Edit2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FinancialDataForm } from '@/components/hr/employees/FinancialDataForm';

interface FinancialData {
    base_salary: number;
    incentives: number;
    housing_allowance: number;
    transport_allowance: number;
    work_nature_allowance: number;
    insurance_percentage: number;
    insurance_number: string;
    bank_name: string;
    bank_account: string;
    iban: string;
    account_type: string;
}

const EmployeeFinancialPage = () => {
    const { employeeId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState<FinancialData>({
        base_salary: 0,
        incentives: 0,
        housing_allowance: 0,
        transport_allowance: 0,
        work_nature_allowance: 0,
        insurance_percentage: 14,
        insurance_number: '',
        bank_name: '',
        bank_account: '',
        iban: '',
        account_type: 'جاري'
    });



    const fetchEmployeeData = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', employeeId)
                .single();

            if (error) throw error;

            const details = data.details || {};
            const finDetails = details.financial_details || {};

            setFormData({
                base_salary: Number(data.base_salary) || 0,
                bank_name: data.bank_name || '',
                bank_account: data.bank_account || '',

                // Fetch from details
                incentives: Number(finDetails.incentives) || 0,
                housing_allowance: Number(finDetails.housing_allowance) || 0,
                transport_allowance: Number(finDetails.transport_allowance) || 0,
                work_nature_allowance: Number(finDetails.work_nature_allowance) || 0,
                insurance_percentage: Number(finDetails.insurance_percentage) || 14,
                insurance_number: finDetails.insurance_number || '',
                iban: finDetails.iban || '',
                account_type: finDetails.account_type || 'جاري'
            });
        } catch (error) {
            console.error('Error fetching employee financial data:', error);
            toast.error('فشل في تحميل البيانات المالية');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeData();
        }
    }, [employeeId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validate
            if (!formData.base_salary || formData.base_salary <= 0) {
                toast.error('الراتب الأساسي مطلوب');
                setSaving(false);
                return;
            }

            // Fetch current details to merge properly
            const { data: currentData } = await supabase.from('employees').select('details').eq('id', employeeId).single();
            const currentDetails = currentData?.details || {};

            // Prepare update
            const updatePayload = {
                base_salary: formData.base_salary,
                bank_name: formData.bank_name,
                bank_account: formData.bank_account,
                details: {
                    ...currentDetails,
                    financial_details: {
                        incentives: formData.incentives,
                        housing_allowance: formData.housing_allowance,
                        transport_allowance: formData.transport_allowance,
                        work_nature_allowance: formData.work_nature_allowance,
                        insurance_percentage: formData.insurance_percentage,
                        insurance_number: formData.insurance_number,
                        iban: formData.iban,
                        account_type: formData.account_type
                    }
                }
            };

            const { error } = await supabase
                .from('employees')
                .update(updatePayload)
                .eq('id', employeeId);

            if (error) throw error;

            toast.success('تم حفظ التعديلات المالية بنجاح');

            // Calculate Net for History Log
            const gross = Number(formData.base_salary || 0) + Number(formData.incentives || 0) +
                Number(formData.housing_allowance || 0) + Number(formData.transport_allowance || 0) +
                Number(formData.work_nature_allowance || 0);
            const insurance = gross * (Number(formData.insurance_percentage || 0) / 100);
            const net = gross - insurance;

            // Log to history
            await supabase.from('employment_history').insert([{
                employee_id: employeeId,
                event_type: 'salary_adjustment',
                description: 'تعديل الملف المالي للموظف',
                new_value: `الأساسي: ${formData.base_salary}, الصافي: ${net.toFixed(2)}`,
                created_at: new Date().toISOString()
            }]);

            setIsEditing(false);

        } catch (error: any) {
            console.error('Error saving:', error);
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    if (loading) return <DashboardLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/hr/employees/${employeeId}`}>
                            <Button variant="default" size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white"><ArrowRight className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">الملف المالي</h1>
                            <p className="text-gray-500">حسابات الموظف والبيانات البنكية</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 ml-2" /> تعديل البيانات
                        </Button>
                    )}
                </div>

                <FinancialDataForm
                    data={formData}
                    onChange={(newData) => setFormData(newData)}
                    isReadOnly={!isEditing}
                />

                {isEditing && (
                    <div className="flex gap-3 justify-end mt-6">
                        <Button
                            variant="outline"
                            className="border-slate-600 hover:bg-slate-100"
                            onClick={() => {
                                setIsEditing(false);
                                fetchEmployeeData(); // Reset
                            }}
                        >
                            <X className="h-4 w-4 ml-2" /> إلغاء
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                            حفظ
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EmployeeFinancialPage;

