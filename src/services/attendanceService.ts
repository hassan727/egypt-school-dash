import { supabase } from '@/lib/supabase';

export interface AttendanceCalculation {
    status: 'حاضر' | 'غائب' | 'متأخر' | 'إجازة' | 'إذن' | 'مأمورية';
    late_minutes: number;
    worked_hours: number;
    scheduled_start: string;
    scheduled_end: string;
}

export const attendanceService = {
    /**
     * Get the effective shift for an employee on a given date
     */
    async getEmployeeShift(employeeId: string, schoolId?: string) {
        // 1. Get Employee's Master Shift
        const { data: employeeData } = await supabase
            .from('employees')
            .select('shift_id')
            .eq('id', employeeId)
            .single();

        let scheduledStart = '08:00:00';
        let scheduledEnd = '15:00:00';
        let gracePeriod = 15;

        if (employeeData?.shift_id) {
            const { data: masterShift } = await supabase
                .from('hr_shifts')
                .select('start_time, end_time, grace_period_minutes')
                .eq('id', employeeData.shift_id)
                .single();

            if (masterShift) {
                scheduledStart = masterShift.start_time;
                scheduledEnd = masterShift.end_time;
                gracePeriod = masterShift.grace_period_minutes;
            }
        } else {
            // 2. Fallback to individual shift
            const { data: individualShift } = await supabase
                .from('employee_shifts')
                .select('start_time, end_time, grace_period_minutes')
                .eq('employee_id', employeeId)
                .eq('is_active', true)
                .maybeSingle();

            if (individualShift) {
                scheduledStart = individualShift.start_time;
                scheduledEnd = individualShift.end_time;
                gracePeriod = individualShift.grace_period_minutes;
            } else {
                // 3. Fallback to global settings
                let settings = null;
                if (schoolId) {
                    const { data } = await supabase
                        .from('hr_system_settings')
                        .select('official_start_time, official_end_time, lateness_grace_period_minutes')
                        .eq('school_id', schoolId)
                        .maybeSingle();
                    settings = data;
                }

                if (settings) {
                    scheduledStart = settings.official_start_time;
                    scheduledEnd = settings.official_end_time;
                    gracePeriod = settings.lateness_grace_period_minutes;
                }
            }
        }

        return { scheduledStart, scheduledEnd, gracePeriod };
    },

    /**
     * Calculate distance between two points in meters using Haversine formula
     */
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    },

    /**
     * Get Geofencing settings for a specific school
     * Updated: Now uses default location from attendance_locations table
     */
    async getGeofencingSettings(schoolId: string) {
        // 1. Check if geofencing is enabled
        const { data: enableSetting } = await supabase
            .from('attendance_settings')
            .select('setting_value')
            .eq('school_id', schoolId)
            .eq('setting_key', 'enable_geofencing')
            .maybeSingle();

        const enabled = enableSetting?.setting_value === 'true';

        // 2. Get default location from attendance_locations
        const { data: defaultLocation } = await supabase
            .from('attendance_locations')
            .select('*')
            .eq('is_default', true)
            .eq('is_active', true)
            .maybeSingle();

        // Fallback to first active location if no default is set
        let location = defaultLocation;
        if (!location) {
            const { data: firstLocation } = await supabase
                .from('attendance_locations')
                .select('*')
                .eq('is_active', true)
                .order('created_at')
                .limit(1)
                .maybeSingle();
            location = firstLocation;
        }

        // Return unified format (same for check-in and check-out)
        return {
            checkIn: {
                lat: location?.latitude || 30.0444,
                lon: location?.longitude || 31.2357,
            },
            checkOut: {
                lat: location?.latitude || 30.0444,
                lon: location?.longitude || 31.2357,
            },
            radius: location?.radius_meters || 100,
            enabled: enabled,
            locationId: location?.id,
            locationName: location?.location_name
        };
    },

    /**
     * Calculate financial deduction for lateness
     */
    async calculateLatenessDeduction(lateMinutes: number, schoolId?: string): Promise<number> {
        if (!schoolId) return lateMinutes * 1.0; // Default fallback

        const { data: settings } = await supabase
            .from('hr_system_settings')
            .select('lateness_penalty_rate')
            .eq('school_id', schoolId)
            .maybeSingle();

        // Default to 0.25 if not set (or whatever business logic requires)
        // Note: The UI settings page uses 1.0 as a typical default for "minute for a minute"
        // Adjusting default to 1.0 to match UI expectation if setting is missing.
        const rate = parseFloat(settings?.lateness_penalty_rate?.toString() || '1.0');
        return lateMinutes * rate;
    },

    /**
     * Calculate attendance status based on times
     */
    calculateStatus(
        checkInTime: string | null,
        checkOutTime: string | null,
        scheduledStart: string,
        scheduledEnd: string,
        gracePeriod: number,
        date: string
    ): AttendanceCalculation {
        let status: any = 'غائب';
        let late_minutes = 0;
        let worked_hours = 0;

        if (checkInTime) {
            const checkInDate = new Date(`${date}T${checkInTime.includes(':') && checkInTime.split(':').length === 2 ? checkInTime + ':00' : checkInTime}`);
            const scheduledDate = new Date(`${date}T${scheduledStart}`);
            const graceTime = new Date(scheduledDate.getTime() + gracePeriod * 60000);

            if (checkInDate <= graceTime) {
                status = 'حاضر';
            } else {
                status = 'متأخر';
                late_minutes = Math.floor((checkInDate.getTime() - scheduledDate.getTime()) / 60000);
            }

            if (checkOutTime) {
                const checkOutDate = new Date(`${date}T${checkOutTime.includes(':') && checkOutTime.split(':').length === 2 ? checkOutTime + ':00' : checkOutTime}`);
                worked_hours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
                worked_hours = Math.round(worked_hours * 100) / 100;
            }
        }

        return { status, late_minutes, worked_hours, scheduled_start: scheduledStart, scheduled_end: scheduledEnd };
    },

    /**
     * Record attendance (Check-in or Check-out)
     */
    async recordAttendance(
        employeeId: string,
        date: string,
        checkInTime?: string | null,
        checkOutTime?: string | null,
        extraFields: any = {},
        schoolId?: string
    ) {
        const shift = await this.getEmployeeShift(employeeId, schoolId);

        // If updating an existing record, we might need its current times
        let finalCheckIn = checkInTime;
        let finalCheckOut = checkOutTime;

        if (checkInTime === undefined || checkOutTime === undefined) {
            const { data: current } = await supabase
                .from('employee_attendance')
                .select('check_in_time, check_out_time')
                .eq('employee_id', employeeId)
                .eq('date', date)
                .maybeSingle();

            if (checkInTime === undefined) finalCheckIn = current?.check_in_time;
            if (checkOutTime === undefined) finalCheckOut = current?.check_out_time;
        }

        const calc = this.calculateStatus(
            finalCheckIn || null,
            finalCheckOut || null,
            shift.scheduledStart,
            shift.scheduledEnd,
            shift.gracePeriod,
            date
        );

        // Calculate Deduction
        let deductionAmount = 0;
        if (calc.status === 'متأخر') {
            deductionAmount = await this.calculateLatenessDeduction(calc.late_minutes, schoolId);
        }

        const payload = {
            employee_id: employeeId,
            date,
            check_in_time: finalCheckIn,
            check_out_time: finalCheckOut,
            ...calc,
            deduction_amount: deductionAmount,
            school_id: schoolId, // Enforce School Identity
            ...extraFields
        };

        const { data, error } = await supabase
            .from('employee_attendance')
            .upsert(payload, { onConflict: 'employee_id,date' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
