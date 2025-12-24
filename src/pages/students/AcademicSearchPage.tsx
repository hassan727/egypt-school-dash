import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, BookOpen, User, TrendingUp, Eye, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Grade } from '@/types/student';
import { SUBJECTS_LIST, ASSESSMENT_TYPES } from '@/data/studentConstants';

/**
 * صفحة البحث الأكاديمي المتقدم
 * تسمح بالبحث والتصفية في جميع البيانات الأكاديمية
 */
export default function AcademicSearchPage() {
    // حالة البحث والتصفية
    const [searchFilters, setSearchFilters] = useState({
        academicYear: 'all',
        semester: 'all',
        subject: 'all',
        assessmentType: 'all',
        dateFrom: '',
        dateTo: '',
        minGrade: '',
        maxGrade: '',
        studentName: '',
        showModifiedOnly: false,
    });

    const [searchResults, setSearchResults] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedResult, setSelectedResult] = useState<Grade | null>(null);

    // قوائم البيانات للتصفية
    const academicYears = ['2024-2025', '2025-2026', '2026-2027'];
    const semesters = ['الفصل الأول', 'الفصل الثاني'];

    // تنفيذ البحث
    const performSearch = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('grades')
                .select(`
                    *,
                    students:student_id (
                        full_name_ar,
                        student_id
                    ),
                    academic_years (
                        year_code
                    ),
                    semesters (
                        semester_code,
                        semester_name_ar
                    ),
                    subjects (
                        subject_name_ar,
                        subject_name_en
                    ),
                    assessment_types (
                        assessment_code,
                        assessment_name_ar,
                        assessment_name_en
                    )
                `);

            // تطبيق المرشحات
            if (searchFilters.academicYear && searchFilters.academicYear !== 'all') {
                query = query.eq('academic_years.year_code', searchFilters.academicYear);
            }
            if (searchFilters.semester && searchFilters.semester !== 'all') {
                query = query.eq('semesters.semester_code', searchFilters.semester);
            }
            if (searchFilters.subject && searchFilters.subject !== 'all') {
                query = query.eq('subjects.subject_name_ar', searchFilters.subject);
            }
            if (searchFilters.assessmentType && searchFilters.assessmentType !== 'all') {
                query = query.eq('assessment_types.assessment_code', searchFilters.assessmentType);
            }
            if (searchFilters.dateFrom) {
                query = query.gte('assessment_date', searchFilters.dateFrom);
            }
            if (searchFilters.dateTo) {
                query = query.lte('assessment_date', searchFilters.dateTo);
            }
            if (searchFilters.minGrade) {
                query = query.gte('final_grade', parseFloat(searchFilters.minGrade));
            }
            if (searchFilters.maxGrade) {
                query = query.lte('final_grade', parseFloat(searchFilters.maxGrade));
            }

            // البحث في اسم الطالب
            if (searchFilters.studentName) {
                query = query.ilike('students.full_name_ar', `%${searchFilters.studentName}%`);
            }

            let { data, error } = await query
                .order('assessment_date', { ascending: false })
                .limit(100);

            // فلترة التقييمات المعدلة فقط
            if (searchFilters.showModifiedOnly && data) {
                // الحصول على معرفات التقييمات التي تم تعديلها
                const { data: auditData, error: auditError } = await supabase
                    .from('academic_audit_log')
                    .select('grade_id')
                    .not('action_type', 'eq', 'CREATE'); // استثناء الإنشاءات

                if (!auditError && auditData) {
                    const modifiedGradeIds = auditData.map(audit => audit.grade_id);
                    data = data.filter(grade => modifiedGradeIds.includes(grade.id));
                }
            }

            if (error) throw error;

            const formattedResults: Grade[] = (data || []).map(item => ({
                id: item.id,
                studentId: item.student_id,
                subject_id: item.subject_id,
                assessment_type_id: item.assessment_type_id,
                academic_year_id: item.academic_year_id,
                semester_id: item.semester_id,
                subjectName: item.subjects?.subject_name_ar || '',
                teacherName: item.teacher_name,
                assessmentType: item.assessment_types?.assessment_name_ar || '',
                academicYear: item.academic_years?.year_code || '',
                semester: item.semesters?.semester_name_ar || '',
                assessmentDate: item.assessment_date,
                originalGrade: item.original_grade,
                finalGrade: item.final_grade,
                gradeLevel: item.grade_level,
                teacherNotes: item.teacher_notes,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                createdBy: item.created_by,
                studentName: item.students?.full_name_ar,
                studentCode: item.students?.student_id,
            }));

            setSearchResults(formattedResults);
        } catch (error) {
            console.error('خطأ في البحث:', error);
        } finally {
            setLoading(false);
        }
    };

    // تنسيق التاريخ
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // تحديد لون الدرجة
    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'bg-green-100 text-green-800';
        if (grade >= 80) return 'bg-blue-100 text-blue-800';
        if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
        if (grade >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    // تصدير النتائج
    const exportResults = () => {
        const csvContent = [
            ['الطالب', 'المعرف', 'المادة', 'نوع التقييم', 'التاريخ', 'الدرجة', 'التقدير', 'المعلم', 'الفصل', 'السنة'],
            ...searchResults.map(result => [
                result.studentName || '',
                result.studentCode || '',
                result.subjectName,
                result.assessmentType,
                result.assessmentDate || '',
                result.finalGrade.toString(),
                result.gradeLevel || '',
                result.teacherName || '',
                result.semester || '',
                result.academicYear || '',
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `academic_search_results_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
                {/* رأس الصفحة */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Search className="h-8 w-8" />
                        <h1 className="text-4xl font-bold">🔍 البحث الأكاديمي المتقدم</h1>
                    </div>
                    <p className="text-blue-100">البحث والتصفية في جميع البيانات الأكاديمية بكفاءة ودقة</p>
                </div>

                {/* نموذج البحث والتصفية */}
                <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Filter className="h-6 w-6 text-blue-600" />
                        معايير البحث والتصفية
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {/* السنة الدراسية */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📅 السنة الدراسية
                            </Label>
                            <Select
                                value={searchFilters.academicYear}
                                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, academicYear: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر السنة..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    {academicYears.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* الفصل الدراسي */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📆 الفصل الدراسي
                            </Label>
                            <Select
                                value={searchFilters.semester}
                                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, semester: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الفصل..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    {semesters.map(semester => (
                                        <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* المادة */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📚 المادة
                            </Label>
                            <Select
                                value={searchFilters.subject}
                                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, subject: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر المادة..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    {SUBJECTS_LIST.map(subject => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* نوع التقييم */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📋 نوع التقييم
                            </Label>
                            <Select
                                value={searchFilters.assessmentType}
                                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, assessmentType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر النوع..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    {ASSESSMENT_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* نطاق التاريخ */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📅 من تاريخ
                            </Label>
                            <Input
                                type="date"
                                value={searchFilters.dateFrom}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📅 إلى تاريخ
                            </Label>
                            <Input
                                type="date"
                                value={searchFilters.dateTo}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            />
                        </div>

                        {/* نطاق الدرجة */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📊 درجة أقل من
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={searchFilters.minGrade}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, minGrade: e.target.value }))}
                                placeholder="مثال: 60"
                            />
                        </div>

                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                📊 درجة أعلى من
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={searchFilters.maxGrade}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, maxGrade: e.target.value }))}
                                placeholder="مثال: 90"
                            />
                        </div>

                        {/* اسم الطالب */}
                        <div>
                            <Label className="block text-sm font-semibold text-gray-700 mb-2">
                                👤 اسم الطالب
                            </Label>
                            <Input
                                type="text"
                                value={searchFilters.studentName}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, studentName: e.target.value }))}
                                placeholder="ابحث باسم الطالب..."
                            />
                        </div>
                    </div>

                    {/* فلاتر إضافية */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="showModifiedOnly"
                                checked={searchFilters.showModifiedOnly}
                                onCheckedChange={(checked) =>
                                    setSearchFilters(prev => ({ ...prev, showModifiedOnly: checked as boolean }))
                                }
                            />
                            <Label htmlFor="showModifiedOnly" className="text-sm font-medium">
                                عرض التقييمات المعدلة فقط
                            </Label>
                        </div>
                    </div>

                    {/* أزرار البحث والتصدير */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            onClick={performSearch}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? 'جاري البحث...' : 'بحث'}
                        </Button>
                        {searchResults.length > 0 && (
                            <Button
                                onClick={exportResults}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                تصدير CSV
                            </Button>
                        )}
                    </div>
                </Card>

                {/* نتائج البحث */}
                {searchResults.length > 0 && (
                    <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                                نتائج البحث ({searchResults.length} تقييم)
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">الطالب</TableHead>
                                        <TableHead className="text-right">المعرف</TableHead>
                                        <TableHead className="text-right">المادة</TableHead>
                                        <TableHead className="text-right">نوع التقييم</TableHead>
                                        <TableHead className="text-right">التاريخ</TableHead>
                                        <TableHead className="text-right">الدرجة</TableHead>
                                        <TableHead className="text-right">التقدير</TableHead>
                                        <TableHead className="text-right">المعلم</TableHead>
                                        <TableHead className="text-right">الفصل</TableHead>
                                        <TableHead className="text-right">السنة</TableHead>
                                        <TableHead className="text-right">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResults.map((result) => (
                                        <TableRow
                                            key={result.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setSelectedResult(result)}
                                        >
                                            <TableCell className="font-medium">
                                                {result.studentName || 'غير محدد'}
                                            </TableCell>
                                            <TableCell>{result.studentCode || '-'}</TableCell>
                                            <TableCell>{result.subjectName}</TableCell>
                                            <TableCell>{result.assessmentType}</TableCell>
                                            <TableCell>{formatDate(result.assessmentDate || '')}</TableCell>
                                            <TableCell>
                                                <Badge className={getGradeColor(result.finalGrade)}>
                                                    {result.finalGrade}/100
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{result.gradeLevel || '-'}</TableCell>
                                            <TableCell>{result.teacherName || '-'}</TableCell>
                                            <TableCell>{result.semester || '-'}</TableCell>
                                            <TableCell>{result.academicYear || '-'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedResult(result);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )}

                {/* تفاصيل التقييم المحدد */}
                {selectedResult && (
                    <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-blue-800">تفاصيل التقييم</h3>
                            <Button
                                onClick={() => setSelectedResult(null)}
                                variant="ghost"
                                size="sm"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">الطالب</p>
                                <p className="font-semibold">{selectedResult.studentName} ({selectedResult.studentCode})</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">المادة</p>
                                <p className="font-semibold">{selectedResult.subjectName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">نوع التقييم</p>
                                <p className="font-semibold">{selectedResult.assessmentType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">التاريخ</p>
                                <p className="font-semibold">{formatDate(selectedResult.assessmentDate || '')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">الدرجة</p>
                                <p className="font-semibold text-lg">{selectedResult.finalGrade}/100</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">التقدير</p>
                                <p className="font-semibold">{selectedResult.gradeLevel}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">المعلم</p>
                                <p className="font-semibold">{selectedResult.teacherName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">تاريخ الإدخال</p>
                                <p className="font-semibold">{formatDate(selectedResult.createdAt || '')}</p>
                            </div>
                        </div>

                        {selectedResult.teacherNotes && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600">ملاحظات المعلم</p>
                                <p className="bg-white p-3 rounded border mt-1">{selectedResult.teacherNotes}</p>
                            </div>
                        )}
                    </Card>
                )}

                {/* إحصائيات النتائج */}
                {searchResults.length > 0 && (
                    <Card className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">إحصائيات النتائج</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-600">عدد التقييمات</p>
                                <p className="text-2xl font-bold text-blue-600">{searchResults.length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-600">متوسط الدرجات</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {(searchResults.reduce((sum, r) => sum + r.finalGrade, 0) / searchResults.length).toFixed(1)}%
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-600">أعلى درجة</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {Math.max(...searchResults.map(r => r.finalGrade))}%
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-600">أدنى درجة</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {Math.min(...searchResults.map(r => r.finalGrade))}%
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}