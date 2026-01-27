import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useSystem } from './SystemContext';

interface GlobalFilterContextType {
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    selectedStage: string;
    setSelectedStage: (stage: string) => void;
    selectedClass: string;
    setSelectedClass: (cls: string) => void;
    academicYears: any[];
    stagesClasses: any[];
    loading: boolean;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export const GlobalFilterProvider = ({ children }: { children: ReactNode }) => {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [stagesClasses, setStagesClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { identity, setAcademicYear: setSystemYear } = useSystem();
    const schoolId = identity.school?.id;

    // Sync selected year to SystemContext
    useEffect(() => {
        if (selectedYear) {
            setSystemYear(selectedYear);
        }
    }, [selectedYear, setSystemYear]);

    useEffect(() => {
        const fetchFilterData = async () => {
            if (!schoolId) {
                setAcademicYears([]);
                setStagesClasses([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Fetch Years
                const { data: years } = await supabase
                    .from('academic_years')
                    .select('*')
                    .eq('school_id', schoolId)
                    .order('year_code', { ascending: true });

                if (years && years.length > 0) {
                    setAcademicYears(years);
                    // Set default year to active one or first one
                    const activeYear = years.find((y: any) => y.is_active);
                    const defaultYear = activeYear ? activeYear.year_code : years[0].year_code;
                    setSelectedYear(defaultYear);
                } else {
                    setAcademicYears([]);
                    setSelectedYear('');
                }

                // Fetch Stages & Classes (New Schema)
                // Filter classes by school_id via the join or direct column if available.
                // Assuming classes table has school_id.
                const { data: classesData, error } = await supabase
                    .from('classes')
                    .select('id, name, stage_id, stages(id, name)')
                    .eq('school_id', schoolId);

                if (error) {
                    console.error('Error fetching classes:', error);
                } else if (classesData) {
                    // Map to the structure expected by the app (plus IDs)
                    const mappedData = classesData.map((cls: any) => ({
                        id: cls.id,
                        class_name: cls.name,
                        stage_name: cls.stages?.name,
                        stage_id: cls.stages?.id
                    }));
                    setStagesClasses(mappedData);
                } else {
                    setStagesClasses([]);
                }
            } catch (error) {
                console.error('Error fetching filter data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilterData();
    }, [schoolId]);

    // Reset class when stage changes
    useEffect(() => {
        setSelectedClass('all');
    }, [selectedStage]);

    return (
        <GlobalFilterContext.Provider
            value={{
                selectedYear,
                setSelectedYear,
                selectedStage,
                setSelectedStage,
                selectedClass,
                setSelectedClass,
                academicYears,
                stagesClasses,
                loading,
            }}
        >
            {children}
        </GlobalFilterContext.Provider>
    );
};

export const useGlobalFilter = () => {
    const context = useContext(GlobalFilterContext);
    if (context === undefined) {
        throw new Error('useGlobalFilter must be used within a GlobalFilterProvider');
    }
    return context;
};
