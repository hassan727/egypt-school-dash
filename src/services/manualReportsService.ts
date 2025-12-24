import { supabase } from '@/lib/supabase';

// ========================================
// Interfaces
// ========================================

export interface ManualAttendanceEntry {
    id?: string;
    report_id?: string;
    stage_id: string;
    stage_name: string;
    class_id: string;
    class_name: string;
    enrolled: number;
    present: number;
    absent: number;
    attendance_rate: number;
    absence_rate: number;
}

export interface ManualAttendanceReport {
    id?: string;
    report_date: string;
    academic_year_id?: string;
    academic_year_code?: string;
    report_title?: string;
    notes?: string;
    total_enrolled?: number;
    total_present?: number;
    total_absent?: number;
    attendance_rate?: number;
    absence_rate?: number;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    entries?: ManualAttendanceEntry[];
}

export interface ManualReportSummary {
    id: string;
    report_date: string;
    academic_year_code: string;
    report_title: string;
    total_enrolled: number;
    total_present: number;
    total_absent: number;
    attendance_rate: number;
    absence_rate: number;
    entries_count: number;
    created_at: string;
}

// ========================================
// Service Functions
// ========================================

export const ManualReportsService = {
    /**
     * حفظ تقرير يدوي جديد مع جميع الإدخالات
     */
    /**
     * حفظ تقرير يدوي جديد مع جميع الإدخالات (Atomic Transaction)
     */
    async saveReport(
        entries: ManualAttendanceEntry[],
        reportDate: string,
        academicYearCode: string,
        reportTitle?: string,
        notes?: string
    ): Promise<{ success: boolean; reportId?: string; error?: string }> {
        try {
            // حساب الإجماليات
            const totalEnrolled = entries.reduce((sum, e) => sum + e.enrolled, 0);
            const totalPresent = entries.reduce((sum, e) => sum + e.present, 0);
            const totalAbsent = entries.reduce((sum, e) => sum + e.absent, 0);
            const attendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;
            const absenceRate = totalEnrolled > 0 ? Math.round((totalAbsent / totalEnrolled) * 100) : 0;

            const { data: reportId, error } = await supabase.rpc('save_manual_report_transaction', {
                p_report_id: null,
                p_report_date: reportDate,
                p_academic_year_code: academicYearCode,
                p_report_title: reportTitle || `تقرير ${reportDate}`,
                p_notes: notes,
                p_total_enrolled: totalEnrolled,
                p_total_present: totalPresent,
                p_total_absent: totalAbsent,
                p_attendance_rate: attendanceRate,
                p_absence_rate: absenceRate,
                p_entries: entries
            });

            if (error) throw error;

            return { success: true, reportId };
        } catch (error: any) {
            console.error('Error saving manual report:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * جلب قائمة التقارير المحفوظة (ملخص)
     */
    /**
     * جلب قائمة التقارير المحفوظة (ملخص)
     * @param academicYearCode - إذا تم تمرير القيمة، سيتم الفلترة بها. إذا كانت فارغة أو null، سيتم جلب الكل.
     */
    async getReportsList(academicYearCode?: string | null): Promise<ManualReportSummary[]> {
        try {
            let query = supabase
                .from('manual_attendance_reports')
                .select(`
          id,
          report_date,
          academic_year_code,
          report_title,
          total_enrolled,
          total_present,
          total_absent,
          attendance_rate,
          absence_rate,
          created_at
        `)
                .order('report_date', { ascending: false });

            if (academicYearCode && academicYearCode !== 'all') {
                query = query.eq('academic_year_code', academicYearCode);
            }

            const { data, error } = await query;

            if (error) throw error;

            // جلب عدد الإدخالات لكل تقرير
            const reportsWithCount = await Promise.all(
                (data || []).map(async (report) => {
                    const { count } = await supabase
                        .from('manual_attendance_entries')
                        .select('id', { count: 'exact', head: true })
                        .eq('report_id', report.id);

                    return {
                        ...report,
                        entries_count: count || 0
                    };
                })
            );

            return reportsWithCount;
        } catch (error) {
            console.error('Error fetching reports list:', error);
            return [];
        }
    },

    /**
     * جلب تقرير كامل مع الإدخالات
     */
    async getReportById(reportId: string): Promise<ManualAttendanceReport | null> {
        try {
            // جلب التقرير
            const { data: report, error: reportError } = await supabase
                .from('manual_attendance_reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (reportError) throw reportError;

            // جلب الإدخالات
            const { data: entries, error: entriesError } = await supabase
                .from('manual_attendance_entries')
                .select('*')
                .eq('report_id', reportId)
                .order('stage_name', { ascending: true });

            if (entriesError) throw entriesError;

            return {
                ...report,
                entries: entries || []
            };
        } catch (error) {
            console.error('Error fetching report:', error);
            return null;
        }
    },

    /**
     * حذف تقرير
     */
    async deleteReport(reportId: string): Promise<boolean> {
        try {
            // الإدخالات ستُحذف تلقائياً بسبب ON DELETE CASCADE
            const { error } = await supabase
                .from('manual_attendance_reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting report:', error);
            return false;
        }
    },

    /**
     * تحديث تقرير موجود
     */
    /**
     * تحديث تقرير موجود (Atomic Transaction)
     */
    async updateReport(
        reportId: string,
        entries: ManualAttendanceEntry[],
        reportTitle?: string,
        notes?: string
    ): Promise<boolean> {
        try {
            // حساب الإجماليات الجديدة
            const totalEnrolled = entries.reduce((sum, e) => sum + e.enrolled, 0);
            const totalPresent = entries.reduce((sum, e) => sum + e.present, 0);
            const totalAbsent = entries.reduce((sum, e) => sum + e.absent, 0);
            const attendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;
            const absenceRate = totalEnrolled > 0 ? Math.round((totalAbsent / totalEnrolled) * 100) : 0;

            const { error } = await supabase.rpc('save_manual_report_transaction', {
                p_report_id: reportId,
                p_report_date: new Date().toISOString(), // Date might be needed but not critical for update if not changing date
                p_academic_year_code: '', // Not changing year on update usually
                p_report_title: reportTitle,
                p_notes: notes,
                p_total_enrolled: totalEnrolled,
                p_total_present: totalPresent,
                p_total_absent: totalAbsent,
                p_attendance_rate: attendanceRate,
                p_absence_rate: absenceRate,
                p_entries: entries
            });

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Error updating report:', error);
            return false;
        }
    }
};
