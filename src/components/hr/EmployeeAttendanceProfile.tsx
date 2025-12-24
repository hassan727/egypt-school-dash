/**
 * EmployeeAttendanceProfile - مكون عرض ملف حضور الموظف
 * Employee Attendance Profile Component - Shows detailed attendance and financial info
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User, Calendar, Clock, DollarSign, TrendingUp,
    CheckCircle, XCircle, AlertTriangle, Loader2, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Employee {
    id: string;
    employee_id: string;
    full_name: string;
    position: string;
    department: string;
    employee_type: string;
    base_salary?: number;
}

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    late_minutes: number;
    worked_hours: number;
}

interface EmployeeAttendanceProfileProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
}

const statusColors: Record<string, string> = {
    'حاضر': 'bg-green-500',
    'متأخر': 'bg-yellow-500',
    'غائب': 'bg-red-500',
    'إجازة': 'bg-blue-500',
    'إذن': 'bg-purple-500',
    'مأمورية': 'bg-indigo-500',
};

export function EmployeeAttendanceProfile({ open, onOpenChange, employee }: EmployeeAttendanceProfileProps) {
    const [loading, setLoading] = useState(false);
    const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
    const [shift, setShift] = useState<any>(null);
    const [currentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Fetch employee data when opened
    useEffect(() => {
        if (open && employee) {
            fetchEmployeeData();
        }
    }, [open, employee]);

    const fetchEmployeeData = async () => {
        if (!employee) return;

        setLoading(true);
        try {
            // Fetch monthly attendance
            const startDate = `${currentMonth}-01`;
            const endDate = new Date(parseInt(currentMonth.split('-')[0]), parseInt(currentMonth.split('-')[1]), 0)
                .toISOString().split('T')[0];

            const { data: attendance } = await supabase
                .from('employee_attendance')
                .select('*')
                .eq('employee_id', employee.id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date');

            setMonthlyRecords(attendance || []);

            // Fetch shift info
            const { data: shiftData } = await supabase
                .from('employee_shifts')
                .select('*')
                .eq('employee_id', employee.id)
                .eq('is_active', true)
                .single();

            setShift(shiftData);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics
    const stats = {
        presentDays: monthlyRecords.filter(r => r.status === 'حاضر').length,
        lateDays: monthlyRecords.filter(r => r.status === 'متأخر').length,
        absentDays: monthlyRecords.filter(r => r.status === 'غائب').length,
        leaveDays: monthlyRecords.filter(r => r.status === 'إجازة').length,
        totalLateMinutes: monthlyRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
        totalWorkedHours: monthlyRecords.reduce((sum, r) => sum + (r.worked_hours || 0), 0),
    };

    // Financial calculations (example rates)
    const dailyRate = (employee?.base_salary || 5000) / 26; // 26 working days
    const lateDeductionRate = 0.5; // per minute
    const financials = {
        baseSalary: employee?.base_salary || 5000,
        earnedAmount: (stats.presentDays + stats.lateDays) * dailyRate,
        lateDeductions: stats.totalLateMinutes * lateDeductionRate,
        absentDeductions: stats.absentDays * dailyRate,
        netAmount: 0,
    };
    financials.netAmount = financials.earnedAmount - financials.lateDeductions - financials.absentDeductions;

    // Generate calendar grid for the month
    const generateCalendar = () => {
        const year = parseInt(currentMonth.split('-')[0]);
        const month = parseInt(currentMonth.split('-')[1]) - 1;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty cells for days before the first day
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push({ day: 0, status: null });
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
            const record = monthlyRecords.find(r => r.date === dateStr);
            days.push({ day, status: record?.status || null, record });
        }

        return days;
    };

    if (!employee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        ملف حضور الموظف
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Employee Header */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {employee.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold">{employee.full_name}</h3>
                                <p className="text-gray-500">{employee.position}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="outline">{employee.employee_id}</Badge>
                                    <Badge variant="secondary">{employee.department}</Badge>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="attendance">
                            <TabsList className="grid grid-cols-3 w-full">
                                <TabsTrigger value="attendance" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    الحضور
                                </TabsTrigger>
                                <TabsTrigger value="statistics" className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    الإحصائيات
                                </TabsTrigger>
                                <TabsTrigger value="financial" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    المالي
                                </TabsTrigger>
                            </TabsList>

                            {/* Attendance Calendar */}
                            <TabsContent value="attendance" className="mt-4">
                                <Card className="p-4">
                                    <h4 className="font-medium mb-4 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        تقويم الحضور - {new Date(currentMonth + '-01').toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                                    </h4>

                                    {/* Week days header */}
                                    <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-medium text-gray-500">
                                        {['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map(day => (
                                            <div key={day} className="py-1">{day}</div>
                                        ))}
                                    </div>

                                    {/* Calendar grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {generateCalendar().map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                          ${item.day === 0 ? '' :
                                                        item.status ? `${statusColors[item.status]} text-white` : 'bg-gray-100 text-gray-400'}`}
                                                title={item.status || ''}
                                            >
                                                {item.day > 0 && item.day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t text-sm">
                                        {Object.entries(statusColors).map(([status, color]) => (
                                            <div key={status} className="flex items-center gap-1">
                                                <div className={`w-3 h-3 rounded ${color}`} />
                                                <span>{status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* Statistics */}
                            <TabsContent value="statistics" className="mt-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Card className="p-4 bg-green-50">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                            <div>
                                                <p className="text-sm text-green-600">أيام الحضور</p>
                                                <p className="text-2xl font-bold text-green-900">{stats.presentDays}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-yellow-50">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-8 w-8 text-yellow-600" />
                                            <div>
                                                <p className="text-sm text-yellow-600">أيام التأخير</p>
                                                <p className="text-2xl font-bold text-yellow-900">{stats.lateDays}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-red-50">
                                        <div className="flex items-center gap-3">
                                            <XCircle className="h-8 w-8 text-red-600" />
                                            <div>
                                                <p className="text-sm text-red-600">أيام الغياب</p>
                                                <p className="text-2xl font-bold text-red-900">{stats.absentDays}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-blue-50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-blue-600">أيام الإجازة</p>
                                                <p className="text-2xl font-bold text-blue-900">{stats.leaveDays}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-orange-50">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-8 w-8 text-orange-600" />
                                            <div>
                                                <p className="text-sm text-orange-600">إجمالي التأخير</p>
                                                <p className="text-2xl font-bold text-orange-900">{stats.totalLateMinutes} د</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-indigo-50">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-8 w-8 text-indigo-600" />
                                            <div>
                                                <p className="text-sm text-indigo-600">ساعات العمل</p>
                                                <p className="text-2xl font-bold text-indigo-900">{stats.totalWorkedHours.toFixed(1)} س</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Financial */}
                            <TabsContent value="financial" className="mt-4">
                                <Card className="p-4">
                                    <h4 className="font-medium mb-4 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        الحساب المالي للشهر الحالي
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">الراتب الأساسي</span>
                                            <span className="font-bold">{financials.baseSalary.toLocaleString()} ج.م</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">المستحق عن أيام العمل ({stats.presentDays + stats.lateDays} يوم)</span>
                                            <span className="font-bold text-green-600">+{financials.earnedAmount.toLocaleString()} ج.م</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">خصم التأخير ({stats.totalLateMinutes} دقيقة)</span>
                                            <span className="font-bold text-red-600">-{financials.lateDeductions.toLocaleString()} ج.م</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">خصم الغياب ({stats.absentDays} يوم)</span>
                                            <span className="font-bold text-red-600">-{financials.absentDeductions.toLocaleString()} ج.م</span>
                                        </div>
                                        <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-4">
                                            <span className="text-lg font-medium">صافي المستحق</span>
                                            <span className="text-2xl font-bold text-blue-600">{financials.netAmount.toLocaleString()} ج.م</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-4">
                                        * الحسابات تقريبية وتعتمد على معدلات الخصم الافتراضية
                                    </p>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default EmployeeAttendanceProfile;
