import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBehavioralReports } from '@/hooks/useBehavioralReports';
import {
    FileText,
    CheckSquare,
    Users,
    Handshake,
    AlertCircle,
    Mail,
    AlertTriangle,
    Gavel,
    Pill,
    TrendingUp,
    Lock,
    ThumbsUp,
    ArrowLeft,
    Loader,
} from 'lucide-react';

interface StudentInfo {
    student_id: string;
    full_name_ar: string;
    stage: string;
    class: string;
}

interface AcademicYear {
    id: string;
    year_code: string;
    year_name_ar: string;
}

const REPORT_CARDS = [
    {
        id: 'incident_reports',
        name: 'تقرير واقعة',
        description: 'توثيق الحادثة كما رآها المراقب',
        icon: FileText,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
    },
    {
        id: 'violation_confessions',
        name: 'إقرار بارتكاب مخالفة',
        description: 'اعتراف الطالب بالمخالفة',
        icon: CheckSquare,
        color: 'from-green-500 to-green-600',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
    },
    {
        id: 'guardian_summons',
        name: 'استدعاء ولي أمر',
        description: 'تسجيل استدعاء وحضور ولي الأمر',
        icon: Users,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
    },
    {
        id: 'pledge_commitments',
        name: 'إقرار وتعهد',
        description: 'تعهد الطالب بعدم تكرار المخالفة',
        icon: Handshake,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'from-pink-50 to-pink-100',
        borderColor: 'border-pink-200',
    },
    {
        id: 'warnings',
        name: 'إنذار',
        description: 'إصدار إنذار رسمي للطالب',
        icon: AlertCircle,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
    },
    {
        id: 'behavior_evaluation_notices',
        name: 'إخطار تقييم السلوك',
        description: 'تقرير دوري بتقييم السلوك',
        icon: Mail,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'from-indigo-50 to-indigo-100',
        borderColor: 'border-indigo-200',
    },
    {
        id: 'expulsion_warnings',
        name: 'إنذار بالفصل',
        description: 'إنذار نهائي قبل الفصل',
        icon: AlertTriangle,
        color: 'from-red-500 to-red-600',
        bgColor: 'from-red-50 to-red-100',
        borderColor: 'border-red-200',
    },
    {
        id: 'expulsion_decisions',
        name: 'قرار فصل طالب',
        description: 'قرار فصل نهائي (محمي)',
        icon: Gavel,
        color: 'from-red-700 to-red-800',
        bgColor: 'from-red-50 to-red-100',
        borderColor: 'border-red-300',
    },
    {
        id: 'therapeutic_plans',
        name: 'خطة علاجية',
        description: 'خطة متكاملة لتحسين السلوك',
        icon: Pill,
        color: 'from-cyan-500 to-cyan-600',
        bgColor: 'from-cyan-50 to-cyan-100',
        borderColor: 'border-cyan-200',
    },
    {
        id: 'follow_up_reports',
        name: 'تقرير متابعة',
        description: 'متابعة تطبيق الخطة العلاجية',
        icon: TrendingUp,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'from-emerald-50 to-emerald-100',
        borderColor: 'border-emerald-200',
    },
    {
        id: 'internal_notes',
        name: 'مذكرة داخلية',
        description: 'ملاحظات داخلية للمرشدين فقط',
        icon: Lock,
        color: 'from-slate-500 to-slate-600',
        bgColor: 'from-slate-50 to-slate-100',
        borderColor: 'border-slate-200',
    },
    {
        id: 'positive_notes',
        name: 'ملاحظة إيجابية',
        description: 'توثيق السلوكيات الإيجابية',
        icon: ThumbsUp,
        color: 'from-lime-500 to-lime-600',
        bgColor: 'from-lime-50 to-lime-100',
        borderColor: 'border-lime-200',
    },
];

export default function BehavioralDashboard() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const { reportCounts } = useBehavioralReports(studentId || '', selectedYear);

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId) return;

            try {
                setLoading(true);

                // Fetch student info
                const { data: student, error: studentError } = await supabase
                    .from('students')
                    .select('student_id, full_name_ar, stage, class')
                    .eq('student_id', studentId)
                    .single();

                if (studentError) throw studentError;
                setStudentInfo(student);

                // Fetch academic years
                const { data: years, error: yearsError } = await supabase
                    .from('academic_years')
                    .select('id, year_code, year_name_ar')
                    .order('year_code', { ascending: false });

                if (yearsError) throw yearsError;
                setAcademicYears(years || []);

                // Set default year to 2025-2026
                if (years && years.length > 0) {
                    const defaultYear = years.find(y => y.year_code === '2025-2026');
                    setSelectedYear(defaultYear?.id || years[0].id);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    if (!studentId) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            لوحة التحكم السلوكية
                        </h1>
                        {studentInfo && (
                            <div className="space-y-2">
                                <p className="text-gray-600">
                                    <span className="font-semibold">الطالب:</span> {studentInfo.full_name_ar}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">الفصل:</span> {studentInfo.stage} - {studentInfo.class}
                                </p>
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={() => navigate(`/student/${studentId}/dashboard`)}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        العودة
                    </Button>
                </div>

                {/* Year Selection */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                    <div className="flex items-center gap-4">
                        <label className="font-semibold text-gray-700">السنة الدراسية:</label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="اختر السنة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map((year) => (
                                    <SelectItem key={year.id} value={year.id}>
                                        {year.year_name_ar}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Report Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {REPORT_CARDS.map((card) => {
                        const IconComponent = card.icon;
                        const count =
                            reportCounts[card.id as keyof typeof reportCounts] || 0;

                        return (
                            <div
                                key={card.id}
                                className={`bg-gradient-to-br ${card.bgColor} border ${card.borderColor} rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group`}
                                onClick={() =>
                                    navigate(
                                        `/student/${studentId}/behavioral-report/${card.id}`
                                    )
                                }
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`bg-gradient-to-r ${card.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}
                                    >
                                        <IconComponent className="h-6 w-6" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-gray-800">
                                            {count}
                                        </div>
                                        <div className="text-xs text-gray-500">عدد</div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    {card.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {card.description}
                                </p>

                                <div className="flex gap-2 pt-4 border-t border-gray-300 border-opacity-30">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/student/${studentId}/behavioral-report/${card.id}?action=new`
                                            );
                                        }}
                                    >
                                        إنشاء جديد
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/student/${studentId}/behavioral-report/${card.id}?action=view`
                                            );
                                        }}
                                    >
                                        عرض الكل
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
