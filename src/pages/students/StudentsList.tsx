import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentNameLink } from "@/components/StudentProfile/StudentNameLink";
import { Users, Search, Plus, Download, Trash2, Printer, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImportStudentsModal } from '@/components/students/ImportStudentsModal';
import * as XLSX from 'xlsx';
import { StudentService } from '@/services/studentService';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { MessageModal } from '@/components/notifications/MessageModal';

interface Student {
  id: string;
  student_id: string;
  full_name_ar: string;
  class_id?: string;
  classes?: {
    name: string;
    stages?: {
      name: string;
    }
  };
  created_at: string;
  profile_link: string;
  gender?: string;
  religion?: string;
  enrollment_type?: string;
  file_status?: string;
  registration_status?: string;
  guardian_phone?: string;
  guardian_full_name?: string;
  stage?: string;
  class?: string;
}

const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [missingYearCount, setMissingYearCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    selectedYear,
    setSelectedYear,
    selectedStage,
    setSelectedStage,
    selectedClass,
    setSelectedClass,
    academicYears,
    stagesClasses
  } = useGlobalFilter();

  // Derived Filter Options
  const uniqueStages = useMemo(() => {
    const stages = new Set(stagesClasses.map(item => item.stage_name));
    return Array.from(stages);
  }, [stagesClasses]);

  const availableClasses = useMemo(() => {
    if (selectedStage === 'all') return [];
    return stagesClasses
      .filter(item => item.stage_name === selectedStage)
      .map(item => item.class_name);
  }, [stagesClasses, selectedStage]);

  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Fetch students from Supabase
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct Query with Joins
      // We use !inner to ensure we can filter by these related tables if needed
      let query = supabase
        .from('students')
        .select(`
          *,
          classes (
            name,
            stages (
              name
            )
          )
        `);

      // Apply Filters
      if (selectedYear && selectedYear !== 'all') {
        query = query.eq('academic_year', selectedYear);
      }

      // Filter by Stage Name
      if (selectedStage && selectedStage !== 'all') {
        // We need to filter by the joined stage name.
        // Note: Supabase filtering on nested tables requires the !inner hint in select if we want to filter out rows.
        // However, since we are doing client-side filtering for some things or complex joins, 
        // sometimes it's easier to fetch and filter if dataset is small, OR use the specific syntax.
        // Let's try the embedded filter syntax:
        // But 'classes.stages.name' doesn't work directly without !inner.
        // Let's use the IDs from stagesClasses context to be more precise if possible, 
        // but here we only have the name 'selectedStage'.

        // Strategy: Find the stage_id(s) for this name, then find class_ids, then filter students by class_id.
        const targetStageItems = stagesClasses.filter(s => s.stage_name === selectedStage);
        const targetClassIds = targetStageItems.map(s => s.id); // In our context, id is the class ID

        if (targetClassIds.length > 0) {
          query = query.in('class_id', targetClassIds);
        } else {
          // If no classes found for this stage (unlikely), return empty
          query = query.in('class_id', []);
        }
      }

      // Filter by Class Name
      if (selectedClass && selectedClass !== 'all') {
        const targetClass = stagesClasses.find(s => s.class_name === selectedClass && s.stage_name === selectedStage);
        if (targetClass) {
          query = query.eq('class_id', targetClass.id);
        }
      }

      const { data, error: fetchError } = await query;

      // Get accurate total count of ALL students in DB for user awareness
      const { count: totalDbCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      setTotalStudentsCount(totalDbCount || 0);

      // Check for data integrity issues (missing academic year)
      const { count: missingYearCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .is('academic_year', null);

      setMissingYearCount(missingYearCount || 0);

      if (fetchError) throw fetchError;

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('فشل في تحميل قائمة الطلاب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYear) {
      fetchStudents();
    }
  }, [selectedYear, selectedStage, selectedClass]);

  // Derived State: Sorted & Filtered Students
  const processedStudents = useMemo(() => {
    let result = [...students];

    // Search Filter
    if (searchTerm) {
      result = result.filter(s =>
        s.full_name_ar.includes(searchTerm) ||
        s.student_id.includes(searchTerm)
      );
    }

    // Sorting: Males (Alpha) -> Females (Alpha)
    result.sort((a, b) => {
      if (a.gender === b.gender) {
        return a.full_name_ar.localeCompare(b.full_name_ar, 'ar');
      }
      return a.gender === 'ذكر' ? -1 : 1;
    });

    return result;
  }, [students, searchTerm]);

  // Helper function to normalize Arabic text variations
  const normalizeArabic = (text: string | undefined | null): string => {
    if (!text) return '';
    return text
      .trim()
      .replace(/[أإآ]/g, 'ا') // Normalize Alef variations
      .replace(/[ى]/g, 'ي')    // Normalize Yaa variations (ى -> ي)
      .replace(/[ة]/g, 'ه')    // Normalize Taa Marbuta (ة -> ه)
      .toLowerCase();
  };

  // Stats - Calculate from ALL students (not filtered by search)
  const stats = useMemo(() => {
    return {
      total: students.length,
      males: students.filter(s => {
        const gender = normalizeArabic(s.gender);
        return gender === 'ذكر';
      }).length,
      females: students.filter(s => {
        const gender = normalizeArabic(s.gender);
        return gender === 'انثي' || gender === 'انثى';
      }).length,
      muslims: students.filter(s => {
        const religion = normalizeArabic(s.religion);
        return religion === 'مسلم' || religion === 'مسلمه';
      }).length,
      christians: students.filter(s => {
        const religion = normalizeArabic(s.religion);
        return religion === 'مسيحي' || religion === 'مسيحيه';
      }).length,
    };
  }, [students]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processedStudents.map(s => ({
      'الاسم': s.full_name_ar,
      'الرقم الأكاديمي': s.student_id,
      'المرحلة': s.classes?.stages?.name || s.stage || '-',
      'الفصل': s.classes?.name || s.class || '-',
      'النوع': s.gender,
      'الديانة': s.religion,
      'حالة التسجيل': s.registration_status === 'provisionally_registered' ? 'مسجل مبدئياً' : 'نشط'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_list.xlsx");
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === processedStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(processedStudents.map(s => s.id)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStudentIds(newSet);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedStudentIds.size === 0) return;

    if (!window.confirm(`هل أنت متأكد من حذف ${selectedStudentIds.size} طالب؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('students')
        .delete()
        .in('id', Array.from(selectedStudentIds));

      if (error) throw error;

      toast.success(`تم حذف ${selectedStudentIds.size} طالب بنجاح`);
      setSelectedStudentIds(new Set());
      fetchStudents();
    } catch (error) {
      console.error('Error deleting students:', error);
      toast.error('حدث خطأ أثناء حذف الطلاب');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddStudent = () => {
    navigate('/students/create');
  };

  return (
    <DashboardLayout>
      <PageLayout
        title="قائمة الطلاب"
        description={`إدارة قوائم الفصول والطلاب (يتم عرض ${processedStudents.length} من إجمالي ${totalStudentsCount} طالب)`}
      >
        <div className="space-y-6 relative pb-20">

          {/* Filters & Actions Bar */}
          <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center mb-4">
              <div className="flex flex-wrap gap-3 flex-1">
                {/* Academic Year */}
                <div className="w-40">
                  <label className="text-xs text-gray-500 mb-1 block">السنة الدراسية</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {academicYears.map(year => (
                        <SelectItem key={year.id} value={year.year_code}>
                          {year.year_code} {year.is_active && '(الحالية)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stage (Grade Level) */}
                <div className="w-40">
                  <label className="text-xs text-gray-500 mb-1 block">المرحلة (الصف)</label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {uniqueStages.map(stage => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class (Section) */}
                <div className="w-40">
                  <label className="text-xs text-gray-500 mb-1 block">الفصل (المجموعة)</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass} disabled={selectedStage === 'all'}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {availableClasses.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  تصدير Excel
                </Button>
                <ImportStudentsModal onSuccess={fetchStudents} />
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="بحث عن طالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button onClick={handleAddStudent} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 ml-2" />
                تسجيل طالب جديد
              </Button>
            </div>
          </Card>

          {/* Live Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي الطلبة</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </Card>
            <Card className="p-4 bg-blue-50 border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">الذكور</p>
              <p className="text-2xl font-bold text-blue-800">{stats.males}</p>
            </Card>
            <Card className="p-4 bg-pink-50 border-pink-100 text-center">
              <p className="text-xs text-pink-600 font-medium mb-1">الإناث</p>
              <p className="text-2xl font-bold text-pink-800">{stats.females}</p>
            </Card>
            <Card className="p-4 bg-green-50 border-green-100 text-center">
              <p className="text-xs text-green-600 font-medium mb-1">مسلم</p>
              <p className="text-2xl font-bold text-green-800">{stats.muslims}</p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-100 text-center">
              <p className="text-xs text-purple-600 font-medium mb-1">مسيحي</p>
              <p className="text-2xl font-bold text-purple-800">{stats.christians}</p>
            </Card>
          </div>

          {/* Data Integrity Warning */}
          {missingYearCount > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-md flex justify-between items-center shadow-sm">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  <span className="font-bold">تنبيه:</span> تم اكتشاف {missingYearCount} طالب بدون سنة دراسية محددة. هؤلاء الطلاب لن يظهروا في القوائم الافتراضية.
                </p>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  if (window.confirm(`هل تريد تعيين السنة الحالية (2025-2026) لـ ${missingYearCount} طالب؟`)) {
                    try {
                      setLoading(true);
                      const { error } = await supabase
                        .from('students')
                        .update({ academic_year: '2025-2026' })
                        .is('academic_year', null);

                      if (error) throw error;
                      toast.success('تم تصحيح بيانات الطلاب بنجاح');
                      fetchStudents();
                    } catch (err) {
                      toast.error('حدث خطأ أثناء التصحيح');
                      console.error(err);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white border-none shadow-none"
              >
                تصحـيح البيانات
              </Button>
            </div>
          )}

          {/* Students Table */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">جاري تحميل البيانات...</p>
              </div>
            ) : processedStudents.length === 0 ? (
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
                          checked={selectedStudentIds.size === processedStudents.length && processedStudents.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                        />
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">اسم الطالب</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">النوع</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الديانة</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">المرحلة / الفصل</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">الحالة</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-blue-900 border border-blue-200">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 border border-gray-200">
                          <Checkbox
                            checked={selectedStudentIds.has(student.id)}
                            onCheckedChange={() => toggleSelectStudent(student.id)}
                          />
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <StudentNameLink
                            studentId={student.student_id}
                            studentName={student.full_name_ar}
                            className="font-bold text-blue-700 hover:underline text-base"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm border border-gray-200 font-medium">{student.gender}</td>
                        <td className="px-4 py-3 text-sm border border-gray-200 font-medium">{student.religion}</td>
                        <td className="px-4 py-3 text-sm border border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{student.classes?.stages?.name || student.stage || '-'}</span>
                            <span className="text-gray-500 text-xs font-semibold">{student.classes?.name || student.class || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          {student.registration_status === 'provisionally_registered' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                              مسجل مبدئياً
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              نشط
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <div className="flex items-center gap-1">
                            <MessageModal
                              studentId={student.student_id}
                              studentName={student.full_name_ar}
                              parentPhone={student.guardian_phone || "20000000000"}
                              parentName={student.guardian_full_name}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm('هل أنت متأكد من الحذف؟')) {
                                  await StudentService.deleteStudent(student.student_id);
                                  fetchStudents();
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
          {selectedStudentIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{selectedStudentIds.size}</span>
                <span className="text-sm font-medium">طالب محدد</span>
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
                onClick={() => setSelectedStudentIds(new Set())}
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

export default StudentsList;