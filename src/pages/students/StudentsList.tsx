import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from "@/components/PageLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentNameLink } from "@/components/StudentProfile/StudentNameLink";
import { Users, Search, Plus, Download, Zap, Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { usePagination } from '@/hooks/usePagination';

interface Student {
  id: string;
  student_id: string;
  full_name_ar: string;
  stage: string;
  class: string;
  created_at: string;
  profile_link: string;
  gender?: string;
  enrollment_type?: string;
  file_status?: string;
}

const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced search and filtering
  const {
    results: filteredStudents,
    searchByClass,
    searchByAcademicPerformance,
    searchByAttendance,
    quickSearch,
  } = useAdvancedSearch();

  // Fetch function for pagination
  const fetchStudents = useCallback(async (offset: number, limit: number) => {
    try {
      const { data, count, error: fetchError } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .order('full_name_ar')
        .range(offset, offset + limit - 1);

      if (fetchError) throw fetchError;

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }, []);

  // Pagination
  const {
    items: paginatedStudents,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    loading: paginationLoading,
  } = usePagination(fetchStudents, { initialPageSize: 10 });

  // Fetch students from Supabase
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .order('full_name_ar');

        if (fetchError) throw fetchError;

        setStudents(data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('فشل في تحميل قائمة الطلاب');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStudents();
  }, []);

  // Handle search with quick search function
  useEffect(() => {
    if (!searchTerm) {
      quickSearch('');
    } else {
      quickSearch(searchTerm);
    }
    goToPage(1);
  }, [searchTerm]);

  const handleAddStudent = () => {
    navigate('/students/create');
  };

  if (loading || paginationLoading) {
    return (
      <DashboardLayout>
        <PageLayout title="قائمة الطلاب" description="إدارة بيانات جميع الطلاب المسجلين">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        </PageLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageLayout title="قائمة الطلاب" description="إدارة بيانات جميع الطلاب المسجلين">
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Header with Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">إدارة الطلاب</h2>
                <p className="text-blue-100">إجمالي الطلاب: {totalItems}</p>
              </div>
              <Users className="h-12 w-12 text-blue-200 opacity-50" />
            </div>
          </div>

          {/* Search and Actions Bar */}
          <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث عن طالب بالاسم أو رقم الطالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 py-2 w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleAddStudent}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  إضافة طالب جديد
                </Button>
                <Button
                  onClick={() => navigate('/students/system-dashboard')}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Settings className="h-4 w-4" />
                  لوحة التحكم
                </Button>
                <Button
                  onClick={() => navigate('/students/batch-operations')}
                  variant="outline"
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  عمليات جماعية
                </Button>
                <Button
                  onClick={() => navigate('/students/data-portability')}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  تصدير/استيراد
                </Button>
                <Button
                  onClick={() => navigate('/students/advanced-search')}
                  variant="outline"
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  بحث متقدم
                </Button>
              </div>
            </div>
          </Card>

          {/* Students Table */}
          {paginatedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold">
                {searchTerm ? 'لم يتم العثور على طلاب' : 'لا توجد بيانات طلاب'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchTerm
                  ? 'حاول تعديل معايير البحث'
                  : 'ابدأ بإضافة طالب جديد إلى النظام'}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddStudent} className="mt-4">
                  إضافة طالب جديد
                </Button>
              )}
            </div>
          ) : (
            <>
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          اسم الطالب
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          الرقم الأكاديمي
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          المرحلة
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          الفصل
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          تاريخ الإضافة
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StudentNameLink
                              studentId={student.student_id}
                              studentName={student.full_name_ar}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {student.student_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {student.stage}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {student.class}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(student.created_at).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Card className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      عرض {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalItems)} من {totalItems} طالب
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <ChevronRight className="h-4 w-4" />
                        السابق
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        {totalPages > 5 && <span className="px-2 py-1 text-gray-500">...</span>}
                      </div>

                      <Button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default StudentsList;