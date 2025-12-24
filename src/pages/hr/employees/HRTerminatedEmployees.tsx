import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import {
    UserX,
    Search,
    Download,
    Eye,
    Loader2,
    Filter,
    FileText,
    RefreshCw,
    UserCheck,
    MoreHorizontal,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { HREmployee } from '@/types/hr';

const HRTerminatedEmployees = () => {
    const [employees, setEmployees] = useState<HREmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [reasonFilter, setReasonFilter] = useState<string>('all');

    // Selection State
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    // Dialog States
    const [isReactivateOpen, setIsReactivateOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null);
    const [reactivationNotes, setReactivationNotes] = useState('');

    useEffect(() => {
        fetchTerminatedEmployees();
    }, []);

    const fetchTerminatedEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .or('status.eq.منتهي الخدمة,is_active.eq.false')
                .order('termination_date', { ascending: false });

            if (error) throw error;

            const mappedEmployees: HREmployee[] = (data || []).map((row: any) => ({
                id: row.id,
                employee_code: row.employee_id,
                full_name_ar: row.full_name,
                full_name_en: row.details?.full_name_en,
                national_id: row.national_id,
                employee_type: row.employee_type,
                job_title: row.position,
                department_id: row.department,
                phone: row.phone,
                email: row.email,
                address: row.address,
                hire_date: row.hire_date,
                contract_type: row.contract_type,
                base_salary: row.base_salary,
                status: 'منتهي الخدمة',
                termination_date: row.termination_date,
                termination_reason: row.termination_reason,
                termination_status: row.termination_status || 'مكتمل',
                created_at: row.created_at,
                updated_at: row.updated_at,
                // Missing fields required by HREmployee interface
                gender: row.gender || 'ذكر',
                marital_status: row.marital_status || 'أعزب',
                nationality: row.nationality || 'مصري',
                birth_date: row.birth_date || '',
            }));

            const terminatedOnly = mappedEmployees.filter(e =>
                e.status === 'منتهي الخدمة' || (e.termination_date && e.termination_date.length > 0)
            );

            setEmployees(terminatedOnly);
        } catch (error) {
            console.error('Error fetching terminated employees:', error);
            toast.error('فشل في تحميل أرشيف الموظفين');
        } finally {
            setLoading(false);
        }
    };

    const openReactivateDialog = (employee: HREmployee) => {
        setSelectedEmployee(employee);
        setReactivationNotes('');
        setIsReactivateOpen(true);
    };

    const handleReactivate = async () => {
        if (!selectedEmployee) return;

        try {
            const { error } = await supabase
                .from('employees')
                .update({
                    status: 'نشط',
                    is_active: true,
                    termination_date: null,
                    termination_reason: null,
                    termination_status: null,
                    notes: `تم إعادة التعيين في ${new Date().toLocaleDateString('ar-EG')}. ملاحظات: ${reactivationNotes}`
                })
                .eq('id', selectedEmployee.id);

            if (error) throw error;

            toast.success('تم إعادة تفعيل الموظف بنجاح');
            setIsReactivateOpen(false);
            fetchTerminatedEmployees();
        } catch (error) {
            toast.error('حدث خطأ أثناء إعادة التفعيل');
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.full_name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.national_id?.includes(searchQuery);

        const matchesReason = reasonFilter === 'all' || emp.termination_reason === reasonFilter;

        return matchesSearch && matchesReason;
    });

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedEmployeeIds.size === filteredEmployees.length) {
            setSelectedEmployeeIds(new Set());
        } else {
            setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
        }
    };

    const toggleSelectEmployee = (id: string) => {
        const newSet = new Set(selectedEmployeeIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedEmployeeIds(newSet);
    };

    const handleBulkReactivate = async () => {
        // Placeholder for bulk action
        toast.info('سيتم تفعيل هذه الخاصية قريباً');
    };

    const exportToExcel = () => {
        const data = filteredEmployees.map(e => ({
            'كود الموظف': e.employee_code,
            'الاسم': e.full_name_ar,
            'تاريخ الإنهاء': e.termination_date || '-',
            'سبب الإنهاء': e.termination_reason || '-',
            'الحالة النهائية': e.termination_status || '-',
            'المسمى الوظيفي': e.job_title
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'أرشيف الموظفين');
        XLSX.writeFile(wb, 'الموظفين_المنتهية_خدمتهم.xlsx');
    };

    return (
        <DashboardLayout>
            <PageLayout
                title="أرشيف الموظفين المنتهية خدمتهم"
                description={`سجل تاريخي للموظفين السابقين (عدد ${filteredEmployees.length} موظف)`}
            >
                <div className="space-y-6 relative pb-20">

                    {/* Filters Bar */}
                    <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full md:w-auto relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="بحث بالاسم أو الكود أو الرقم القومي..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Link to="/hr/employees">
                                    <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                        <ArrowRight className="h-4 w-4" />
                                        العودة للقائمة
                                    </Button>
                                </Link>
                                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <Filter className="h-4 w-4 ml-2" />
                                        <SelectValue placeholder="سبب الإنهاء" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="استقالة">استقالة</SelectItem>
                                        <SelectItem value="فصل">فصل</SelectItem>
                                        <SelectItem value="انتهاء عقد">انتهاء عقد</SelectItem>
                                        <SelectItem value="تقاعد">تقاعد</SelectItem>
                                        <SelectItem value="وفاة">وفاة</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={exportToExcel} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    تصدير
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Main Table */}
                    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                                <span className="mr-3 text-gray-500">جاري تحميل الأرشيف...</span>
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <UserX className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-gray-500">لا يوجد بيانات للعرض</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300">
                                    <thead className="bg-red-50">
                                        <tr>
                                            {/* Checkbox Header */}
                                            <th className="px-4 py-3 text-right border border-red-100 w-12">
                                                <Checkbox
                                                    checked={selectedEmployeeIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-red-400 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
                                                />
                                            </th>
                                            {/* Standardized Colored Headers */}
                                            <th className="px-4 py-3 text-right text-sm font-bold text-red-900 border border-red-100">الكود</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-red-900 border border-red-100">الموظف</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-red-900 border border-red-100">الوظيفة السابقة</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-red-900 border border-red-100">تاريخ الإنهاء</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-red-900 border border-red-100">سبب الإنهاء</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-red-900 border border-red-100">الحالة</th>
                                            <th className="px-4 py-3 text-center text-sm font-bold text-red-900 border border-red-100">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-red-50/50 transition-colors">
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <Checkbox
                                                        checked={selectedEmployeeIds.has(emp.id)}
                                                        onCheckedChange={() => toggleSelectEmployee(emp.id)}
                                                        className="border-gray-300 data-[state=checked]:bg-red-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200 font-mono text-sm">{emp.employee_code}</td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                                                            {emp.full_name_ar?.charAt(0) || '-'}
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{emp.full_name_ar}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200 text-sm">{emp.job_title || '-'}</td>
                                                <td className="px-4 py-3 border border-gray-200 text-sm font-medium">
                                                    {emp.termination_date ? new Date(emp.termination_date).toLocaleDateString('ar-EG') : '-'}
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <Badge variant="outline" className={
                                                        emp.termination_reason === 'فصل' ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-gray-50 border-gray-200'
                                                    }>
                                                        {emp.termination_reason || 'غير محدد'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <Badge variant="outline" className={
                                                        emp.termination_status === 'مكتمل' ? 'text-green-600 border-green-200 bg-green-50' : 'text-amber-600 border-amber-200 bg-amber-50'
                                                    }>
                                                        {emp.termination_status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/hr/employees/${emp.id}`} className="flex items-center gap-2 cursor-pointer">
                                                                    <Eye className="h-4 w-4" />
                                                                    عرض الملف
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => openReactivateDialog(emp)}
                                                                className="flex items-center gap-2 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                                إعادة تفعيل
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Floating Selection Bar */}
                    {selectedEmployeeIds.size > 0 && (
                        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{selectedEmployeeIds.size}</span>
                                <span className="text-sm font-medium">موظف محدد</span>
                            </div>
                            <div className="h-4 w-px bg-white/20 mx-2"></div>

                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 bg-red-600 hover:bg-red-700 text-white border-none"
                                onClick={handleBulkReactivate}
                                disabled={isProcessing}
                            >
                                <RefreshCw className="w-4 h-4 ml-2" />
                                خيارات جماعية
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs hover:bg-white/20 text-white hover:text-white"
                                onClick={() => setSelectedEmployeeIds(new Set())}
                            >
                                إلغاء
                            </Button>
                        </div>
                    )}

                    {/* Reactivate Dialog (Existing) */}
                    <Dialog open={isReactivateOpen} onOpenChange={setIsReactivateOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-green-700">
                                    <UserCheck className="h-5 w-5" />
                                    إعادة تفعيل الموظف
                                </DialogTitle>
                                <DialogDescription>
                                    هل أنت متأكد من رغبتك في إعادة تفعيل الموظف <b>{selectedEmployee?.full_name_ar}</b>؟
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">سبب إعادة التفعيل / ملاحظات</label>
                                    <Textarea
                                        placeholder="أذكر سبب إعادة التعيين..."
                                        value={reactivationNotes}
                                        onChange={(e) => setReactivationNotes(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsReactivateOpen(false)}>إلغاء</Button>
                                <Button onClick={handleReactivate} className="bg-green-600 hover:bg-green-700">
                                    تأكيد وإعادة التفعيل
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </PageLayout>
        </DashboardLayout>
    );
};

export default HRTerminatedEmployees;
