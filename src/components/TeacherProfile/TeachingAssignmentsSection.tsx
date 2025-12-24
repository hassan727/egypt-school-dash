import { Card } from '@/components/ui/card';
import {
    BookOpen,
    Clock,
    Users,
    Award,
    GraduationCap,
    Trophy,
    Calendar
} from 'lucide-react';
import { TeachingAssignment, TrainingCourse, TeacherCertification } from '@/types/teacher';

interface TeachingAssignmentsSectionProps {
    assignments: TeachingAssignment[];
    courses: TrainingCourse[];
    certifications: TeacherCertification[];
}

export function TeachingAssignmentsSection({
    assignments,
    courses,
    certifications
}: TeachingAssignmentsSectionProps) {
    // حسابات ديناميكية
    const totalWeeklyHours = assignments.reduce((sum, a) => sum + a.weeklyHours, 0);
    const uniqueClasses = [...new Set(assignments.map(a => a.classId))].length;
    const uniqueSubjects = [...new Set(assignments.map(a => a.subjectId))].length;

    const completedCourses = courses.filter(c => c.certificateObtained).length;
    const activeCertifications = certifications.filter(c => c.status === 'سارية').length;

    return (
        <div className="space-y-6">
            {/* بطاقات الملخص */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-200">
                            <Clock className="h-6 w-6 text-blue-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-700">{totalWeeklyHours}</p>
                            <p className="text-sm text-blue-600">ساعة أسبوعية</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-200">
                            <Users className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-700">{uniqueClasses}</p>
                            <p className="text-sm text-green-600">فصل دراسي</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-200">
                            <BookOpen className="h-6 w-6 text-purple-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-purple-700">{uniqueSubjects}</p>
                            <p className="text-sm text-purple-600">مادة دراسية</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-200">
                            <Award className="h-6 w-6 text-orange-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-orange-700">{activeCertifications}</p>
                            <p className="text-sm text-orange-600">شهادة سارية</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* المهام التدريسية */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    المهام التدريسية
                </h3>

                {assignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-right p-3">المادة</th>
                                    <th className="text-right p-3">المرحلة</th>
                                    <th className="text-right p-3">الفصل</th>
                                    <th className="text-right p-3">الساعات الأسبوعية</th>
                                    <th className="text-right p-3">نوع التدريس</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {assignments.map((assignment, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="font-medium">{assignment.subjectName || 'غير محدد'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">{assignment.stageName || '-'}</td>
                                        <td className="p-3">{assignment.className || '-'}</td>
                                        <td className="p-3">
                                            <span className="font-semibold text-blue-600">{assignment.weeklyHours}</span> ساعة
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.isPrimaryTeacher
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {assignment.isPrimaryTeacher ? 'معلم أساسي' : 'معلم مساعد'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد مهام تدريسية مسجلة</p>
                    </div>
                )}
            </Card>

            {/* الدورات التدريبية */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    الدورات التدريبية
                    <span className="text-sm font-normal text-gray-500 mr-2">
                        ({completedCourses} من {courses.length} مكتملة)
                    </span>
                </h3>

                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((course, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${course.certificateObtained
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold">{course.courseName}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{course.courseProvider}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {course.startDate}
                                            </span>
                                            {course.durationHours && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {course.durationHours} ساعة
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.courseType === 'أونلاين'
                                                ? 'bg-blue-100 text-blue-700'
                                                : course.courseType === 'داخلية'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {course.courseType}
                                        </span>
                                        {course.certificateObtained && (
                                            <div className="mt-2 flex items-center gap-1 text-green-600">
                                                <Trophy className="h-4 w-4" />
                                                <span className="text-xs">{course.grade}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد دورات تدريبية مسجلة</p>
                    </div>
                )}
            </Card>

            {/* الشهادات المهنية */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    الشهادات المهنية
                </h3>

                {certifications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {certifications.map((cert, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${cert.status === 'سارية'
                                        ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-full ${cert.status === 'سارية' ? 'bg-orange-200' : 'bg-gray-200'
                                        }`}>
                                        <Award className={`h-5 w-5 ${cert.status === 'سارية' ? 'text-orange-700' : 'text-gray-500'
                                            }`} />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cert.status === 'سارية'
                                            ? 'bg-green-100 text-green-700'
                                            : cert.status === 'قيد التجديد'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                        {cert.status}
                                    </span>
                                </div>
                                <h4 className="font-semibold">{cert.certificationName}</h4>
                                <p className="text-sm text-gray-600 mt-1">{cert.issuingAuthority}</p>
                                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                    <span>تاريخ الإصدار: {cert.issueDate}</span>
                                    {cert.expiryDate && (
                                        <span>الانتهاء: {cert.expiryDate}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد شهادات مهنية مسجلة</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
