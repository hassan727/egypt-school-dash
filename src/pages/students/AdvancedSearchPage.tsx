import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentNameLink } from '@/components/StudentProfile/StudentNameLink';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { Search, ArrowLeft, Filter, Download } from 'lucide-react';

interface Student {
    id: string;
    student_id: string;
    full_name_ar: string;
    stage: string;
    class: string;
    gender?: string;
    enrollment_type?: string;
    file_status?: string;
    created_at: string;
}

export default function AdvancedSearchPage() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // Filter states
    const [filters, setFilters] = useState({
        searchTerm: '',
        stage: '',
        class: '',
        gender: '',
        enrollmentType: '',
        fileStatus: '',
    });

    const { results, quickSearch, searchByClass } = useAdvancedSearch();

    // Calculate pagination manually
    const paginatedResults = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return results.slice(startIndex, startIndex + pageSize);
    }, [results, currentPage, pageSize]);

    const totalPages = Math.ceil(results.length / pageSize);

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Fetch students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data } = await supabase.from('students').select('*').order('full_name_ar');
                setStudents(data || []);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    // Apply filters
    useEffect(() => {
        if (filters.searchTerm) {
            quickSearch(filters.searchTerm);
        } else if (filters.stage || filters.class) {
            searchByClass(filters.stage, filters.class);
        } else {
            quickSearch('');
        }
        setCurrentPage(1);
    }, [filters]);

    const handleExportResults = () => {
        const csv = [
            ['اسم الطالب', 'رقم الطالب', 'المرحلة', 'الفصل', 'النوع', 'نوع القيد', 'حالة الملف'],
            ...results.map(s => [
                s.full_name_ar,
                s.student_id,
                s.stage,
                s.class,
                s.gender || '-',
                s.enrollment_type || '-',
                s.file_status || '-',
            ]),
        ]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `student_search_results_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <DashboardLayout>
            <PageLayout title="البحث المتقدم" description="بحث متقدم وفلترة متعددة المعايير">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Search className="h-6 w-6 text-purple-600" />
                                البحث المتقدم والفلترة
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">ابحث عن طلاب باستخدام معايير متعددة</p>
                        </div>
                        <Button
                            onClick={() => navigate('/students')}
                            variant="outline"
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            عودة
                        </Button>
                    </div>

                    {/* Search and Filters Card */}
                    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg shadow-md">
                        <div className="space-y-4">
                            {/* Main Search */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">🔍 البحث العام</label>
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="ابحث بالاسم أو رقم الطالب..."
                                        value={filters.searchTerm}
                                        onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                        className="pr-10"
                                    />
                                </div>
                            </div>

                            {/* Filters Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Stage Filter */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">📚 المرحلة</label>
                                    <select
                                        value={filters.stage}
                                        onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">جميع المراحل</option>
                                        <option value="الابتدائية">الابتدائية</option>
                                        <option value="الإعدادية">الإعدادية</option>
                                        <option value="الثانوية">الثانوية</option>
                                    </select>
                                </div>

                                {/* Class Filter */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">🎓 الفصل</label>
                                    <select
                                        value={filters.class}
                                        onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">جميع الفصول</option>
                                        <option value="الأول">الأول</option>
                                        <option value="الثاني">الثاني</option>
                                        <option value="الثالث">الثالث</option>
                                        <option value="الرابع">الرابع</option>
                                        <option value="الخامس">الخامس</option>
                                        <option value="السادس">السادس</option>
                                    </select>
                                </div>

                                {/* Gender Filter */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">👤 النوع</label>
                                    <select
                                        value={filters.gender}
                                        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">الكل</option>
                                        <option value="ذكر">ذكر</option>
                                        <option value="أنثى">أنثى</option>
                                    </select>
                                </div>

                                {/* Enrollment Type Filter */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">📋 نوع القيد</label>
                                    <select
                                        value={filters.enrollmentType}
                                        onChange={(e) => setFilters({ ...filters, enrollmentType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">الكل</option>
                                        <option value="جديد">جديد</option>
                                        <option value="منتقل">منتقل</option>
                                        <option value="مستمر">مستمر</option>
                                    </select>
                                </div>

                                {/* File Status Filter */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">📁 حالة الملف</label>
                                    <select
                                        value={filters.fileStatus}
                                        onChange={(e) => setFilters({ ...filters, fileStatus: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">الكل</option>
                                        <option value="مكتمل">مكتمل</option>
                                        <option value="ناقص">ناقص</option>
                                        <option value="قيد المراجعة">قيد المراجعة</option>
                                    </select>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="flex items-end">
                                    <Button
                                        onClick={() =>
                                            setFilters({
                                                searchTerm: '',
                                                stage: '',
                                                class: '',
                                                gender: '',
                                                enrollmentType: '',
                                                fileStatus: '',
                                            })
                                        }
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <Filter className="h-4 w-4" />
                                        مسح الفلاتر
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Results Summary */}
                    <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-blue-900">
                                <span className="font-semibold">نتائج البحث:</span> {results.length} طالب
                                {Object.values(filters).some(v => v) && <span className="text-xs text-blue-700 mr-2">(من إجمالي 100 طالب)</span>}
                            </div>
                            {results.length > 0 && (
                                <Button
                                    onClick={handleExportResults}
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    تصدير النتائج
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Results Table */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">جاري تحميل البيانات...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <Card className="p-12 text-center bg-white border border-gray-200 rounded-lg">
                            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600 font-semibold mb-2">لم يتم العثور على نتائج</p>
                            <p className="text-sm text-gray-500">جرب تعديل معايير البحث أو الفلاتر</p>
                        </Card>
                    ) : (
                        <>
                            <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                                            <tr>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">الاسم</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">الرقم</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">المرحلة</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">الفصل</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">النوع</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {paginatedResults.map((student) => (
                                                <tr key={student.id} className="hover:bg-purple-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <StudentNameLink
                                                            studentId={student.student_id}
                                                            studentName={student.full_name_ar}
                                                            className="text-sm font-medium text-purple-600 hover:text-purple-800"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{student.student_id}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {student.stage}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {student.class}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{student.gender || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${student.file_status === 'مكتمل'
                                                                ? 'bg-green-100 text-green-800'
                                                                : student.file_status === 'ناقص'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {student.file_status || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Card className="p-4 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">الصفحة {currentPage} من {totalPages}</span>
                                        <div className="flex gap-2">
                                            <Button onClick={prevPage} disabled={currentPage === 1} variant="outline" size="sm">
                                                السابق
                                            </Button>
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <Button
                                                    key={i + 1}
                                                    onClick={() => goToPage(i + 1)}
                                                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {i + 1}
                                                </Button>
                                            ))}
                                            <Button onClick={nextPage} disabled={currentPage === totalPages} variant="outline" size="sm">
                                                التالي
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
}