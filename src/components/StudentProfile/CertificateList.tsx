import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grade, PersonalData, EnrollmentData } from '@/types/student';
import { Printer, Download, FileText } from 'lucide-react';

interface CertificateListProps {
    studentId: string;
    studentPersonalData?: PersonalData;
    studentEnrollmentData?: EnrollmentData;
    grades: Grade[];
}

/**
 * مكون قائمة الشهادات المنفصلة
 * يعرض كل شهادة كبطاقة منفصلة مع زر طباعة في النهاية
 */
export function CertificateList({
    studentId,
    studentPersonalData,
    studentEnrollmentData,
    grades
}: CertificateListProps) {
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
    const [selectedSemester, setSelectedSemester] = useState<'الفصل الأول' | 'الفصل الثاني'>('الفصل الأول');

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

    // وظيفة الطباعة - طباعة الجدول المجمع فقط
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

    if (certificateGrades.length === 0) {
        return (
            <Card className="p-8 bg-gray-50 border border-gray-200">
                <div className="text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">لا توجد شهادات مضافة بعد</p>
                    <p className="text-sm mt-2">أضف درجات للطالب باستخدام النموذج أدناه لتظهر الشهادات هنا</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* قائمة الشهادات المنفصلة */}
            <div className="space-y-4">
                {certificateGrades.map((grade, index) => (
                    <Card key={grade.id || index} className="p-6 bg-white border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{grade.subjectName}</h3>
                                    <p className="text-sm text-gray-600">
                                        المعلم: {grade.teacherName || 'غير محدد'} •
                                        التاريخ: {formatDate(grade.assessmentDate)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left">
                                <div className={`text-2xl font-bold ${getGradeColor(grade.finalGrade)}`}>
                                    {grade.finalGrade}/100
                                </div>
                                <div className="text-sm text-gray-600">{getGradeLevel(grade.finalGrade)}</div>
                            </div>
                        </div>
                        {grade.teacherNotes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>ملاحظات:</strong> {grade.teacherNotes}
                                </p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* زر الطباعة المجمعة - يظهر تحت آخر شهادة */}
            <Card className="p-6 bg-green-50 border border-green-200">
                <div className="text-center">
                    <h3 className="text-lg font-bold text-green-800 mb-4">طباعة الشهادات المجتمعة</h3>
                    <p className="text-sm text-green-700 mb-6">
                        سيتم طباعة جدول يجمع جميع الشهادات المعروضة أعلاه
                    </p>

                    {/* الجدول المخفي للطباعة */}
                    <div className="print-certificate-table hidden print:block">
                        <h2 className="text-xl font-bold text-center mb-4">جدول الدرجات المجمعة</h2>
                        <table className="w-full border-collapse border border-gray-300 print-table mx-auto">
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
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-center gap-4 print:hidden">
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                            <Printer className="h-5 w-5 mr-2" />
                            طباعة الشهادات المجتمعة
                        </Button>
                        <Button onClick={handleExportPDF} variant="outline" className="px-6 py-2">
                            <Download className="h-5 w-5 mr-2" />
                            تصدير PDF
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}