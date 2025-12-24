import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertTriangle, Calendar, User, TrendingDown } from 'lucide-react';
import type { BehavioralRecord } from '@/types/student';

const BehavioralHistory = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [behavioralRecords, setBehavioralRecords] = useState<BehavioralRecord[]>([]);
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

        // Get behavioral records
        const { data, error } = await supabase
          .from('behavioral_records')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBehavioralRecords(data || []);
      } catch (err) {
        console.error('Error fetching behavioral history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  const formatConductRating = (rating: string) => {
    const ratings: Record<string, { text: string; color: string }> = {
      'ممتاز': { text: 'ممتاز', color: 'bg-green-100 text-green-800' },
      'جيد جداً': { text: 'جيد جداً', color: 'bg-lime-100 text-lime-800' },
      'جيد': { text: 'جيد', color: 'bg-blue-100 text-blue-800' },
      'مقبول': { text: 'مقبول', color: 'bg-yellow-100 text-yellow-800' },
      'ضعيف': { text: 'ضعيف', color: 'bg-red-100 text-red-800' }
    };
    return ratings[rating] || { text: rating, color: 'bg-gray-100 text-gray-800' };
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
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                السجلات السلوكية
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
        {!loading && behavioralRecords.length === 0 && (
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات سلوكية</h3>
            <p className="text-gray-500">لم يتم تسجيل بيانات سلوكية لهذا الطالب</p>
          </Card>
        )}

        {/* Behavioral Records Summary */}
        {!loading && behavioralRecords.length > 0 && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">نسبة الحضور</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {behavioralRecords[0]?.attendanceRate || 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-yellow-50 border border-yellow-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">عدد الغيابات</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {behavioralRecords[0]?.absences || 0}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-orange-50 border border-orange-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">عدد التأخرات</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {behavioralRecords[0]?.tardiness || 0}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-purple-50 border border-purple-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">تقييم السلوك</p>
                  <p className="text-sm font-bold text-purple-900">
                    {behavioralRecords[0]?.conductRating || 'لم يتم التحديد'}
                  </p>
                </div>
              </Card>
            </div>

            {/* Detailed Records */}
            <div className="space-y-4">
              {behavioralRecords.map((record, index) => {
                const conductRating = formatConductRating(record.conductRating);
                return (
                  <Card key={record.id} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${record.conductRating === 'ممتاز' ? 'bg-green-100' : record.conductRating === 'ضعيف' ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <TrendingDown className={`h-5 w-5 ${record.conductRating === 'ممتاز' ? 'text-green-600' : record.conductRating === 'ضعيف' ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">السجل #{index + 1}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.created_at || new Date().toISOString())}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${conductRating.color}`}>
                        {conductRating.text}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">نسبة الحضور</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${record.attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{record.attendanceRate}%</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">مستوى المشاركة</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                            {record.participationLevel || 'لم يتم التحديد'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">الغيابات</h4>
                          <p className="text-sm font-semibold text-gray-900">{record.absences || 0}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">التأخرات</h4>
                          <p className="text-sm font-semibold text-gray-900">{record.tardiness || 0}</p>
                        </div>
                      </div>

                      {record.disciplinaryIssues && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <h4 className="text-sm font-medium text-red-900 mb-2">⚠️ مشاكل تأديبية</h4>
                          <p className="text-sm text-red-800">
                            {record.disciplinaryDetails || 'هناك مشاكل تأديبية لم تتم توثيق التفاصيل'}
                          </p>
                        </div>
                      )}

                      {record.classroomBehavior && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">السلوك داخل الفصل</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{record.classroomBehavior}</p>
                        </div>
                      )}

                      {record.socialInteraction && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">التفاعل الاجتماعي</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{record.socialInteraction}</p>
                        </div>
                      )}

                      {record.counselorNotes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">ملاحظات المرشد</h4>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md border border-blue-200">
                            {record.counselorNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BehavioralHistory;
