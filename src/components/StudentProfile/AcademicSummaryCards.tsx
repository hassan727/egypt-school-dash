import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AcademicData {
  currentGPA: number;
  averageMarks: number;
  passingStatus: string;
}

interface AcademicSummaryCardsProps {
  studentId: string;
}

export function AcademicSummaryCards({ studentId }: AcademicSummaryCardsProps) {
  const [academicData, setAcademicData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('academic_records')
          .select('current_gpa, average_marks, passing_status')
          .eq('student_id', studentId)
          .single();

        if (error) throw error;

        if (data) {
          setAcademicData({
            currentGPA: data.current_gpa || 0,
            averageMarks: data.average_marks || 0,
            passingStatus: data.passing_status || 'غير محدد'
          });
        }
      } catch (error) {
        console.error('Error fetching academic data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAcademicData();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-card text-card-foreground shadow-sm p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow animate-pulse">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">المعدل التراكمي</p>
              <p className="text-3xl font-bold text-green-600">جاري التحميل...</p>
              <p className="text-xs text-gray-500 mt-1">0 مادة</p>
            </div>
            <div className="h-8 w-8 bg-green-200 rounded-full"></div>
          </div>
        </div>
        <div className="rounded-lg bg-card text-card-foreground shadow-sm p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow animate-pulse">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">متوسط الدرجات</p>
              <p className="text-3xl font-bold text-blue-600">جاري التحميل...</p>
              <p className="text-xs text-gray-500 mt-1">من 100</p>
            </div>
            <div className="h-8 w-8 bg-blue-200 rounded-full"></div>
          </div>
        </div>
        <div className="rounded-lg bg-card text-card-foreground shadow-sm p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow animate-pulse">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">حالة النجاح</p>
              <p className="text-3xl font-bold text-red-600">جاري التحميل...</p>
              <p className="text-xs text-gray-500 mt-1">الفصل الحالي</p>
            </div>
            <div className="h-8 w-8 bg-purple-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const gpa = academicData?.currentGPA?.toFixed(2) || '0.00';
  const average = academicData?.averageMarks?.toFixed(1) || '0.0';
  const status = academicData?.passingStatus || 'غير محدد';

  // Determine status color
  const getStatusColor = (status: string) => {
    if (status === 'ناجح') return 'text-green-600';
    if (status === 'راسب') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">المعدل التراكمي</p>
            <p className="text-3xl font-bold text-green-600">{gpa}</p>
            <p className="text-xs text-gray-500 mt-1">0 مادة</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up h-8 w-8 text-green-400">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
      </div>
      <div className="rounded-lg bg-card text-card-foreground shadow-sm p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">متوسط الدرجات</p>
            <p className="text-3xl font-bold text-blue-600">{average}</p>
            <p className="text-xs text-gray-500 mt-1">من 100</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-column h-8 w-8 text-blue-400">
            <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
            <path d="M18 17V9"></path>
            <path d="M13 17V5"></path>
            <path d="M8 17v-3"></path>
          </svg>
        </div>
      </div>
      <div className="rounded-lg bg-card text-card-foreground shadow-sm p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">حالة النجاح</p>
            <p className={`text-3xl font-bold ${getStatusColor(status)}`}>{status}</p>
            <p className="text-xs text-gray-500 mt-1">الفصل الحالي</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award h-8 w-8 text-purple-400">
            <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
            <circle cx="12" cy="8" r="6"></circle>
          </svg>
        </div>
      </div>
    </div>
  );
}