import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SearchFilters {
    searchTerm?: string;
    stage?: string;
    class?: string;
    gender?: string;
    enrollmentType?: string;
    fileStatus?: string;
    academicYear?: string;
    hasSchoolFees?: boolean;
    attendancePercentage?: [number, number];
    conductRating?: string;
    sortBy?: 'name' | 'createdAt' | 'attendanceRate' | 'gpa';
    sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
    id: string;
    studentId: string;
    fullName: string;
    stage: string;
    class: string;
    academicYear: string;
    gpa?: number;
    attendanceRate?: number;
    fileStatus: string;
    gender: string;
    conductRating?: string;
    enrollmentType?: string;
}

export function useAdvancedSearch() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);

    const search = useCallback(async (filters: SearchFilters, limit: number = 50, offset: number = 0) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('students')
                .select('*', { count: 'exact' });

            // تطبيق فلاتر البحث
            if (filters.searchTerm) {
                query = query.or(
                    `full_name_ar.ilike.%${filters.searchTerm}%,student_id.ilike.%${filters.searchTerm}%`
                );
            }

            if (filters.stage) {
                query = query.eq('stage', filters.stage);
            }

            if (filters.class) {
                query = query.eq('class', filters.class);
            }

            if (filters.gender) {
                query = query.eq('gender', filters.gender);
            }

            if (filters.enrollmentType) {
                query = query.eq('enrollment_type', filters.enrollmentType);
            }

            if (filters.fileStatus) {
                query = query.eq('file_status', filters.fileStatus);
            }

            if (filters.academicYear) {
                query = query.eq('academic_year', filters.academicYear);
            }

            // الترتيب
            const sortColumn = filters.sortBy === 'name' ? 'full_name_ar'
                : filters.sortBy === 'createdAt' ? 'created_at'
                    : filters.sortBy === 'attendanceRate' ? 'attendance_rate'
                        : filters.sortBy === 'gpa' ? 'gpa'
                            : 'full_name_ar';

            const isAscending = filters.sortOrder === 'asc';
            query = query.order(sortColumn, { ascending: isAscending });

            // تطبيق التصفية والحد
            const { data, count, error: queryError } = await query
                .range(offset, offset + limit - 1);

            if (queryError) throw queryError;

            // تنسيق النتائج
            const formattedResults: SearchResult[] = (data || []).map(student => ({
                id: student.id,
                studentId: student.student_id,
                fullName: student.full_name_ar,
                stage: student.stage,
                class: student.class,
                academicYear: student.academic_year,
                fileStatus: student.file_status,
                gender: student.gender,
                enrollmentType: student.enrollment_type,
            }));

            setResults(formattedResults);
            setTotalResults(count || 0);

            return {
                results: formattedResults,
                total: count || 0,
                hasMore: (offset + limit) < (count || 0),
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطأ في البحث';
            setError(errorMessage);
            console.error('خطأ في البحث المتقدم:', err);
            return {
                results: [],
                total: 0,
                hasMore: false,
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const quickSearch = useCallback(async (searchTerm: string, limit: number = 20) => {
        return await search({ searchTerm: searchTerm || '', sortBy: 'name' }, limit);
    }, [search]);

    const searchByClass = useCallback(async (stage: string, classRoom: string) => {
        return await search({ searchTerm: '', stage, class: classRoom }, 100);
    }, [search]);

    const searchByAcademicPerformance = useCallback(async (minGPA: number, maxGPA: number) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: queryError } = await supabase
                .from('academic_records')
                .select('student_id')
                .gte('current_gpa', minGPA)
                .lte('current_gpa', maxGPA);

            if (queryError) throw queryError;

            const studentIds = (data || []).map(record => record.student_id);

            if (studentIds.length === 0) {
                setResults([]);
                setTotalResults(0);
                return { results: [], total: 0, hasMore: false };
            }

            const { data: students, count, error: studentsError } = await supabase
                .from('students')
                .select('*', { count: 'exact' })
                .in('student_id', studentIds);

            if (studentsError) throw studentsError;

            const formattedResults: SearchResult[] = (students || []).map(student => ({
                id: student.id,
                studentId: student.student_id,
                fullName: student.full_name_ar,
                stage: student.stage,
                class: student.class,
                academicYear: student.academic_year,
                fileStatus: student.file_status,
                gender: student.gender,
            }));

            setResults(formattedResults);
            setTotalResults(count || 0);

            return {
                results: formattedResults,
                total: count || 0,
                hasMore: false,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطأ في البحث';
            setError(errorMessage);
            console.error('خطأ في البحث عن الأداء الأكاديمي:', err);
            return {
                results: [],
                total: 0,
                hasMore: false,
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const searchByAttendance = useCallback(async (minAttendance: number) => {
        try {
            setLoading(true);
            setError(null);

            const { data: attendanceData, error: queryError } = await supabase
                .from('attendance_records')
                .select('student_id,status');

            if (queryError) throw queryError;

            // حساب معدل الحضور لكل طالب
            const attendanceMap = new Map<string, { present: number; total: number }>();

            for (const record of attendanceData || []) {
                const current = attendanceMap.get(record.student_id) || { present: 0, total: 0 };
                current.total++;
                if (record.status === 'حاضر') current.present++;
                attendanceMap.set(record.student_id, current);
            }

            // فلترة الطلاب بناءً على نسبة الحضور
            const qualifyingStudentIds: string[] = [];
            for (const [studentId, attendance] of attendanceMap) {
                const rate = (attendance.present / attendance.total) * 100;
                if (rate >= minAttendance) {
                    qualifyingStudentIds.push(studentId);
                }
            }

            if (qualifyingStudentIds.length === 0) {
                setResults([]);
                setTotalResults(0);
                return { results: [], total: 0, hasMore: false };
            }

            const { data: students, count, error: studentsError } = await supabase
                .from('students')
                .select('*', { count: 'exact' })
                .in('student_id', qualifyingStudentIds);

            if (studentsError) throw studentsError;

            const formattedResults: SearchResult[] = (students || []).map(student => {
                const attendance = attendanceMap.get(student.student_id);
                return {
                    id: student.id,
                    studentId: student.student_id,
                    fullName: student.full_name_ar,
                    stage: student.stage,
                    class: student.class,
                    academicYear: student.academic_year,
                    fileStatus: student.file_status,
                    gender: student.gender,
                    attendanceRate: attendance ? (attendance.present / attendance.total) * 100 : 0,
                };
            });

            setResults(formattedResults);
            setTotalResults(count || 0);

            return {
                results: formattedResults,
                total: count || 0,
                hasMore: false,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطأ في البحث';
            setError(errorMessage);
            console.error('خطأ في البحث عن الحضور:', err);
            return {
                results: [],
                total: 0,
                hasMore: false,
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSearch = useCallback(() => {
        setResults([]);
        setError(null);
        setTotalResults(0);
    }, []);

    return {
        results,
        loading,
        error,
        totalResults,
        search,
        quickSearch,
        searchByClass,
        searchByAcademicPerformance,
        searchByAttendance,
        clearSearch,
    };
}