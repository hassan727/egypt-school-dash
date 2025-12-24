import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface BehavioralReport {
    id: string;
    record_number: string;
    student_id: string;
    academic_year_id: string;
    created_at: string;
    status: string;
}

interface ReportCounts {
    incident_reports: number;
    violation_confessions: number;
    guardian_summons: number;
    pledge_commitments: number;
    warnings: number;
    behavior_evaluation_notices: number;
    expulsion_warnings: number;
    expulsion_decisions: number;
    therapeutic_plans: number;
    follow_up_reports: number;
    internal_notes: number;
    positive_notes: number;
}

export function useBehavioralReports(studentId: string, academicYearId: string) {
    const [reportCounts, setReportCounts] = useState<ReportCounts>({
        incident_reports: 0,
        violation_confessions: 0,
        guardian_summons: 0,
        pledge_commitments: 0,
        warnings: 0,
        behavior_evaluation_notices: 0,
        expulsion_warnings: 0,
        expulsion_decisions: 0,
        therapeutic_plans: 0,
        follow_up_reports: 0,
        internal_notes: 0,
        positive_notes: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReportCounts = useCallback(async () => {
        if (!studentId || !academicYearId) return;

        try {
            setLoading(true);
            setError(null);

            const counts: ReportCounts = {
                incident_reports: 0,
                violation_confessions: 0,
                guardian_summons: 0,
                pledge_commitments: 0,
                warnings: 0,
                behavior_evaluation_notices: 0,
                expulsion_warnings: 0,
                expulsion_decisions: 0,
                therapeutic_plans: 0,
                follow_up_reports: 0,
                internal_notes: 0,
                positive_notes: 0,
            };

            // Fetch counts for all report types
            const tables = Object.keys(counts) as Array<keyof ReportCounts>;

            for (const table of tables) {
                const { count, error: countError } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', studentId)
                    .eq('academic_year_id', academicYearId);

                if (countError) {
                    console.error(`Error fetching ${table} count:`, countError);
                } else {
                    counts[table] = count || 0;
                }
            }

            setReportCounts(counts);
        } catch (err) {
            console.error('Error fetching report counts:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [studentId, academicYearId]);

    useEffect(() => {
        fetchReportCounts();
    }, [fetchReportCounts]);

    const createReport = useCallback(
        async (
            reportType: keyof ReportCounts,
            data: Record<string, any>,
            recordNumber: string
        ) => {
            try {
                const { data: result, error } = await supabase
                    .from(reportType)
                    .insert([
                        {
                            ...data,
                            student_id: studentId,
                            academic_year_id: academicYearId,
                            record_number: recordNumber,
                            created_by: 'current_user', // سيتم تعديله لاحقاً حسب النظام
                        },
                    ])
                    .select();

                if (error) throw error;
                await fetchReportCounts();
                return result[0];
            } catch (err) {
                console.error(`Error creating ${reportType}:`, err);
                throw err;
            }
        },
        [studentId, academicYearId, fetchReportCounts]
    );

    const updateReport = useCallback(
        async (
            reportType: keyof ReportCounts,
            reportId: string,
            data: Record<string, any>
        ) => {
            try {
                const { data: result, error } = await supabase
                    .from(reportType)
                    .update(data)
                    .eq('id', reportId)
                    .select();

                if (error) throw error;
                await fetchReportCounts();
                return result[0];
            } catch (err) {
                console.error(`Error updating ${reportType}:`, err);
                throw err;
            }
        },
        [fetchReportCounts]
    );

    const deleteReport = useCallback(
        async (reportType: keyof ReportCounts, reportId: string) => {
            try {
                const { error } = await supabase
                    .from(reportType)
                    .delete()
                    .eq('id', reportId);

                if (error) throw error;
                await fetchReportCounts();
            } catch (err) {
                console.error(`Error deleting ${reportType}:`, err);
                throw err;
            }
        },
        [fetchReportCounts]
    );

    const getReports = useCallback(
        async (reportType: keyof ReportCounts, filters: Record<string, any> = {}) => {
            try {
                let query = supabase
                    .from(reportType)
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('academic_year_id', academicYearId);

                // Apply filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        query = query.eq(key, value);
                    }
                });

                const { data, error } = await query.order('created_at', {
                    ascending: false,
                });

                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error(`Error fetching ${reportType}:`, err);
                throw err;
            }
        },
        [studentId, academicYearId]
    );

    const getReportById = useCallback(
        async (reportType: keyof ReportCounts, reportId: string) => {
            try {
                const { data, error } = await supabase
                    .from(reportType)
                    .select('*')
                    .eq('id', reportId)
                    .single();

                if (error) throw error;
                return data;
            } catch (err) {
                console.error(`Error fetching ${reportType} by ID:`, err);
                throw err;
            }
        },
        []
    );

    const generateRecordNumber = useCallback(
        (reportType: string, sequence: number) => {
            const shortType = reportType.substring(0, 3).toUpperCase();
            const yearCode = new Date().getFullYear();
            return `${shortType}-${yearCode}-${String(sequence).padStart(5, '0')}`;
        },
        []
    );

    return {
        reportCounts,
        loading,
        error,
        fetchReportCounts,
        createReport,
        updateReport,
        deleteReport,
        getReports,
        getReportById,
        generateRecordNumber,
    };
}
