export interface GradingCategory {
    id: string;
    name_ar: string;
    max_score: number;
    display_order: number;
    is_active: boolean;
}

export interface AcademicWeek {
    id: string;
    week_number: number;
    academic_year_id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export interface StudentWeeklyGrade {
    id: string;
    student_id: string;
    subject_id: string;
    week_id: string;
    category_id: string;
    score: number;
    entered_by?: string;
    entered_at?: string;
    updated_at?: string;
}

export interface StudentCategoryAverage {
    id: string;
    student_id: string;
    subject_id: string;
    category_id: string;
    average_score: number;
    weeks_counted: number;
    last_updated: string;
}

export interface StudentTotalAverage {
    id: string;
    student_id: string;
    subject_id: string;
    total_average: number;
    last_updated: string;
}

export interface GradeGridData {
    student_id: string;
    student_name: string;
    grades: {
        [categoryId: string]: number | null; // categoryId -> score
    };
    total?: number;
}
