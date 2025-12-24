import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Grade, PersonalData, EnrollmentData } from '@/types/student';
import { Printer, Download, FileText, Settings } from 'lucide-react';
import { getEgyptianDate } from '@/utils/helpers';

interface IntegratedCertificateProps {
    studentId: string;
    studentPersonalData?: PersonalData;
    studentEnrollmentData?: EnrollmentData;
    grades: Grade[];
}

/**
 * مكون الشهادة الأكاديمية المجمعة
 * يجمع جميع المواد في شهادة واحدة مع إمكانية التخصيص والطباعة
 */
export function IntegratedCertificate({
    studentId,
    studentPersonalData,
    studentEnrollmentData,
    grades
}: IntegratedCertificateProps) {
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
    const [selectedSemester, setSelectedSemester] = useState<'الفصل الأول' | 'الفصل الثاني'>('الفصل الأول');
    const [showTeacherNames, setShowTeacherNames] = useState(true);
    const [showNotes, setShowNotes] = useState(false);
    const [showAverage, setShowAverage] = useState(true);


    // استخراج السنوات الدراسية المتاحة من الدرجات
    const availableYears = Array.from(new Set(grades.map(g => g.academicYear || '2025-2026')));

    // تصفية الدرجات حسب السنة والفصل المحددين
    const filteredGrades = grades.filter(grade =>
        (grade.academicYear || '2025-2026') === selectedAcademicYear &&
        grade.semester === selectedSemester
    );

    // تجميع الدرجات حسب المادة (آخر تقييم لكل مادة)
    const aggregatedGrades = filteredGrades.reduce((acc, grade) => {
        const subjectKey = grade.subjectName;
        if (!acc[subjectKey] || new Date(grade.assessmentDate || '') > new Date(acc[subjectKey].assessmentDate || '')) {
            acc[subjectKey] = grade;
        }
        return acc;
    }, {} as Record<string, Grade>);

    const certificateGrades = Object.values(aggregatedGrades);

    // حساب المتوسط العام
    const averageGrade = certificateGrades.length > 0
        ? certificateGrades.reduce((sum, grade) => sum + grade.finalGrade, 0) / certificateGrades.length
        : 0;

    // تنسيق التاريخ
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // تحديد لون الدرجة
    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-green-600';
        if (grade >= 80) return 'text-blue-600';
        if (grade >= 70) return 'text-yellow-600';
        if (grade >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    // تحديد مستوى الدرجة
    const getGradeLevel = (grade: number) => {
        if (grade >= 90) return 'ممتاز';
        if (grade >= 80) return 'جيد جداً';
        if (grade >= 70) return 'جيد';
        if (grade >= 60) return 'مقبول';
        return 'ضعيف';
    };

    // وظيفة الطباعة - استخدام CSS للطباعة النظيفة
    const handlePrint = () => {
        // إضافة كلاس للجسم للطباعة
        document.body.classList.add('printing-certificate');

        // انتظار قليل ثم الطباعة
        setTimeout(() => {
            window.print();

            // إزالة الكلاس بعد الطباعة
            setTimeout(() => {
                document.body.classList.remove('printing-certificate');
            }, 1000);
        }, 100);
    };



    // تصدير PDF (بسيط - يمكن تحسينه لاحقاً)
    const handleExportPDF = () => {
        handlePrint(); // للآن نستخدم الطباعة كبديل
    };

    return (
        <div className="space-y-6">
            {/* إعدادات الشهادة */}
            <Card className="p-6 bg-gray-50 border border-gray-200 certificate-controls">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-800">إعدادات الشهادة الأكاديمية المجمعة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            السنة الدراسية
                        </label>
                        <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            الفصل الدراسي
                        </label>
                        <Select value={selectedSemester} onValueChange={(value: 'الفصل الأول' | 'الفصل الثاني') => setSelectedSemester(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="الفصل الأول">الفصل الأول</SelectItem>
                                <SelectItem value="الفصل الثاني">الفصل الثاني</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showTeacherNames"
                            checked={showTeacherNames}
                            onCheckedChange={setShowTeacherNames}
                        />
                        <label htmlFor="showTeacherNames" className="text-sm font-medium text-gray-700">
                            إظهار أسماء المعلمين
                        </label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showAverage"
                            checked={showAverage}
                            onCheckedChange={setShowAverage}
                        />
                        <label htmlFor="showAverage" className="text-sm font-medium text-gray-700">
                            إظهار المتوسط العام
                        </label>
                    </div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                        id="showNotes"
                        checked={showNotes}
                        onCheckedChange={setShowNotes}
                    />
                    <label htmlFor="showNotes" className="text-sm font-medium text-gray-700">
                        تضمين الملاحظات
                    </label>
                </div>


            </Card>

            {/* الشهادة الأكاديمية المجمعة */}
            <Card className="p-8 bg-white border-2 border-gray-300 certificate-content">
                {/* رأس الشهادة */}
                <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">شهادة أداء أكاديمي</h1>
                    <div className="grid grid-cols-2 gap-4 text-right">
                        <div>
                            <p className="text-lg"><strong>الاسم:</strong> {studentPersonalData?.fullNameAr || 'غير محدد'}</p>
                            <p className="text-lg"><strong>السنة الدراسية:</strong> {selectedAcademicYear}</p>
                        </div>
                        <div>
                            <p className="text-lg"><strong>المرحلة:</strong> {studentEnrollmentData?.stage || 'غير محدد'}</p>
                            <p className="text-lg"><strong>الفصل:</strong> {selectedSemester}</p>
                        </div>
                    </div>
                    <p className="text-lg mt-2"><strong>تاريخ الطباعة:</strong> {formatDate(getEgyptianDate().toISOString())}</p>
                    {studentEnrollmentData?.class && (
                        <p className="text-lg"><strong>الصف:</strong> {studentEnrollmentData.class}</p>
                    )}
                </div>

                {/* جدول الدرجات المجمع - للطباعة */}
                <div className="mb-8 print-certificate-table">
                    <h2 className="text-xl font-bold text-center mb-4 print:block hidden">جدول الدرجات المجمعة</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 print-table">
                            <thead className="bg-blue-100">
                                <tr>
                                    <th className="border border-blue-200 px-4 py-2 text-right font-bold text-blue-900">المادة</th>
                                    <th className="border border-blue-200 px-4 py-2 text-right font-bold text-blue-900">درجة المادة</th>
                                    <th className="border border-blue-200 px-4 py-2 text-right font-bold text-blue-900">التقدير</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {certificateGrades.map((grade, index) => (
                                    <tr key={grade.id || index} className="hover:bg-blue-50 transition-colors">
                                        <td className="border border-gray-200 px-4 py-2 font-medium">{grade.subjectName}</td>
                                        <td className={`border border-gray-200 px-4 py-2 font-bold text-center ${getGradeColor(grade.finalGrade)}`}>
                                            {grade.finalGrade}/100
                                        </td>
                                        <td className="border border-gray-200 px-4 py-2 text-center">{getGradeLevel(grade.finalGrade)}</td>
                                    </tr>
                                ))}
                                {certificateGrades.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                                            لا توجد درجات مسجلة لهذه الفترة
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* المتوسط العام */}
                    {showAverage && certificateGrades.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                            <p className="text-center text-lg font-bold">
                                المتوسط العام: <span className={getGradeColor(averageGrade)}>{averageGrade.toFixed(1)}/100</span>
                                <span className="mr-2">({getGradeLevel(averageGrade)})</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* التوقيعات */}
                <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-300">
                    <div className="text-center">
                        <div className="border-b border-gray-400 mb-2 pb-2">
                            <p className="font-bold">مدير المدرسة</p>
                        </div>
                        <p className="text-sm text-gray-600">التوقيع: __________</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-gray-400 mb-2 pb-2">
                            <p className="font-bold">وكيل المرحلة</p>
                        </div>
                        <p className="text-sm text-gray-600">التوقيع: __________</p>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>تم إصدار هذه الشهادة إلكترونياً من نظام إدارة الطلاب</p>
                    <p>معرف الطالب: {studentId}</p>
                </div>

                {/* زر الطباعة - يظهر فقط عند وجود شهادات */}
                {certificateGrades.length > 0 && (
                    <div className="mt-6 flex justify-center gap-4 print:hidden">
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                            <Printer className="h-5 w-5 mr-2" />
                            طباعة الشهادات المجتمعة
                        </Button>
                        <Button onClick={handleExportPDF} variant="outline" className="px-6 py-2">
                            <Download className="h-5 w-5 mr-2" />
                            تصدير PDF
                        </Button>
                    </div>
                )}
            </Card>

            {/* إحصائيات سريعة */}
            <Card className="p-6 bg-blue-50 border border-blue-200 certificate-controls">
                <h3 className="text-lg font-bold text-blue-800 mb-4">إحصائيات الشهادة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{certificateGrades.length}</p>
                        <p className="text-sm text-blue-700">عدد المواد</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{certificateGrades.filter(g => g.finalGrade >= 60).length}</p>
                        <p className="text-sm text-green-700">مواد ناجحة</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{certificateGrades.filter(g => g.finalGrade < 60).length}</p>
                        <p className="text-sm text-red-700">مواد تحتاج تحسين</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${getGradeColor(averageGrade)}`}>{averageGrade.toFixed(1)}</p>
                        <p className="text-sm text-gray-700">المتوسط العام</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}