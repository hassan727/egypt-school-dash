export interface StageClass {
    id: string;
    stage_name: string;
    class_name: string;
    created_at?: string;
}

export interface AcademicYear {
    id: string;
    year_code: string;
    year_name_ar: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
}
