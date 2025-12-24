import { Card } from '@/components/ui/card';
import {
    Star,
    AlertTriangle,
    Trophy,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { TeacherEvaluation, DisciplinaryRecord, TeacherAchievement } from '@/types/teacher';

interface EvaluationsSectionProps {
    evaluations: TeacherEvaluation[];
    disciplinaryRecords: DisciplinaryRecord[];
    achievements: TeacherAchievement[];
}

export function EvaluationsSection({
    evaluations,
    disciplinaryRecords,
    achievements
}: EvaluationsSectionProps) {
    // آخر تقييم
    const latestEvaluation = evaluations[0];

    // إحصائيات
    const activeWarnings = disciplinaryRecords.filter(d => d.status === 'نافذ').length;
    const totalAchievements = achievements.length;

    return (
        <div className="space-y-6">
            {/* بطاقات الملخص */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* آخر تقييم */}
                <Card className={`p-5 bg-gradient-to-br ${latestEvaluation?.overallRating === 'ممتاز' ? 'from-green-50 to-green-100 border-green-200' :
                        latestEvaluation?.overallRating === 'جيد جدا' ? 'from-blue-50 to-blue-100 border-blue-200' :
                            latestEvaluation?.overallRating === 'جيد' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
                                'from-gray-50 to-gray-100 border-gray-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${latestEvaluation?.overallRating === 'ممتاز' ? 'bg-green-200' :
                                latestEvaluation?.overallRating === 'جيد جدا' ? 'bg-blue-200' :
                                    latestEvaluation?.overallRating === 'جيد' ? 'bg-yellow-200' :
                                        'bg-gray-200'
                            }`}>
                            <Star className={`h-6 w-6 ${latestEvaluation?.overallRating === 'ممتاز' ? 'text-green-700' :
                                    latestEvaluation?.overallRating === 'جيد جدا' ? 'text-blue-700' :
                                        latestEvaluation?.overallRating === 'جيد' ? 'text-yellow-700' :
                                            'text-gray-500'
                                }`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{latestEvaluation?.overallRating || '-'}</p>
                            <p className="text-sm text-gray-600">آخر تقييم</p>
                        </div>
                    </div>
                </Card>

                {/* التنبيهات النشطة */}
                <Card className={`p-5 bg-gradient-to-br ${activeWarnings > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-green-50 to-green-100 border-green-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${activeWarnings > 0 ? 'bg-red-200' : 'bg-green-200'}`}>
                            {activeWarnings > 0 ? (
                                <AlertTriangle className="h-6 w-6 text-red-700" />
                            ) : (
                                <CheckCircle className="h-6 w-6 text-green-700" />
                            )}
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${activeWarnings > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {activeWarnings}
                            </p>
                            <p className="text-sm text-gray-600">تنبيهات نشطة</p>
                        </div>
                    </div>
                </Card>

                {/* الإنجازات */}
                <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-200">
                            <Trophy className="h-6 w-6 text-purple-700" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-700">{totalAchievements}</p>
                            <p className="text-sm text-gray-600">إنجازات وتقديرات</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* تفاصيل آخر تقييم */}
            {latestEvaluation && (
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        تفاصيل التقييم الأخير
                        <span className="text-sm font-normal text-gray-500 mr-2">
                            ({latestEvaluation.evaluationType} - {latestEvaluation.evaluationDate})
                        </span>
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'جودة التدريس', score: latestEvaluation.teachingQualityScore },
                            { label: 'إدارة الفصل', score: latestEvaluation.classroomManagementScore },
                            { label: 'تفاعل الطلاب', score: latestEvaluation.studentEngagementScore },
                            { label: 'التطوير المهني', score: latestEvaluation.professionalDevelopmentScore },
                            { label: 'الالتزام بالحضور', score: latestEvaluation.attendancePunctualityScore },
                            { label: 'العمل الجماعي', score: latestEvaluation.teamworkScore },
                            { label: 'التواصل', score: latestEvaluation.communicationScore },
                            { label: 'الالتزام بالمنهج', score: latestEvaluation.curriculumAdherenceScore },
                        ].map((item, index) => (
                            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="6"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            fill="none"
                                            stroke={item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#eab308' : '#ef4444'}
                                            strokeWidth="6"
                                            strokeDasharray={`${(item.score / 100) * 176} 176`}
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                                        {item.score}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {latestEvaluation.strengths && (
                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4" />
                                    نقاط القوة
                                </h4>
                                <p className="text-sm text-gray-600">{latestEvaluation.strengths}</p>
                            </div>
                        )}
                        {latestEvaluation.areasForImprovement && (
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <h4 className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
                                    <TrendingDown className="h-4 w-4" />
                                    مجالات التحسين
                                </h4>
                                <p className="text-sm text-gray-600">{latestEvaluation.areasForImprovement}</p>
                            </div>
                        )}
                        {latestEvaluation.recommendations && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4" />
                                    التوصيات
                                </h4>
                                <p className="text-sm text-gray-600">{latestEvaluation.recommendations}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* السجل التأديبي */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    السجل التأديبي
                </h3>

                {disciplinaryRecords.length > 0 ? (
                    <div className="space-y-3">
                        {disciplinaryRecords.map((record, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${record.status === 'نافذ'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.recordType === 'ملاحظة' ? 'bg-blue-100 text-blue-700' :
                                                    record.recordType === 'تنبيه' ? 'bg-yellow-100 text-yellow-700' :
                                                        record.recordType === 'إنذار شفهي' ? 'bg-orange-100 text-orange-700' :
                                                            record.recordType === 'إنذار كتابي' ? 'bg-red-100 text-red-700' :
                                                                'bg-red-200 text-red-800'
                                                }`}>
                                                {record.recordType}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'نافذ' ? 'bg-red-100 text-red-700' :
                                                    record.status === 'منتهي' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-gray-700">{record.description}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            بواسطة: {record.issuedBy} • {record.recordDate}
                                        </p>
                                    </div>
                                    {record.penaltyAmount && (
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-red-600">-{record.penaltyAmount} ج</p>
                                            <p className="text-xs text-gray-500">خصم</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                        <p className="text-green-600 font-medium">سجل نظيف - لا توجد مخالفات</p>
                    </div>
                )}
            </Card>

            {/* الإنجازات */}
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-600" />
                    الإنجازات والتقديرات
                </h3>

                {achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.map((achievement, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-full bg-purple-200">
                                        <Trophy className="h-5 w-5 text-purple-700" />
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                        {achievement.achievementType}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                                {achievement.description && (
                                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                    <span>{achievement.awardedBy}</span>
                                    <span>{achievement.achievementDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد إنجازات مسجلة بعد</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
