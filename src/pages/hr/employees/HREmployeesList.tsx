/**
 * صفحة قائمة الموظفين - نظام الموارد البشرية
 * HR Employees List Page
 */

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    Plus,
    Search,
    Filter,
    Download,
    Printer,
    Phone,
    Mail,
    Building2,
    Briefcase,
    Loader2,
    Eye,
    MoreHorizontal,
    FileText,
    Calendar,
    UserCheck,
    UserX,
    Trash2,
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
import { HREmployee, EmployeeType, EmployeeStatus } from '@/types/hr';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useSystemSchoolId } from '@/context/SystemContext';

const HREmployeesList = () => {
    const schoolId = useSystemSchoolId();
    const [employees, setEmployees] = useState<HREmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Selection State
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (schoolId) fetchEmployees();
    }, [schoolId]);

    const fetchEmployees = async () => {
        try {
            if (!schoolId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map DB columns to HREmployee interface
            const mappedEmployees: HREmployee[] = (data || []).map((row: any) => {
                // Determine Status Logic
                let derivedStatus = row.status; // Default to existing status column

                // Explicitly check for termination
                if (row.termination_date || row.status === 'منتهي الخدمة') {
                    derivedStatus = 'منتهي الخدمة';
                } else if (!derivedStatus) {
                    // Fallback logic if status is null
                    derivedStatus = row.details?.job_details?.status_text || (row.is_active ? 'نشط' : 'متوقف');
                }

                return {
                    id: row.id,
                    employee_code: row.employee_id,
                    full_name_ar: row.full_name,
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
                    bank_account: row.bank_account,
                    bank_name: row.bank_name,
                    status: derivedStatus,
                    gender: row.gender || 'ذكر',
                    marital_status: row.marital_status || 'أعزب',
                    nationality: row.nationality || 'مصري',
                    birth_date: row.birth_date || '',
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    full_name_en: row.details?.full_name_en,
                    photo_url: row.details?.documents?.personal_photos?.url
                };
            }) as HREmployee[];

            setEmployees(mappedEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('فشل في تحميل بيانات الموظفين');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter((emp) => {
        // Exclude terminated employees from this list - they have their own archive page
        if (emp.status === 'منتهي الخدمة') return false;

        const matchesSearch =
            emp.full_name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.national_id?.includes(searchQuery) ||
            emp.phone?.includes(searchQuery);

        const matchesType = typeFilter === 'all' || emp.employee_type === typeFilter;
        const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    const getStatusBadge = (status: EmployeeStatus) => {
        const styles: Record<EmployeeStatus, string> = {
            'نشط': 'bg-green-100 text-green-800 border-green-300',
            'متوقف': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'إجازة': 'bg-blue-100 text-blue-800 border-blue-300',
            'منتهي الخدمة': 'bg-red-100 text-red-800 border-red-300',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getTypeBadge = (type: EmployeeType) => {
        const styles: Record<EmployeeType, string> = {
            'معلم': 'bg-purple-100 text-purple-800',
            'إداري': 'bg-blue-100 text-blue-800',
            'أمن': 'bg-orange-100 text-orange-800',
            'سائق': 'bg-cyan-100 text-cyan-800',
            'عامل': 'bg-gray-100 text-gray-800',
            'مشرف': 'bg-indigo-100 text-indigo-800',
            'منسق': 'bg-pink-100 text-pink-800',
        };
        return styles[type] || 'bg-gray-100 text-gray-800';
    };

    const exportToExcel = () => {
        const exportData = filteredEmployees.map((emp) => ({
            'كود الموظف': emp.employee_code,
            'الاسم': emp.full_name_ar,
            'الرقم القومي': emp.national_id,
            'نوع الموظف': emp.employee_type,
            'المسمى الوظيفي': emp.job_title,
            'الهاتف': emp.phone,
            'البريد': emp.email,
            'تاريخ التعيين': emp.hire_date,
            'الحالة': emp.status,
            'الراتب الأساسي': emp.base_salary,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الموظفين');
        XLSX.writeFile(wb, `سجل_الموظفين_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
        toast.success('تم تصدير البيانات بنجاح');
    };

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

    const handleBulkAction = () => {
        toast.info('سيتم تفعيل الإجراءات الجماعية قريباً');
    };

    // إحصائيات سريعة
    const stats = {
        total: employees.length,
        active: employees.filter((e) => e.status === 'نشط').length,
        onLeave: employees.filter((e) => e.status === 'إجازة').length,
        terminated: employees.filter((e) => e.status === 'منتهي الخدمة').length,
    };

    return (
        <DashboardLayout>
            <PageLayout
                title="سجل الموظفين"
                description={`إدارة بيانات جميع موظفي المدرسة (عدد ${filteredEmployees.length} موظف)`}
            >
                <div className="space-y-6 relative pb-20">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card
                            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                            onClick={() => setStatusFilter('all')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">إجمالي الموظفين</p>
                                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                            onClick={() => setStatusFilter('نشط')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-lg">
                                    <UserCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-green-600 font-medium">الموظفون النشطون</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                            onClick={() => setStatusFilter('إجازة')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500 rounded-lg">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-amber-600 font-medium">في إجازة</p>
                                    <p className="text-2xl font-bold text-amber-900">{stats.onLeave}</p>
                                </div>
                            </div>
                        </Card>

                        <Link to="/hr/employees/terminated">
                            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500 rounded-lg">
                                        <UserX className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-red-600 font-medium">منتهي الخدمة</p>
                                        <p className="text-2xl font-bold text-red-900">{stats.terminated}</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>

                    {/* Filters */}
                    <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full md:w-auto relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="بحث بالاسم أو الكود أو الرقم القومي أو الهاتف..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto flex-wrap">
                                <Link to="/hr">
                                    <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                        <ArrowRight className="h-4 w-4" />
                                        الرئيسية
                                    </Button>
                                </Link>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <Briefcase className="h-4 w-4 ml-2" />
                                        <SelectValue placeholder="النوع" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="معلم">معلم</SelectItem>
                                        <SelectItem value="إداري">إداري</SelectItem>
                                        <SelectItem value="أمن">أمن</SelectItem>
                                        <SelectItem value="سائق">سائق</SelectItem>
                                        <SelectItem value="عامل">عامل</SelectItem>
                                        <SelectItem value="مشرف">مشرف</SelectItem>
                                        <SelectItem value="منسق">منسق</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <Filter className="h-4 w-4 ml-2" />
                                        <SelectValue placeholder="الحالة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="نشط">نشط</SelectItem>
                                        <SelectItem value="متوقف">متوقف</SelectItem>
                                        <SelectItem value="إجازة">إجازة</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={exportToExcel} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    تصدير
                                </Button>
                                <Link to="/hr/employees/new">
                                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                                        <Plus className="h-4 w-4" />
                                        إضافة
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* Table */}
                    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <span className="mr-3 text-gray-500">جاري تحميل البيانات...</span>
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="text-center py-20">
                                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">لا يوجد بيانات للعرض</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300">
                                    <thead className="bg-blue-100">
                                        <tr>
                                            <th className="px-4 py-3 text-right border border-blue-200 w-12">
                                                <Checkbox
                                                    checked={selectedEmployeeIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الكود</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الموظف</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">النوع</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الوظيفة</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الهاتف</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">تاريخ التعيين</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الحالة</th>
                                            <th className="px-4 py-3 text-center text-sm font-bold text-blue-900 border border-blue-200">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredEmployees.map((employee) => (
                                            <tr key={employee.id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <Checkbox
                                                        checked={selectedEmployeeIds.has(employee.id)}
                                                        onCheckedChange={() => toggleSelectEmployee(employee.id)}
                                                        className="border-gray-300 data-[state=checked]:bg-blue-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200 font-mono text-sm max-w-[80px] truncate">
                                                    {employee.employee_code || '-'}
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                                                            {employee.full_name_ar?.charAt(0) || '؟'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/hr/employees/${employee.id}`}
                                                                className="font-semibold text-blue-600 hover:underline truncate block"
                                                            >
                                                                {employee.full_name_ar}
                                                            </Link>
                                                            <p className="text-xs text-gray-500 truncate">{employee.national_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <Badge className={getTypeBadge(employee.employee_type as EmployeeType)}>
                                                        {employee.employee_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200 text-sm max-w-[150px] truncate">{employee.job_title || '-'}</td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        <span className="font-mono">{employee.phone || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200 text-sm">
                                                    {employee.hire_date
                                                        ? new Date(employee.hire_date).toLocaleDateString('ar-EG')
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 border border-gray-200">
                                                    <Badge className={getStatusBadge(employee.status as EmployeeStatus)}>
                                                        {employee.status || 'نشط'}
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
                                                                <Link to={`/hr/employees/${employee.id}`} className="flex items-center gap-2 cursor-pointer">
                                                                    <Eye className="h-4 w-4" />
                                                                    عرض الملف
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/hr/employees/${employee.id}/documents`} className="flex items-center gap-2 cursor-pointer">
                                                                    <FileText className="h-4 w-4" />
                                                                    المستندات
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/hr/employees/${employee.id}/financial`} className="flex items-center gap-2 cursor-pointer">
                                                                    <Building2 className="h-4 w-4" />
                                                                    الملف المالي
                                                                </Link>
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
                        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{selectedEmployeeIds.size}</span>
                                <span className="text-sm font-medium">موظف محدد</span>
                            </div>
                            <div className="h-4 w-px bg-white/20 mx-2"></div>

                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white border-none"
                                onClick={handleBulkAction}
                            >
                                <Trash2 className="w-4 h-4 ml-2" />
                                خيارات
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
                </div>
            </PageLayout>
        </DashboardLayout>
    );
};

export default HREmployeesList;
