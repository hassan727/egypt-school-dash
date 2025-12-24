import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TeacherNameLink } from "@/components/TeacherProfile/TeacherNameLink";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Filter,
  Printer,
  Download,
  Trash2,
  Loader2,
  MessageSquare
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { TeacherListItem } from '@/types/teacher';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const TeachersList = () => {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('full_name_ar', { ascending: true });

      if (error) throw error;

      const formattedTeachers: TeacherListItem[] = (data || []).map((t: any) => ({
        teacherId: t.teacher_id,
        fullNameAr: t.full_name_ar,
        phone: t.phone,
        email: t.email,
        department: t.department,
        jobTitle: t.job_title,
        specialization: t.specialization,
        employmentStatus: t.employment_status,
        hireDate: t.hire_date,
        profileLink: `/teacher/${t.teacher_id}/dashboard`
      }));

      setTeachers(formattedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('فشل في تحميل قائمة المعلمين');
    } finally {
      setLoading(false);
    }
  };

  // فلترة المعلمين
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = searchQuery === '' ||
      teacher.fullNameAr.includes(searchQuery) ||
      teacher.teacherId.includes(searchQuery) ||
      teacher.phone?.includes(searchQuery);
    const matchesDepartment = departmentFilter === 'all' || teacher.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // الحصول على الأقسام الموجودة
  const departments = [...new Set(teachers.map(t => t.department).filter(Boolean))];

  // Toggle functions
  const toggleSelectAll = () => {
    if (selectedTeacherIds.size === filteredTeachers.length) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(filteredTeachers.map(t => t.teacherId)));
    }
  };

  const toggleSelectTeacher = (id: string) => {
    const newSet = new Set(selectedTeacherIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTeacherIds(newSet);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTeachers.map(t => ({
      'الاسم': t.fullNameAr,
      'الرقم الوظيفي': t.teacherId,
      'الهاتف': t.phone || '-',
      'البريد': t.email || '-',
      'القسم': t.department || '-',
      'التخصص': t.specialization || '-',
      'الحالة': t.employmentStatus,
      'تاريخ التعيين': t.hireDate || '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, "teachers_list.xlsx");
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedTeacherIds.size === 0) return;

    if (!window.confirm(`هل أنت متأكد من حذف ${selectedTeacherIds.size} معلم؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('teachers')
        .delete()
        .in('teacher_id', Array.from(selectedTeacherIds));

      if (error) throw error;

      toast.success(`تم حذف ${selectedTeacherIds.size} معلم بنجاح`);
      setSelectedTeacherIds(new Set());
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teachers:', error);
      toast.error('حدث خطأ أثناء حذف المعلمين');
    } finally {
      setIsDeleting(false);
    }
  };

  // WhatsApp
  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <DashboardLayout>
      <PageLayout
        title="قائمة المعلمين"
        description={`إدارة بيانات المعلمين وملفاتهم الشخصية (يتم عرض ${filteredTeachers.length} من إجمالي ${teachers.length} معلم)`}
      >
        <div className="space-y-6 relative pb-20">
          {/* شريط الأدوات */}
          <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center mb-4">
              <div className="flex flex-wrap gap-3 flex-1">
                {/* البحث */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="بحث بالاسم أو الرقم الوظيفي..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>

                {/* فلتر القسم */}
                <div className="w-40">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="border rounded-lg p-2 text-sm w-full h-10"
                  >
                    <option value="all">جميع الأقسام</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Link to="/teachers/new">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    تسجيل معلم جديد
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي المعلمين</p>
              <p className="text-2xl font-bold text-blue-800">{teachers.length}</p>
            </Card>
            <Card className="p-4 bg-green-50 border-green-100 text-center">
              <p className="text-xs text-green-600 font-medium mb-1">نشط</p>
              <p className="text-2xl font-bold text-green-800">
                {teachers.filter(t => t.employmentStatus === 'نشط').length}
              </p>
            </Card>
            <Card className="p-4 bg-yellow-50 border-yellow-100 text-center">
              <p className="text-xs text-yellow-600 font-medium mb-1">في إجازة</p>
              <p className="text-2xl font-bold text-yellow-800">
                {teachers.filter(t => t.employmentStatus === 'إجازة').length}
              </p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-100 text-center">
              <p className="text-xs text-purple-600 font-medium mb-1">الأقسام</p>
              <p className="text-2xl font-bold text-purple-800">{departments.length}</p>
            </Card>
          </div>

          {/* جدول المعلمين */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">جاري تحميل البيانات...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">لا توجد بيانات للعرض</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-3 text-right border border-blue-200 w-12">
                        <Checkbox
                          checked={selectedTeacherIds.size === filteredTeachers.length && filteredTeachers.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                        />
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">اسم المعلم</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الاتصال</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">القسم</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">التخصص</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الحالة</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">تاريخ التعيين</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.teacherId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 border border-gray-200">
                          <Checkbox
                            checked={selectedTeacherIds.has(teacher.teacherId)}
                            onCheckedChange={() => toggleSelectTeacher(teacher.teacherId)}
                          />
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                              {teacher.fullNameAr.charAt(0)}
                            </div>
                            <div>
                              <TeacherNameLink
                                teacherId={teacher.teacherId}
                                teacherName={teacher.fullNameAr}
                                className="font-bold text-blue-700 hover:underline text-base"
                              />
                              <p className="text-xs text-gray-500">{teacher.teacherId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <div className="space-y-1">
                            {teacher.phone && (
                              <p className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {teacher.phone}
                              </p>
                            )}
                            {teacher.email && (
                              <p className="flex items-center gap-1 text-sm text-blue-600 truncate max-w-[200px]">
                                <Mail className="h-3 w-3" />
                                {teacher.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm border border-gray-200 font-medium">
                          {teacher.department || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm border border-gray-200 font-medium">
                          {teacher.specialization || '-'}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${teacher.employmentStatus === 'نشط' ? 'bg-green-100 text-green-800 border border-green-200' :
                              teacher.employmentStatus === 'إجازة' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            {teacher.employmentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                          {teacher.hireDate || '-'}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <div className="flex items-center gap-1">
                            {teacher.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleWhatsApp(teacher.phone!)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm('هل أنت متأكد من الحذف؟')) {
                                  try {
                                    const { error } = await supabase
                                      .from('teachers')
                                      .delete()
                                      .eq('teacher_id', teacher.teacherId);
                                    if (error) throw error;
                                    toast.success('تم حذف المعلم بنجاح');
                                    fetchTeachers();
                                  } catch (err) {
                                    toast.error('فشل في حذف المعلم');
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Floating Selection Bar */}
          {selectedTeacherIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{selectedTeacherIds.size}</span>
                <span className="text-sm font-medium">معلم محدد</span>
              </div>
              <div className="h-4 w-px bg-white/20 mx-2"></div>

              <Button
                size="sm"
                variant="destructive"
                className="h-8 bg-red-600 hover:bg-red-700 text-white border-none"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trash2 className="w-4 h-4 ml-2" />}
                حذف المحدد
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs hover:bg-white/20 text-white hover:text-white"
                onClick={() => setSelectedTeacherIds(new Set())}
              >
                إلغاء
              </Button>
            </div>
          )}
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default TeachersList;
