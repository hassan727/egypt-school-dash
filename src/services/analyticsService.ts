import { supabase } from '@/lib/supabase';

/**
 * خدمة التحليلات والإحصائيات المتقدمة
 */
export class AnalyticsService {
    // إحصائيات الأداء الأكاديمي
    static async getAcademicStats(stage?: string) {
        try {
            let query = supabase.from('academic_records').select('current_gpa, passing_status, student_id');

            if (stage) {
                query = query.in('student_id', []);
            }

            const { data, error } = await query;

            if (error) throw error;

            const stats = {
                averageGPA: data?.reduce((sum, r) => sum + (r.current_gpa || 0), 0) / (data?.length || 1) || 0,
                passingCount: data?.filter((r) => r.passing_status === 'ناجح').length || 0,
                failingCount: data?.filter((r) => r.passing_status === 'راسب').length || 0,
                totalRecords: data?.length || 0,
            };

            return stats;
        } catch (err) {
            console.error('خطأ في جلب إحصائيات الأداء:', err);
            throw err;
        }
    }

    // إحصائيات الحضور
    static async getAttendanceStats(studentId?: string) {
        try {
            let query = supabase.from('attendance_records').select('status, student_id, date');

            if (studentId) {
                query = query.eq('student_id', studentId);
            }

            const { data, error } = await query;

            if (error) throw error;

            const stats = {
                present: data?.filter((r) => r.status === 'حاضر').length || 0,
                absent: data?.filter((r) => r.status === 'غائب').length || 0,
                late: data?.filter((r) => r.status === 'متأخر').length || 0,
                excused: data?.filter((r) => r.status === 'معذور').length || 0,
                total: data?.length || 0,
                attendanceRate: data
                    ? ((data?.filter((r) => r.status === 'حاضر').length || 0) / data.length) * 100
                    : 0,
            };

            return stats;
        } catch (err) {
            console.error('خطأ في جلب إحصائيات الحضور:', err);
            throw err;
        }
    }

    // إحصائيات مالية
    static async getFinancialStats() {
        try {
            const { data: fees, error: feesError } = await supabase
                .from('school_fees')
                .select('total_amount, student_id');

            if (feesError) throw feesError;

            const { data: transactions, error: transError } = await supabase
                .from('financial_transactions')
                .select('amount, student_id');

            if (transError) throw transError;

            const totalDue = fees?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
            const totalPaid = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            return {
                totalDue,
                totalPaid,
                remaining: totalDue - totalPaid,
                paymentRate: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
                studentsWithDue: new Set(fees?.map((f) => f.student_id)).size || 0,
            };
        } catch (err) {
            console.error('خطأ في جلب الإحصائيات المالية:', err);
            throw err;
        }
    }

    // إحصائيات سلوكية
    static async getBehavioralStats() {
        try {
            const { data, error } = await supabase
                .from('behavioral_records')
                .select('conduct_rating, disciplinary_issues');

            if (error) throw error;

            const stats = {
                excellent: data?.filter((s) => s.conduct_rating === 'ممتاز').length || 0,
                good: data?.filter((s) => s.conduct_rating === 'جيد').length || 0,
                fair: data?.filter((s) => s.conduct_rating === 'مقبول').length || 0,
                poor: data?.filter((s) => s.conduct_rating === 'ضعيف').length || 0,
                withIssues: data?.filter((s) => s.disciplinary_issues === true).length || 0,
                total: data?.length || 0,
            };

            return stats;
        } catch (err) {
            console.error('خطأ في جلب الإحصائيات السلوكية:', err);
            throw err;
        }
    }

    // التوزيع حسب المراحل
    static async getDistributionByStage() {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('stage');

            if (error) throw error;

            const distribution = {} as Record<string, number>;
            data?.forEach((student) => {
                if (student.stage) {
                    distribution[student.stage] = (distribution[student.stage] || 0) + 1;
                }
            });

            return Object.entries(distribution).map(([stage, count]) => ({
                name: stage,
                value: count,
            }));
        } catch (err) {
            console.error('خطأ في جلب التوزيع:', err);
            throw err;
        }
    }

    // الاتجاهات الشهرية
    static async getMonthlyTrends() {
        try {
            const { data, error } = await supabase
                .from('student_audit_trail')
                .select('created_at');

            if (error) throw error;

            const monthlyData = {} as Record<string, number>;

            data?.forEach((entry) => {
                const date = new Date(entry.created_at);
                const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[month] = (monthlyData[month] || 0) + 1;
            });

            return Object.entries(monthlyData)
                .sort()
                .map(([month, count]) => ({
                    name: month,
                    value: count,
                }));
        } catch (err) {
            console.error('خطأ في جلب الاتجاهات:', err);
            throw err;
        }
    }

    // تقرير شامل
    static async getComprehensiveReport() {
        try {
            const [academic, attendance, financial, behavioral] = await Promise.all([
                this.getAcademicStats(),
                this.getAttendanceStats(),
                this.getFinancialStats(),
                this.getBehavioralStats(),
            ]);

            return {
                academic,
                attendance,
                financial,
                behavioral,
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            console.error('خطأ في جلب التقرير الشامل:', err);
            throw err;
        }
    }

    // أعلى الطلاب أداءً
    static async getTopPerformers(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('academic_records')
                .select('student_id, current_gpa')
                .order('current_gpa', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        } catch (err) {
            console.error('خطأ في جلب أعلى الأداء:', err);
            throw err;
        }
    }

    // الطلاب بحاجة للدعم
    static async getStudentsNeedingSupport() {
        try {
            const { data: academic, error: academicError } = await supabase
                .from('academic_records')
                .select('student_id')
                .lt('current_gpa', 2.0);

            if (academicError) throw academicError;

            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('student_id')
                .eq('status', 'غائب')
                .limit(100);

            if (attendanceError) throw attendanceError;

            const studentsIds = new Set([
                ...(academic?.map((s) => s.student_id) || []),
                ...(attendance?.map((s) => s.student_id) || []),
            ]);

            return Array.from(studentsIds);
        } catch (err) {
            console.error('خطأ في جلب الطلاب بحاجة للدعم:', err);
            throw err;
        }
    }
}