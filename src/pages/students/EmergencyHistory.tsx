import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, User, Phone } from 'lucide-react';

interface EmergencyContact {
  id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  address: string;
  created_at: string;
}

const EmergencyHistory = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
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

        // Get emergency contacts
        const { data, error } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEmergencyContacts(data || []);
      } catch (err) {
        console.error('Error fetching emergency contacts history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

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
                <Phone className="h-8 w-8 text-red-600" />
                تاريخ جهات الاتصال في الطوارئ
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
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        )}

        {/* No Records */}
        {!loading && emergencyContacts.length === 0 && (
          <Card className="p-8 text-center">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد جهات اتصال</h3>
            <p className="text-gray-500">لم يتم تسجيل أي جهات اتصال في الطوارئ لهذا الطالب</p>
          </Card>
        )}

        {/* Emergency Contacts */}
        {!loading && emergencyContacts.length > 0 && (
          <div className="space-y-6">
            {emergencyContacts.map((contact) => (
              <Card key={contact.id} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Phone className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.contact_name}</h3>
                      <p className="text-sm text-gray-500">
                        {contact.relationship} • مسجلة في {formatDate(contact.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">رقم الهاتف:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{contact.phone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">العنوان:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{contact.address}</p>
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

export default EmergencyHistory;