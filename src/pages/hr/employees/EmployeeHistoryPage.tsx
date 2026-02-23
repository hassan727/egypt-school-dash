import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, ArrowRight, Circle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const EmployeeHistoryPage = () => {
    const { employeeId } = useParams();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            fetchHistory();
        }
    }, [employeeId]);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('employment_history')
                .select('*')
                .eq('employee_id', employeeId)
                .order('event_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
            // toast.error('فشل في تحميل التاريخ الوظيفي');
        } finally {
            setLoading(false);
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'hiring': return 'تعيين جديد';
            case 'promotion': return 'ترقية / تغيير مسمى';
            case 'salary_adjustment': return 'تعديل راتب';
            case 'department_transfer': return 'نقل قسم';
            case 'status_change': return 'تغيير حالة';
            case 'termination': return 'إنهاء خدمة';
            default: return type;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'hiring': return 'text-green-600 bg-green-50';
            case 'promotion': return 'text-purple-600 bg-purple-50';
            case 'salary_adjustment': return 'text-blue-600 bg-blue-50';
            case 'termination': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/hr/employees/${employeeId}`}>
                            <Button variant="default" size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white"><ArrowRight className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">التاريخ الوظيفي</h1>
                            <p className="text-gray-500">سجل التغييرات والأحداث الوظيفية</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> الجدول الزمني</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">لا يوجد سجل تاريخي لهذا الموظف</div>
                        ) : (
                            <div className="relative border-r border-gray-200 mr-4 space-y-8 py-4">
                                {history.map((record) => (
                                    <div key={record.id} className="relative pr-8">
                                        <div className={`absolute -right-3 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${getEventColor(record.event_type)}`}>
                                            <Circle className="h-3 w-3 fill-current" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg text-gray-800">{getEventLabel(record.event_type)}</span>
                                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {new Date(record.event_date).toLocaleDateString('ar-EG')}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">{record.description}</p>
                                            {(record.old_value || record.new_value) && (
                                                <div className="mt-2 p-3 bg-gray-50 rounded text-sm grid grid-cols-2 gap-4">
                                                    {record.old_value && (
                                                        <div>
                                                            <span className="text-gray-500 block text-xs">من:</span>
                                                            <span className="font-medium text-red-600">{record.old_value}</span>
                                                        </div>
                                                    )}
                                                    {record.new_value && (
                                                        <div>
                                                            <span className="text-gray-500 block text-xs">إلى:</span>
                                                            <span className="font-medium text-green-600">{record.new_value}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeHistoryPage;
