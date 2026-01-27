/**
 * أنواع البيانات لنظام الجداول الذكي (aSc Timetables Logic)
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0: Sunday, 1: Monday, etc.

export interface TimeSlot {
    id: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    isBreak: boolean;
    breakName?: string;
}

export interface Subject {
    id: string;
    nameAr: string;
    shortNameAr?: string;
    color: string;
    requiredRoomType?: string;
}

export interface Teacher {
    id: string;
    nameAr: string;
    shortNameAr?: string;
    color?: string;
    maxPeriodsPerWeek?: number;
    daysOff?: DayOfWeek[];
}

export interface TeacherLoad {
    teacherId: string;
    subjectId: string;
    classId: string;
    periodsPerWeek: number;
    isDouble?: boolean; 
    classroomId?: string;
}

export interface TimetableCard {
    id: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    subjectNameAr: string;
    teacherNameAr: string;
    classNameAr: string;
    color?: string;
    isPlaced: boolean;
    dayOfWeek?: DayOfWeek;
    periodId?: string;
}

export interface TimetableConstraint {
    type: 'teacher_conflict' | 'class_conflict' | 'room_conflict' | 'max_periods_per_day';
    severity: 'error' | 'warning';
    message: string;
}

export interface BreakConfig {
    id: string;
    afterPeriod: number;
    durationMinutes: number;
    nameAr: string;
}

export interface StageSettings {
    stageId: string;
    stageNameAr: string;
    periodsPerDay: number;
    startTime: string;
    periodDuration: number;
    breaks: BreakConfig[];
}

export interface TimetableSettings {
    workingDays: DayOfWeek[];
    stages: StageSettings[];
}

export interface Classroom {
    id: string;
    nameAr: string;
    capacity: number;
    type: 'general' | 'lab' | 'sport' | 'computer';
    building?: string;
}

export interface SchoolClass {
    id: string;
    nameAr: string;
    stageId?: string;
    classTeacherId?: string;
    studentCount?: number;
}

export interface SmartTimetableState {
    cards: TimetableCard[];
    loads: TeacherLoad[];
    periods: TimeSlot[];
    selectedClassId?: string;
    selectedTeacherId?: string;
    viewMode: 'class' | 'teacher' | 'room';
}
