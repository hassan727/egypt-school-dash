import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DbStage {
    id: string;
    name: string;
}

export interface DbClass {
    id: string;
    name: string;
    stage_id: string;
}

export function useDatabaseStagesClasses() {
    const [stages, setStages] = useState<DbStage[]>([]);
    const [classes, setClasses] = useState<DbClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch Stages
                const { data: stagesData, error: stagesError } = await supabase
                    .from('stages')
                    .select('id, name')
                    .order('name');

                if (stagesError) throw stagesError;

                // Fetch Classes
                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('id, name, stage_id')
                    .order('name');

                if (classesError) throw classesError;

                setStages(stagesData || []);
                setClasses(classesData || []);
            } catch (err) {
                console.error('Error fetching stages/classes:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to get classes for a specific stage
    const getClassesByStage = (stageId: string) => {
        return classes.filter(c => c.stage_id === stageId);
    };

    return { stages, classes, getClassesByStage, loading, error };
}
