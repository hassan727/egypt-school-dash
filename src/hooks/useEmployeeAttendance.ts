/**
 * useEmployeeAttendance - Hook شامل لإدارة سجل حضور الموظفين
 * Comprehensive hook for employee attendance management
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types
export interface Employee {
    id: string;
    employee_id: string;
    full_name: string;
    position: string;
    department: string;
    employee_type: string;
    is_active: boolean;
}

export interface AttendanceRecord {
    id: string;
    employee_id: string;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    scheduled_start: string;
    scheduled_end: string;
    status: 'حاضر' | 'غائب' | 'متأخر' | 'إجازة' | 'إذن' | 'مأمورية';
    late_minutes: number;
    early_leave_minutes: number;
    overtime_minutes: number;
    worked_hours: number;
    permission_reason: string | null;
    permission_type: string | null;
    is_locked: boolean;
    notes: string | null;
    // Joined employee data
    employee?: Employee;
}

export interface AttendanceModification {
    id: string;
    attendance_id: string;
    modified_by: string;
    modified_by_role: string;
    modified_at: string;
    field_changed: string;
    old_value: string;
    new_value: string;
    reason: string;
}

export interface AttendanceStats {
    total: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    onPermission: number;
}

export interface EmployeeShift {
    id: string;
    employee_id: string;
    shift_name: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    grace_period_minutes: number;
    working_days: number[];
    is_active: boolean;
}

export type DateRangeType = 'day' | 'week' | 'month';

interface UseEmployeeAttendanceOptions {
    initialDate?: string;
    initialRangeType?: DateRangeType;
}

export function useEmployeeAttendance(options: UseEmployeeAttendanceOptions = {}) {
    const today = new Date().toISOString().split('T')[0];

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState(options.initialDate || today);
    const [dateRangeType, setDateRangeType] = useState<DateRangeType>(options.initialRangeType || 'day');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');

    // Calculate date range based on type
    const getDateRange = useCallback((date: string, rangeType: DateRangeType) => {
        const baseDate = new Date(date);
        let startDate: Date;
        let endDate: Date;

        switch (rangeType) {
            case 'week':
                // Get start of week (Sunday)
                const dayOfWeek = baseDate.getDay();
                startDate = new Date(baseDate);
                startDate.setDate(baseDate.getDate() - dayOfWeek);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'month':
                startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
                break;
            default: // day
                startDate = baseDate;
                endDate = baseDate;
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        };
    }, []);

    // Fetch employees
    const fetchEmployees = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id, employee_id, full_name, position, department, employee_type, is_active')
                .eq('is_active', true)
                .order('full_name');

            if (error) throw error;
            setEmployees(data || []);
        } catch (err: any) {
            console.error('Error fetching employees:', err);
            setError(err.message);
        }
    }, []);

    // Fetch attendance records
    const fetchAttendanceRecords = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { startDate, endDate } = getDateRange(selectedDate, dateRangeType);

            const { data, error } = await supabase
                .from('employee_attendance')
                .select(`
          *,
          employee:employees(id, employee_id, full_name, position, department, employee_type)
        `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (error) {
                // If table doesn't exist, just show empty
                if (error.code === '42P01') {
                    console.warn('employee_attendance table not found - showing empty');
                    setRecords([]);
                } else {
                    throw error;
                }
            } else {
                setRecords(data || []);
            }
        } catch (err: any) {
            console.error('Error fetching attendance:', err);
            setError(err.message);
            // Don't show toast for table not found
            if (!err.message?.includes('does not exist')) {
                toast.error('فشل في تحميل سجلات الحضور');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedDate, dateRangeType, getDateRange]);

    // Create attendance record
    const createAttendanceRecord = useCallback(async (
        employeeId: string,
        date: string,
        checkInTime?: string,
        checkOutTime?: string
    ) => {
        try {
            // Get employee shift for scheduled times
            const { data: shift } = await supabase
                .from('employee_shifts')
                .select('start_time, end_time, grace_period_minutes')
                .eq('employee_id', employeeId)
                .eq('is_active', true)
                .single();

            const scheduledStart = shift?.start_time || '08:00:00';
            const scheduledEnd = shift?.end_time || '15:00:00';
            const gracePeriod = shift?.grace_period_minutes || 15;

            // Calculate status and late minutes
            let status: AttendanceRecord['status'] = 'غائب';
            let lateMinutes = 0;
            let workedHours = 0;

            if (checkInTime) {
                const checkIn = new Date(`${date}T${checkInTime}`);
                const scheduled = new Date(`${date}T${scheduledStart}`);
                const graceTime = new Date(scheduled.getTime() + gracePeriod * 60000);

                if (checkIn <= graceTime) {
                    status = 'حاضر';
                } else {
                    status = 'متأخر';
                    lateMinutes = Math.floor((checkIn.getTime() - scheduled.getTime()) / 60000);
                }

                if (checkOutTime) {
                    const checkOut = new Date(`${date}T${checkOutTime}`);
                    workedHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                }
            }

            const { data, error } = await supabase
                .from('employee_attendance')
                .upsert({
                    employee_id: employeeId,
                    date,
                    check_in_time: checkInTime,
                    check_out_time: checkOutTime,
                    scheduled_start: scheduledStart,
                    scheduled_end: scheduledEnd,
                    status,
                    late_minutes: lateMinutes,
                    worked_hours: Math.round(workedHours * 100) / 100,
                }, { onConflict: 'employee_id,date' })
                .select()
                .single();

            if (error) throw error;

            toast.success('تم تسجيل الحضور بنجاح');
            await fetchAttendanceRecords();
            return data;
        } catch (err: any) {
            console.error('Error creating attendance:', err);
            toast.error('فشل في تسجيل الحضور');
            throw err;
        }
    }, [fetchAttendanceRecords]);

    // Update attendance record with audit trail
    const updateAttendanceRecord = useCallback(async (
        attendanceId: string,
        updates: Partial<AttendanceRecord>,
        modifiedBy: string,
        reason: string
    ) => {
        try {
            // Get current record for audit
            const { data: currentRecord, error: fetchError } = await supabase
                .from('employee_attendance')
                .select('*')
                .eq('id', attendanceId)
                .single();

            if (fetchError) throw fetchError;

            // Check if record is locked
            if (currentRecord.is_locked) {
                toast.error('السجل مقفل ولا يمكن تعديله');
                throw new Error('Record is locked');
            }

            // Update the record
            const { data, error } = await supabase
                .from('employee_attendance')
                .update(updates)
                .eq('id', attendanceId)
                .select()
                .single();

            if (error) throw error;

            // Create audit trail entries for each changed field
            const modificationPromises = Object.keys(updates).map(async (field) => {
                const oldValue = String(currentRecord[field] ?? '');
                const newValue = String(updates[field as keyof typeof updates] ?? '');

                if (oldValue !== newValue) {
                    return supabase.from('attendance_modifications').insert({
                        attendance_id: attendanceId,
                        modified_by: modifiedBy,
                        modified_by_role: 'HR Admin',
                        field_changed: field,
                        old_value: oldValue,
                        new_value: newValue,
                        reason,
                    });
                }
            });

            await Promise.all(modificationPromises);

            toast.success('تم تحديث السجل بنجاح');
            await fetchAttendanceRecords();
            return data;
        } catch (err: any) {
            console.error('Error updating attendance:', err);
            toast.error('فشل في تحديث السجل');
            throw err;
        }
    }, [fetchAttendanceRecords]);

    // Lock/unlock period
    const lockPeriod = useCallback(async (
        startDate: string,
        endDate: string,
        lockedBy: string,
        lock: boolean = true
    ) => {
        try {
            const { error } = await supabase
                .from('employee_attendance')
                .update({
                    is_locked: lock,
                    locked_at: lock ? new Date().toISOString() : null,
                    locked_by: lock ? lockedBy : null,
                })
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            toast.success(lock ? 'تم إقفال الفترة بنجاح' : 'تم فتح الفترة بنجاح');
            await fetchAttendanceRecords();
        } catch (err: any) {
            console.error('Error locking period:', err);
            toast.error('فشل في تغيير حالة الإقفال');
            throw err;
        }
    }, [fetchAttendanceRecords]);

    // Get modifications history
    const getModificationHistory = useCallback(async (attendanceId: string) => {
        try {
            const { data, error } = await supabase
                .from('attendance_modifications')
                .select('*')
                .eq('attendance_id', attendanceId)
                .order('modified_at', { ascending: false });

            if (error) throw error;
            return data as AttendanceModification[];
        } catch (err: any) {
            console.error('Error fetching modifications:', err);
            return [];
        }
    }, []);

    // Calculate statistics
    const stats: AttendanceStats = {
        total: records.length,
        present: records.filter(r => r.status === 'حاضر').length,
        late: records.filter(r => r.status === 'متأخر').length,
        absent: records.filter(r => r.status === 'غائب').length,
        onLeave: records.filter(r => r.status === 'إجازة').length,
        onPermission: records.filter(r => r.status === 'إذن' || r.status === 'مأمورية').length,
    };

    // Filter records
    const filteredRecords = records.filter(record => {
        const employee = record.employee;
        const matchesSearch =
            !searchQuery ||
            employee?.full_name?.includes(searchQuery) ||
            employee?.employee_id?.includes(searchQuery);

        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        const matchesDepartment = departmentFilter === 'all' || employee?.department === departmentFilter;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    // Get unique departments for filter
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    // Financial calculations for employee
    const calculateEmployeeFinancials = useCallback((
        employeeId: string,
        month: string, // YYYY-MM format
        dailyRate: number
    ) => {
        const monthRecords = records.filter(r => {
            const recordMonth = r.date.substring(0, 7);
            return r.employee_id === employeeId && recordMonth === month;
        });

        const presentDays = monthRecords.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
        const absentDays = monthRecords.filter(r => r.status === 'غائب').length;
        const totalLateMinutes = monthRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0);

        // Get deduction settings
        const lateDeductionPerMinute = 0.5; // Will be fetched from settings
        const absentDeduction = dailyRate;

        const lateDeductions = totalLateMinutes * lateDeductionPerMinute;
        const absentDeductions = absentDays * absentDeduction;
        const totalDeductions = lateDeductions + absentDeductions;
        const amountDue = (presentDays * dailyRate) - lateDeductions;

        return {
            presentDays,
            absentDays,
            totalLateMinutes,
            lateDeductions,
            absentDeductions,
            totalDeductions,
            amountDue,
            totalWorkDays: monthRecords.length,
        };
    }, [records]);

    // Initial fetch
    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchAttendanceRecords();
    }, [fetchAttendanceRecords]);

    // Real-time subscription
    useEffect(() => {
        const subscription = supabase
            .channel('employee_attendance_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'employee_attendance' },
                () => {
                    fetchAttendanceRecords();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchAttendanceRecords]);

    return {
        // Data
        records: filteredRecords,
        allRecords: records,
        employees,
        stats,
        departments,
        loading,
        error,

        // Filters
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

        // Actions
        fetchAttendanceRecords,
        createAttendanceRecord,
        updateAttendanceRecord,
        lockPeriod,
        getModificationHistory,
        calculateEmployeeFinancials,
        getDateRange,

        // Helpers
        refresh: fetchAttendanceRecords,
    };
}

export default useEmployeeAttendance;
