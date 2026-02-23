import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function CompleteProfilePage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        guardian_full_name: '',
        guardian_phone: '',
        guardian_national_id: '',
        mother_full_name: '',
        mother_phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    useEffect(() => {
        const fetchStudent = async () => {
            if (!studentId) return;

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (error) {
                toast.error('فشل تحميل بيانات الطالب');
                navigate(-1);
                return;
            }

            // Pre-fill existing data if any
            setFormData({
                guardian_full_name: data.guardian_full_name || '',
                guardian_phone: data.guardian_phone || '',
                guardian_national_id: data.guardian_national_id || '',
                mother_full_name: data.mother_full_name || '',
                mother_phone: data.mother_phone || '',
                address: data.guardian_address || '',
                emergency_contact_name: '', // Usually in separate table, simplified here
                emergency_contact_phone: ''
            });

            setLoading(false);
        };

        fetchStudent();
    }, [studentId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Update Student Record
            const { error: studentError } = await supabase
                .from('students')
                .update({
                    guardian_full_name: formData.guardian_full_name,
                    guardian_phone: formData.guardian_phone,
                    guardian_national_id: formData.guardian_national_id,
                    mother_full_name: formData.mother_full_name,
                    mother_phone: formData.mother_phone,
                    guardian_address: formData.address,
                    registration_status: 'active', // Activate student
                    file_status: 'نشط'
                })
                .eq('student_id', studentId);

            if (studentError) throw studentError;

            // 2. Add Emergency Contact (Simplified)
            if (formData.emergency_contact_name) {
                await supabase.from('emergency_contacts').insert({
                    student_id: studentId,
                    contact_name: formData.emergency_contact_name,
                    phone: formData.emergency_contact_phone,
                    relationship: 'قريب'
                });
            }

            toast.success('تم استكمال البيانات وتفعيل ملف الطالب بنجاح');
            navigate(`/students/${studentId}`);
        } catch (error: any) {
            console.error(error);
            toast.error('فشل حفظ البيانات: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <DashboardLayout>
            <PageLayout title="إكمال ملف الطالب" description="يرجى استكمال البيانات الناقصة لتفعيل ملف الطالب">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-blue-800">بيانات ولي الأمر</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم ولي الأمر (رباعي) *</Label>
                                <Input required name="guardian_full_name" value={formData.guardian_full_name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم الهاتف *</Label>
                                <Input required name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>الرقم القومي</Label>
                                <Input name="guardian_national_id" value={formData.guardian_national_id} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>العنوان</Label>
                                <Input name="address" value={formData.address} onChange={handleChange} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-pink-800">بيانات الأم</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم الأم (رباعي)</Label>
                                <Input name="mother_full_name" value={formData.mother_full_name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم هاتف الأم</Label>
                                <Input name="mother_phone" value={formData.mother_phone} onChange={handleChange} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-red-800">الطوارئ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم شخص للطوارئ</Label>
                                <Input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم الطوارئ</Label>
                                <Input name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>إلغاء</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 gap-2" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            حفظ وتفعيل الملف
                        </Button>
                    </div>

                </form>
            </PageLayout>
        </DashboardLayout>
    );
}
