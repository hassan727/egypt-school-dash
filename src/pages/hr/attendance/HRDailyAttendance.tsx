/**
 * صفحة سجل البصمة الشامل - نظام الموارد البشرية
 * Comprehensive Fingerprint Attendance System - HR
 */
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Clock, Search, Download, Calendar, UserCheck, UserX, AlertTriangle,
    Loader2, Edit2, Lock, Unlock, Printer, User, Building2, ChevronLeft, ChevronRight,
    CalendarDays, CalendarRange, FileText, X, Smartphone, QrCode
} from 'lucide-react';
import { useEmployeeAttendance, AttendanceRecord, DateRangeType } from '@/hooks/useEmployeeAttendance';
import { toast } from 'sonner';

// Status styling configuration
const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
    'حاضر': { color: 'text-green-700', bgColor: 'bg-green-100 border-green-300', label: 'حاضر', icon: <UserCheck className="h-3 w-3" /> },
    'متأخر': { color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300', label: 'متأخر', icon: <AlertTriangle className="h-3 w-3" /> },
    'غائب': { color: 'text-red-700', bgColor: 'bg-red-100 border-red-300', label: 'غائب', icon: <UserX className="h-3 w-3" /> },
    'إجازة': { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300', label: 'إجازة', icon: <Calendar className="h-3 w-3" /> },
    'إذن': { color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300', label: 'إذن', icon: <FileText className="h-3 w-3" /> },
    'مأمورية': { color: 'text-indigo-700', bgColor: 'bg-indigo-100 border-indigo-300', label: 'مأمورية', icon: <Building2 className="h-3 w-3" /> },
};

// Helper function to format time as 12-hour AM/PM
const formatTime12Hour = (time: string | null): string => {
    if (!time) return '--:--';

    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const HRDailyAttendance = () => {
    const {
        records,
        employees,
        stats,
        departments,
        loading,
        selectedDate,
        setSelectedDate,
        dateRangeType,
        setDateRangeType,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        departmentFilter,
        setDepartmentFilter,
        updateAttendanceRecord,
        lockPeriod,
        getModificationHistory,
        getDateRange,
    } = useEmployeeAttendance();

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [editForm, setEditForm] = useState({
        status: '',
        check_in_time: '',
        check_out_time: '',
        notes: '',
        reason: '',
    });

    // Employee profile dialog state
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    // Print ref
    const printRef = useRef<HTMLDivElement>(null);

    // Handle date navigation
    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        const offset = direction === 'next' ? 1 : -1;

        switch (dateRangeType) {
            case 'week':
                current.setDate(current.getDate() + (7 * offset));
                break;
            case 'month':
                current.setMonth(current.getMonth() + offset);
                break;
            default:
                current.setDate(current.getDate() + offset);
        }

        setSelectedDate(current.toISOString().split('T')[0]);
    };

    // Handle edit dialog open
    const handleEditClick = (record: AttendanceRecord) => {
        setSelectedRecord(record);
        setEditForm({
            status: record.status,
            check_in_time: record.check_in_time || '',
            check_out_time: record.check_out_time || '',
            notes: record.notes || '',
            reason: '',
        });
        setEditDialogOpen(true);
    };

    // Handle save edit
    const handleSaveEdit = async () => {
        if (!selectedRecord || !editForm.reason.trim()) {
            toast.error('يرجى إدخال سبب التعديل');
            return;
        }

        try {
            await updateAttendanceRecord(
                selectedRecord.id,
                {
                    status: editForm.status as AttendanceRecord['status'],
                    check_in_time: editForm.check_in_time || null,
                    check_out_time: editForm.check_out_time || null,
                    notes: editForm.notes || null,
                },
                'HR Admin', // Should be actual user
                editForm.reason
            );
            setEditDialogOpen(false);
        } catch (error) {
            // Error handled in hook
        }
    };

    // Handle employee profile click
    const handleEmployeeClick = (employee: any) => {
        setSelectedEmployee(employee);
        setProfileDialogOpen(true);
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle lock period
    const handleLockPeriod = async () => {
        const { startDate, endDate } = getDateRange(selectedDate, dateRangeType);
        const hasUnlocked = records.some(r => !r.is_locked);
        await lockPeriod(startDate, endDate, 'HR Admin', hasUnlocked);
    };

    // Format date display
    const formatDateDisplay = () => {
        const date = new Date(selectedDate);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        if (dateRangeType === 'week') {
            const { startDate, endDate } = getDateRange(selectedDate, 'week');
            return `${new Date(startDate).toLocaleDateString('ar-EG')} - ${new Date(endDate).toLocaleDateString('ar-EG')}`;
        }
        if (dateRangeType === 'month') {
            return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
        }
        return date.toLocaleDateString('ar-EG', options);
    };

    // Get status badge
    const getStatusBadge = (status: string, lateMinutes?: number) => {
        const config = statusConfig[status] || statusConfig['غائب'];
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className={`${config.bgColor} ${config.color} border flex items-center gap-1 cursor-help`}>
                            {config.icon}
                            {config.label}
                            {status === 'متأخر' && lateMinutes ? ` (${lateMinutes} د)` : ''}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{status === 'متأخر' ? `تأخير ${lateMinutes} دقيقة عن موعد الدوام` : config.label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Clock className="h-8 w-8 text-blue-600" />
                            سجل البصمة
                        </h1>
                        <p className="text-gray-500 mt-1">نظام متابعة حضور وانصراف الموظفين</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Link to="/hr/attendance/mobile">
                            <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                                <Smartphone className="h-4 w-4 ml-2" />
                                تسجيل من الجوال
                            </Button>
                        </Link>
                        <Link to="/hr/attendance/qr">
                            <Button variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100">
                                <QrCode className="h-4 w-4 ml-2" />
                                إدارة رموز QR
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 ml-2" />
                            طباعة
                        </Button>
                        <Button variant="outline" onClick={handleLockPeriod}>
                            {records.some(r => !r.is_locked) ? (
                                <>
                                    <Lock className="h-4 w-4 ml-2" />
                                    إقفال الفترة
                                </>
                            ) : (
                                <>
                                    <Unlock className="h-4 w-4 ml-2" />
                                    فتح الفترة
                                </>
                            )}
                        </Button>
                        <Button>
                            <Download className="h-4 w-4 ml-2" />
                            تصدير Excel
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600">إجمالي</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                                <UserCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600">حاضر</p>
                                <p className="text-2xl font-bold text-green-900">{stats.present}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-yellow-600">متأخر</p>
                                <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-lg">
                                <UserX className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-red-600">غائب</p>
                                <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border-indigo-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-indigo-600">إجازة</p>
                                <p className="text-2xl font-bold text-indigo-900">{stats.onLeave}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-600">إذن/مأمورية</p>
                                <p className="text-2xl font-bold text-purple-900">{stats.onPermission}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Date Range Tabs & Controls */}
                <Card className="p-4">
                    <Tabs value={dateRangeType} onValueChange={(v) => setDateRangeType(v as DateRangeType)}>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <TabsList className="grid grid-cols-3 w-full md:w-auto">
                                <TabsTrigger value="day" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    يومي
                                </TabsTrigger>
                                <TabsTrigger value="week" className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    أسبوعي
                                </TabsTrigger>
                                <TabsTrigger value="month" className="flex items-center gap-2">
                                    <CalendarRange className="h-4 w-4" />
                                    شهري
                                </TabsTrigger>
                            </TabsList>

                            {/* Date Navigation */}
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <div className="px-4 py-2 min-w-[200px] text-center font-medium">
                                    {formatDateDisplay()}
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>

                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-[180px]"
                            />
                        </div>
                    </Tabs>

                    {/* Filters */}
                    <div className="flex gap-4 flex-wrap mt-4 pt-4 border-t">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="بحث بالاسم أو الكود..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الحالات</SelectItem>
                                <SelectItem value="حاضر">حاضر</SelectItem>
                                <SelectItem value="متأخر">متأخر</SelectItem>
                                <SelectItem value="غائب">غائب</SelectItem>
                                <SelectItem value="إجازة">إجازة</SelectItem>
                                <SelectItem value="إذن">إذن</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="القسم" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الأقسام</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Attendance Table */}
                <Card ref={printRef} className="print-section">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="mr-3 text-gray-500">جاري تحميل البيانات...</span>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <Calendar className="h-16 w-16 mb-4 text-gray-300" />
                            <p className="text-lg">لا توجد سجلات حضور للفترة المحددة</p>
                            <p className="text-sm">جرب تغيير التاريخ أو الفلاتر</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-[100px]">الكود</TableHead>
                                        <TableHead>الموظف</TableHead>
                                        <TableHead>القسم</TableHead>
                                        <TableHead>الوظيفة</TableHead>
                                        <TableHead className="text-center">الحضور</TableHead>
                                        <TableHead className="text-center">الانصراف</TableHead>
                                        <TableHead className="text-center">الساعات</TableHead>
                                        <TableHead className="text-center">الحالة</TableHead>
                                        <TableHead className="text-center w-[80px]">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow
                                            key={record.id}
                                            className={`hover:bg-gray-50 ${record.is_locked ? 'bg-gray-50/50' : ''}`}
                                        >
                                            <TableCell className="font-mono text-sm">
                                                {record.employee?.employee_id}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleEmployeeClick(record.employee)}
                                                    className="font-semibold text-blue-600 hover:underline flex items-center gap-2"
                                                >
                                                    <User className="h-4 w-4" />
                                                    {record.employee?.full_name}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {record.employee?.department || '-'}
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {record.employee?.position || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className={record.check_in_time ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                                                {formatTime12Hour(record.check_in_time)}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>الموعد المحدد: {formatTime12Hour(record.scheduled_start)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={record.check_out_time ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                                                    {formatTime12Hour(record.check_out_time)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-medium">
                                                    {record.worked_hours ? `${record.worked_hours.toFixed(1)} س` : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(record.status, record.late_minutes)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(record)}
                                                    disabled={record.is_locked}
                                                    className="h-8 w-8"
                                                >
                                                    {record.is_locked ? (
                                                        <Lock className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <Edit2 className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit2 className="h-5 w-5" />
                                تعديل سجل الحضور
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="font-medium">{selectedRecord?.employee?.full_name}</p>
                                <p className="text-sm text-gray-500">التاريخ: {selectedRecord?.date}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">وقت الحضور</label>
                                    <Input
                                        type="time"
                                        value={editForm.check_in_time}
                                        onChange={(e) => setEditForm({ ...editForm, check_in_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">وقت الانصراف</label>
                                    <Input
                                        type="time"
                                        value={editForm.check_out_time}
                                        onChange={(e) => setEditForm({ ...editForm, check_out_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">الحالة</label>
                                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="حاضر">حاضر</SelectItem>
                                        <SelectItem value="متأخر">متأخر</SelectItem>
                                        <SelectItem value="غائب">غائب</SelectItem>
                                        <SelectItem value="إجازة">إجازة</SelectItem>
                                        <SelectItem value="إذن">إذن</SelectItem>
                                        <SelectItem value="مأمورية">مأمورية</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">ملاحظات</label>
                                <Textarea
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    placeholder="ملاحظات إضافية..."
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-red-600">* سبب التعديل (إجباري)</label>
                                <Textarea
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    placeholder="أدخل سبب التعديل..."
                                    className="border-red-200"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleSaveEdit}>
                                حفظ التعديلات
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Employee Profile Dialog */}
                <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                ملف الموظف
                            </DialogTitle>
                        </DialogHeader>
                        {selectedEmployee && (
                            <div className="space-y-4 py-4">
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {selectedEmployee.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedEmployee.full_name}</h3>
                                        <p className="text-gray-500">{selectedEmployee.position}</p>
                                        <Badge variant="outline" className="mt-1">{selectedEmployee.employee_id}</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500">القسم</p>
                                        <p className="font-medium">{selectedEmployee.department || '-'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500">نوع الوظيفة</p>
                                        <p className="font-medium">{selectedEmployee.employee_type || '-'}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">ملخص الحضور للشهر الحالي</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600">-</p>
                                            <p className="text-xs text-gray-500">أيام الحضور</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                            <p className="text-2xl font-bold text-red-600">-</p>
                                            <p className="text-xs text-gray-500">أيام الغياب</p>
                                        </div>
                                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-2xl font-bold text-yellow-600">-</p>
                                            <p className="text-xs text-gray-500">دقائق التأخير</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        </DashboardLayout>
    );
};

export default HRDailyAttendance;
