import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, BookOpen, AlertTriangle, Wallet, History, Calendar, Users, Heart, Phone } from 'lucide-react';

const StudentHistory = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select('full_name_ar')
          .eq('student_id', studentId)
          .single();

        if (error) throw error;
        if (data) {
          setStudentName(data.full_name_ar);
        }
      } catch (err) {
        console.error('Error fetching student:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  const historySections = [
    {
      id: 'personal',
      title: 'التاريخ الشخصي',
      description: 'جميع التعديلات على البيانات الشخصية للطالب',
      icon: User,
      path: `/students/${studentId}/history/personal-data`,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'enrollment',
      title: 'التاريخ التعليمي',
      description: 'جميع التعديلات على بيانات القيد والمرحلة',
      icon: BookOpen,
      path: `/students/${studentId}/history/enrollment-data`,
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 'guardian',
      title: 'تاريخ ولي الأمر',
      description: 'جميع التعديلات على بيانات ولي الأمر',
      icon: Users,
      path: `/students/${studentId}/history/guardian-data`,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      id: 'mother',
      title: 'تاريخ بيانات الأم',
      description: 'جميع التعديلات على بيانات الأم',
      icon: Heart,
      path: `/students/${studentId}/history/mother-data`,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      id: 'emergency',
      title: 'جهات الطوارئ',
      description: 'جميع جهات الاتصال في الطوارئ',
      icon: Phone,
      path: `/students/${studentId}/history/emergency-contacts`,
      color: 'bg-red-100 text-red-600',
    },
    {
      id: 'academic',
      title: 'التاريخ الأكاديمي',
      description: 'جميع التقييمات والأداء الأكاديمي للطالب',
      icon: BookOpen,
      path: `/students/${studentId}/history/academic-records`,
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 'behavioral',
      title: 'التاريخ السلوكي',
      description: 'جميع السجلات السلوكية والحوادث',
      icon: AlertTriangle,
      path: `/students/${studentId}/history/behavioral-records`,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      id: 'financial',
      title: 'التاريخ المالي',
      description: 'جميع المعاملات المالية والأقساط',
      icon: Wallet,
      path: `/students/${studentId}/history/financial-records`,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

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
                <History className="h-8 w-8 text-indigo-600" />
                تاريخ الطالب
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

        {/* History Sections */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historySections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.id} to={section.path}>
                  <Card className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-300 cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${section.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {section.description}
                        </p>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <span>عرض التفاصيل</span>
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Additional Info */}
        {!loading && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <History className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  تتبع شامل لجميع الأنشطة
                </h3>
                <p className="text-gray-700 text-sm">
                  هذه الصفحة توفر لك وصولاً سريعاً إلى جميع السجلات التاريخية للطالب، 
                  مما يسمح لك بمتابعة التطور والتحسينات على مر الزمن.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentHistory;