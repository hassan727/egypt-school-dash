import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BookOpen, Calendar, TrendingUp } from 'lucide-react';

interface AcademicRecord {
  id: string;
  current_gpa: number;
  total_marks: number;
  average_marks: number;
  passing_status: string;
  academic_notes: string;
  strengths: string;
  weaknesses: string;
  last_exam_date: string;
  created_at: string;
}

const AcademicHistory = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    if (!studentId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Get student name
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('full_name_ar')
          .eq('student_id', studentId)
          .single();

        if (studentData && !studentError) {
          setStudentName(studentData.full_name_ar);
        }

        // Get academic records
        const { data, error } = await supabase
          .from('academic_records')
          .select('*')
          .eq('student_id', studentId)
          .order('last_exam_date', { ascending: false });

        if (error) throw error;
        setAcademicRecords(data || []);
      } catch (err) {
        console.error('Error fetching academic history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  const formatPassingStatus = (status: string) => {
    const statuses: Record<string, { text: string; color: string }> = {
      'ناجح': { text: 'ناجح', color: 'bg-green-100 text-green-800' },
      'راسب': { text: 'راسب', color: 'bg-red-100 text-red-800' },
      'معلق': { text: 'معلق', color: 'bg-yellow-100 text-yellow-800' }
    };
    return statuses[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!studentId) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                السجلات الأكاديمية
              </h1>
              {studentName && (
                <p className="text-gray-600 mt-1">
                  الطالب: <span className="font-semibold">{studentName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <p className="text-gray-500">جاري تحميل السجلات...</p>
          </div>
        )}

        {/* No Records */}
        {!loading && academicRecords.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات أكاديمية</h3>
            <p className="text-gray-500">لم يتم تسجيل أي تقييمات أكاديمية لهذا الطالب</p>
          </Card>
        )}

        {/* Academic Records */}
        {!loading && academicRecords.length > 0 && (
          <div className="space-y-6">
            {academicRecords.map((record) => {
              const status = formatPassingStatus(record.passing_status);
              return (
                <Card key={record.id} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">التقييم الأكاديمي</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(record.last_exam_date)} • GPA: {record.current_gpa}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">إجمالي الدرجات</div>
                      <div className="text-lg font-semibold text-gray-900">{record.total_marks}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">المتوسط</div>
                      <div className="text-lg font-semibold text-gray-900">{record.average_marks}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">GPA</div>
                      <div className="text-lg font-semibold text-gray-900">{record.current_gpa}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    {record.strengths && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          نقاط القوة
                        </h4>
                        <p className="text-gray-700 bg-green-50 p-3 rounded-md">{record.strengths}</p>
                      </div>
                    )}

                    {record.weaknesses && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          نقاط الضعف
                        </h4>
                        <p className="text-gray-700 bg-red-50 p-3 rounded-md">{record.weaknesses}</p>
                      </div>
                    )}

                    {record.academic_notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">ملاحظات أكاديمية</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{record.academic_notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      تاريخ التسجيل: {formatDate(record.created_at)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AcademicHistory;