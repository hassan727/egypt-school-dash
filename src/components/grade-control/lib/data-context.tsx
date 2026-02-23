
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  EducationalStage,
  Class,
  Subject,
  Student,
  GradingCategory,
  StudentGrade,
  StudentCategoryAverage,
  StudentTotalAverage,
  AcademicWeek,
} from './types';

interface DataContextType {
  stages: EducationalStage[];
  subjects: Subject[];
  weeks: AcademicWeek[];
  categories: GradingCategory[];
  selectedStage: string | null;
  selectedClass: string | null;
  selectedSubject: string | null;
  selectedWeek: string | null;
  setSelectedStage: (stageId: string | null) => void;
  setSelectedClass: (classId: string | null) => void;
  setSelectedSubject: (subjectId: string | null) => void;
  setSelectedWeek: (weekId: string | null) => void;
  getClassesByStage: (stageId: string) => Class[];
  getStudentsByClass: (classId: string) => Student[];
  getGradesByWeekAndSubject: (weekId: string, subjectId: string, classId: string) => StudentGrade[];
  getCategoryAverages: (studentId: string, subjectId: string) => StudentCategoryAverage[];
  getTotalAverage: (studentId: string, subjectId: string) => StudentTotalAverage | null;
  updateGrade: (grade: StudentGrade) => void;
  saveGrades: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [stages, setStages] = useState<EducationalStage[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weeks, setWeeks] = useState<AcademicWeek[]>([]);
  const [categories, setCategories] = useState<GradingCategory[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const [gradesData, setGradesData] = useState<StudentGrade[]>([]);
  const [categoryAverage, setCategoryAverages] = useState<StudentCategoryAverage[]>([]);
  const [totalAverage, setTotalAverages] = useState<StudentTotalAverage[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Basic Data from Main System
      const { data: stagesData } = await supabase.from('stages').select('*');
      const { data: classesData } = await supabase.from('classes').select('*');
      const { data: subjectsData } = await supabase.from('subjects').select('*');
      const { data: studentsData } = await supabase.from('students').select('*');
      
      // 2. Fetch Control System Data
      const { data: weeksData } = await supabase.from('academic_weeks').select('*').order('week_number');
      const { data: catsData } = await supabase.from('grading_categories').select('*').order('display_order');
      const { data: grades } = await supabase.from('student_weekly_grades').select('*');
      const { data: catAvgs } = await supabase.from('student_category_averages').select('*');

      if (stagesData) setStages(stagesData.map(s => ({ id: s.id, name: s.name, order: 0 })));
      if (classesData) setAllClasses(classesData.map(c => ({ id: c.id, stageId: c.stage_id, name: c.name, gradeLevel: 0 })));
      if (subjectsData) setSubjects(subjectsData.map(s => ({ id: s.id, name: s.subject_name_ar, code: s.subject_code })));
      if (studentsData) setAllStudents(studentsData.map(s => ({ 
        id: s.student_id, 
        name: s.full_name, 
        studentNumber: s.student_id, 
        classId: s.class_id, 
        academicYear: s.academic_year_id || '',
        status: s.status || 'active'
      })));
      
      if (weeksData) setWeeks(weeksData);
      if (catsData) setCategories(catsData.map(c => ({ id: c.id, name: c.name_ar, maxScore: c.max_score, order: c.display_order })));
      if (grades) setGradesData(grades.map(g => ({
        id: g.id,
        studentId: g.student_id,
        subjectId: g.subject_id,
        weekId: g.week_id,
        categoryId: g.category_id,
        score: g.score,
        enteredBy: g.entered_by,
        enteredAt: g.entered_at
      })));
      if (catAvgs) setCategoryAverages(catAvgs.map(a => ({
        id: a.id,
        studentId: a.student_id,
        subjectId: a.subject_id,
        categoryId: a.category_id,
        averageScore: Number(a.average_score),
        weeksCounted: a.weeks_counted,
        lastUpdated: a.last_updated
      })));

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات من قاعدة البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getClassesByStage = useCallback((stageId: string) => {
    return allClasses.filter((c) => c.stageId === stageId);
  }, [allClasses]);

  const getStudentsByClass = useCallback((classId: string) => {
    return allStudents.filter((s) => s.classId === classId);
  }, [allStudents]);

  const getGradesByWeekAndSubject = useCallback(
    (weekId: string, subjectId: string, classId: string) => {
      const classStudents = getStudentsByClass(classId);
      const studentIds = classStudents.map((s) => s.id);
      return gradesData.filter(
        (g) =>
          g.weekId === weekId &&
          g.subjectId === subjectId &&
          studentIds.includes(g.studentId)
      );
    },
    [gradesData, getStudentsByClass]
  );

  const getCategoryAverages = useCallback(
    (studentId: string, subjectId: string) => {
      return categoryAverage.filter(
        (avg) =>
          avg.studentId === studentId && avg.subjectId === subjectId
      );
    },
    [categoryAverage]
  );

  const getTotalAverage = useCallback(
    (studentId: string, subjectId: string) => {
      return (
        totalAverage.find(
          (avg) =>
            avg.studentId === studentId && avg.subjectId === subjectId
        ) || null
      );
    },
    [totalAverage]
  );

  const updateGrade = useCallback((grade: StudentGrade) => {
    setGradesData((prev) => {
      const index = prev.findIndex(
        (g) =>
          g.studentId === grade.studentId &&
          g.weekId === grade.weekId &&
          g.categoryId === grade.categoryId &&
          g.subjectId === grade.subjectId
      );

      if (index !== -1) {
        const newData = [...prev];
        newData[index] = grade;
        return newData;
      } else {
        return [...prev, grade];
      }
    });
  }, []);

  const saveGrades = useCallback(async () => {
    if (!selectedWeek || !selectedSubject) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const gradesToSave = gradesData.filter(g => g.weekId === selectedWeek && g.subjectId === selectedSubject);
      
      for (const grade of gradesToSave) {
        const { error: upsertError } = await supabase
          .from('student_weekly_grades')
          .upsert({
            student_id: grade.studentId,
            subject_id: grade.subjectId,
            week_id: grade.weekId,
            category_id: grade.categoryId,
            score: grade.score,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'student_id,subject_id,week_id,category_id'
          });
          
        if (upsertError) throw upsertError;
      }
      
      // Refresh averages after saving
      await fetchData();
    } catch (err) {
      console.error('Error saving grades:', err);
      setError('حدث خطأ أثناء حفظ الدرجات');
    } finally {
      setIsSaving(false);
    }
  }, [gradesData, selectedWeek, selectedSubject, fetchData]);

  return (
    <DataContext.Provider
      value={{
        stages,
        subjects,
        weeks,
        categories,
        selectedStage,
        selectedClass,
        selectedSubject,
        selectedWeek,
        setSelectedStage,
        setSelectedClass,
        setSelectedSubject,
        setSelectedWeek,
        getClassesByStage,
        getStudentsByClass,
        getGradesByWeekAndSubject,
        getCategoryAverages,
        getTotalAverage,
        updateGrade,
        saveGrades,
        isLoading,
        isSaving,
        error,
        refreshData: fetchData
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
