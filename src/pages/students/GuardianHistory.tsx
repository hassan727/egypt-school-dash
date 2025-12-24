import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, User, Users } from 'lucide-react';

interface AuditTrailRecord {
  id: string;
  change_type: string;
  changed_fields: {
    old: any;
    new: any;
  };
  changed_by: string;
  change_reason: string;
  created_at: string;
}

const GuardianHistory = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [auditRecords, setAuditRecords] = useState<AuditTrailRecord[]>([]);
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

        // Get guardian data audit trail
        const { data, error } = await supabase
          .from('student_audit_trail')
          .select('*')
          .eq('student_id', studentId)
          .eq('change_type', 'Guardian Data')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAuditRecords(data || []);
      } catch (err) {
        console.error('Error fetching guardian history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  const formatFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      'guardian_full_name': 'اسم ولي الأمر',
      'guardian_relationship': 'صلة القرابة',
      'guardian_national_id': 'الرقم القومي',
      'guardian_job': 'الوظيفة',
      'guardian_workplace': 'جهة العمل',
      'guardian_education_level': 'المؤهل الدراسي',
      'guardian_phone': 'رقم الهاتف',
      'guardian_email': 'البريد الإلكتروني',
      'guardian_address': 'العنوان',
      'guardian_marital_status': 'الحالة الاجتماعية',
      'has_legal_guardian': 'وجود وصي قانوني',
      'guardian_social_media': 'حسابات التواصل'
    };
    return fieldNames[field] || field;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
                <Users className="h-8 w-8 text-purple-600" />
                تاريخ بيانات ولي الأمر
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
            <p className="text-gray-500">جاري تحميل التاريخ...</p>
          </div>
        )}

        {/* No Records */}
        {!loading && auditRecords.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تعديلات سابقة</h3>
            <p className="text-gray-500">لم يتم إجراء أي تعديلات على بيانات ولي الأمر لهذا الطالب</p>
          </Card>
        )}

        {/* History Records */}
        {!loading && auditRecords.length > 0 && (
          <div className="space-y-6">
            {auditRecords.map((record) => (
              <Card key={record.id} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">تعديل بيانات ولي الأمر</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(record.created_at)} • بواسطة {record.changed_by}
                      </p>
                    </div>
                  </div>
                  {record.change_reason && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {record.change_reason}
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">التغييرات:</h4>
                  <div className="space-y-3">
                    {Object.keys(record.changed_fields.old || {}).map((field) => {
                      const oldValue = record.changed_fields.old[field];
                      const newValue = record.changed_fields.new[field];
                      
                      // Only show changed fields
                      if (oldValue === newValue) return null;
                      
                      return (
                        <div key={field} className="flex items-start gap-4 p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatFieldName(field)}
                            </div>
                            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">القيمة السابقة</div>
                                <div className="text-sm p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                  {oldValue !== null && oldValue !== undefined ? oldValue.toString() : 'فارغ'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">القيمة الجديدة</div>
                                <div className="text-sm p-2 bg-green-50 border border-green-200 rounded text-green-800">
                                  {newValue !== null && newValue !== undefined ? newValue.toString() : 'فارغ'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GuardianHistory;