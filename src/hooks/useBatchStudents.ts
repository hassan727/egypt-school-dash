import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSystemSchoolId } from '@/context/SystemContext';

export interface BatchStudent {
    id: string;
    student_id: string;
    full_name_ar: string;
    gender: string;
    registration_status: string;
    class_id: string;
    guardian_phone?: string;
    guardian_email?: string;
    mother_email?: string;
    religion?: string;
    classes?: {
        id: string;
        name: string;
        stage_id: string;
        stages?: {
            id: string;
            name: string;
        }
    };
}

export function useBatchStudents(classId: string | null, stageId?: string | null) {
    const schoolId = useSystemSchoolId();
    const [students, setStudents] = useState<BatchStudent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = async () => {
        if (!classId && !stageId) {
            setStudents([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            let query = supabase
                .from('students')
                .select(`
          id,
          student_id,
          full_name_ar,
          gender,
          religion,
          registration_status,
          class_id,
          guardian_phone,
          guardian_email,
          mother_email,
          classes!inner (
            id,
            name,
            stage_id,
            stages (
              id,
              name
            )
          )
        `);

            if (classId) {
                query = query.eq('class_id', classId).eq('school_id', schoolId);
            } else if (stageId) {
                // Filter by stage_id on the joined classes table
                query = query.eq('classes.stage_id', stageId).eq('school_id', schoolId);
            }

            // Sorting: Boys ('ذكر') first (Descending because 'ذ' > 'أ'), then Alphabetical
            const { data, error } = await query
                .order('gender', { ascending: false })
                .order('full_name_ar', { ascending: true });

            if (error) throw error;

            const formattedData = (data || []).map((student: any) => ({
                ...student,
                classes: Array.isArray(student.classes) ? student.classes[0] : student.classes,
            }));

            // Handle nested stages if needed, but usually classes[0] is enough if it contains stages
            // If stages inside classes is also an array:
            if (formattedData.length > 0 && formattedData[0].classes && Array.isArray(formattedData[0].classes.stages)) {
                formattedData.forEach((s: any) => {
                    if (s.classes) {
                        s.classes.stages = s.classes.stages[0];
                    }
                });
            }

            setStudents(formattedData as BatchStudent[]);
        } catch (err) {
            console.error('Error fetching batch students:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch students');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (schoolId) fetchStudents();
    }, [classId, stageId, schoolId]);

    return { students, isLoading, error, refetch: fetchStudents };
}
