import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Student {
    student_id: string;
    full_name_ar: string;
    stage?: string;
    class_id?: string;
    gender?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
}

export function useStudentsList(limit: number = 1000) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: fetchError } = await supabase
                    .from('students')
                    .select('*')
                    .limit(limit);

                if (fetchError) throw fetchError;

                setStudents(data || []);
            } catch (err) {
                console.error('خطأ في جلب قائمة الطلاب:', err);
                setError(err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [limit]);

    return { students, loading, error };
}
