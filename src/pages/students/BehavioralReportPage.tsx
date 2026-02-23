import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBehavioralReports } from '@/hooks/useBehavioralReports';
import { IncidentReportForm } from '@/components/BehavioralReports/IncidentReportForm';
import { ViolationConfessionForm } from '@/components/BehavioralReports/ViolationConfessionForm';
import { GuardianSummonsForm } from '@/components/BehavioralReports/GuardianSummonsForm';
import { PledgeCommitmentForm } from '@/components/BehavioralReports/PledgeCommitmentForm';
import { WarningsForm } from '@/components/BehavioralReports/WarningsForm';
import { BehaviorEvaluationNoticeForm } from '@/components/BehavioralReports/BehaviorEvaluationNoticeForm';
import { ExpulsionWarningForm } from '@/components/BehavioralReports/ExpulsionWarningForm';
import { ExpulsionDecisionForm } from '@/components/BehavioralReports/ExpulsionDecisionForm';
import { TherapeuticPlanForm } from '@/components/BehavioralReports/TherapeuticPlanForm';
import { FollowUpReportForm } from '@/components/BehavioralReports/FollowUpReportForm';
import { InternalNoteForm } from '@/components/BehavioralReports/InternalNoteForm';
import { PositiveNoteForm } from '@/components/BehavioralReports/PositiveNoteForm';
import { ArrowLeft, Loader, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface ReportItem {
    id: string;
    record_number: string;
    created_at: string;
    status: string;
    [key: string]: any;
}

const REPORT_TYPE_INFO: Record<string, { name: string; description: string; form: any }> = {
    incident_reports: {
        name: 'تقرير واقعة',
        description: 'توثيق الحادثة كما رآها المراقب بشكل موضوعي',
        form: IncidentReportForm,
    },
    violation_confessions: {
        name: 'إقرار بارتكاب مخالفة',
        description: 'إقرار الطالب الكتابي بارتكابه للمخالفة',
        form: ViolationConfessionForm,
    },
    guardian_summons: {
        name: 'استدعاء ولي أمر',
        description: 'توثيق استدعاء وحضور ولي الأمر',
        form: GuardianSummonsForm,
    },
    pledge_commitments: {
        name: 'إقرار وتعهد',
        description: 'تعهد الطالب بعدم تكرار المخالفة',
        form: PledgeCommitmentForm,
    },
    warnings: {
        name: 'إنذار',
        description: 'إصدار إنذار رسمي للطالب',
        form: WarningsForm,
    },
    behavior_evaluation_notices: {
        name: 'إخطار تقييم السلوك',
        description: 'تقرير دوري بتقييم سلوك الطالب',
        form: BehaviorEvaluationNoticeForm,
    },
    expulsion_warnings: {
        name: 'إنذار بالفصل',
        description: 'إنذار نهائي قبل الفصل النهائي',
        form: ExpulsionWarningForm,
    },
    expulsion_decisions: {
        name: 'قرار فصل طالب',
        description: 'قرار فصل نهائي (محمي بصلاحيات)',
        form: ExpulsionDecisionForm,
    },
    therapeutic_plans: {
        name: 'خطة علاجية',
        description: 'خطة متكاملة لتحسين السلوك',
        form: TherapeuticPlanForm,
    },
    follow_up_reports: {
        name: 'تقرير متابعة',
        description: 'متابعة تطبيق الخطة العلاجية',
        form: FollowUpReportForm,
    },
    internal_notes: {
        name: 'مذكرة داخلية',
        description: 'ملاحظات داخلية للمرشدين والإدارة',
        form: InternalNoteForm,
    },
    positive_notes: {
        name: 'ملاحظة إيجابية',
        description: 'توثيق السلوكيات والإنجازات الإيجابية',
        form: PositiveNoteForm,
    },
};

export default function BehavioralReportPage() {
    const { studentId, reportType } = useParams<{
        studentId: string;
        reportType: string;
    }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action') || 'view';

    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [academicYearId, setAcademicYearId] = useState<string>('');

    const { generateRecordNumber, createReport } = useBehavioralReports(
        studentId || '',
        academicYearId
    );

    // Fetch academic year ID
    useEffect(() => {
        const fetchAcademicYear = async () => {
            try {
                const { data, error } = await supabase
                    .from('academic_years')
                    .select('id')
                    .eq('year_code', new Date().getFullYear() + '-' + (new Date().getFullYear() + 1))
                    .single();

                if (!error && data) {
                    setAcademicYearId(data.id);
                }
            } catch (error) {
                console.error('Error fetching academic year:', error);
            }
        };

        fetchAcademicYear();
    }, []);

    // Fetch reports
    useEffect(() => {
        const fetchReports = async () => {
            if (!studentId || !reportType || !academicYearId) return;

            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from(reportType)
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('academic_year_id', academicYearId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setReports(data || []);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [studentId, reportType, academicYearId]);

    if (!studentId || !reportType) {
        return (
            <DashboardLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">معاملات غير صحيحة</p>
                </div>
            </DashboardLayout>
        );
    }

    const reportInfo = REPORT_TYPE_INFO[reportType];
    const FormComponent = reportInfo?.form;

    const handleCreateReport = async (formData: any) => {
        try {
            setSubmitting(true);
            const recordNumber = generateRecordNumber(reportType, reports.length + 1);

            await createReport(
                reportType as any,
                formData,
                recordNumber
            );

            // Refresh reports
            const { data } = await supabase
                .from(reportType)
                .select('*')
                .eq('student_id', studentId)
                .eq('academic_year_id', academicYearId)
                .order('created_at', { ascending: false });

            setReports(data || []);

            // Navigate back
            navigate(
                `/student/${studentId}/behavioral-report/${reportType}?action=view`
            );
        } catch (error) {
            console.error('Error creating report:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReport = async (id: string) => {
        if (confirm('هل تريد حذف هذا التقرير؟')) {
            try {
                const { error } = await supabase
                    .from(reportType)
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setReports(reports.filter((r) => r.id !== id));
            } catch (error) {
                console.error('Error deleting report:', error);
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-5xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {reportInfo?.name}
                        </h1>
                        <p className="text-gray-600">{reportInfo?.description}</p>
                    </div>
                    <Button
                        onClick={() =>
                            navigate(
                                `/student/${studentId}/behavioral-dashboard`
                            )
                        }
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        العودة
                    </Button>
                </div>

                {/* Create/View Toggle */}
                {action === 'new' && FormComponent ? (
                    <FormComponent
                        onSubmit={handleCreateReport}
                        onCancel={() =>
                            navigate(
                                `/student/${studentId}/behavioral-report/${reportType}?action=view`
                            )
                        }
                        isLoading={submitting}
                        studentId={studentId}
                    />
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                التقارير المسجلة ({reports.length})
                            </h2>
                            {FormComponent && (
                                <Button
                                    onClick={() =>
                                        navigate(
                                            `/student/${studentId}/behavioral-report/${reportType}?action=new`
                                        )
                                    }
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    إنشاء تقرير جديد
                                </Button>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-10">
                                <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-gray-500">جاري تحميل البيانات...</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <Card className="p-8 text-center bg-gray-50 border border-dashed">
                                <p className="text-gray-500 mb-4">لا توجد تقارير مسجلة</p>
                                {FormComponent && (
                                    <Button
                                        onClick={() =>
                                            navigate(
                                                `/student/${studentId}/behavioral-report/${reportType}?action=new`
                                            )
                                        }
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        إنشاء أول تقرير
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <Card
                                        key={report.id}
                                        className="p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-lg font-semibold text-gray-800">
                                                        {report.record_number}
                                                    </span>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            report.status === 'جديد'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}
                                                    >
                                                        {report.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(report.created_at).toLocaleDateString(
                                                        'ar-EG'
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-2"
                                                    onClick={() =>
                                                        navigate(
                                                            `/student/${studentId}/behavioral-report/${reportType}/${report.id}`
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    عرض
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-2"
                                                    onClick={() =>
                                                        navigate(
                                                            `/student/${studentId}/behavioral-report/${reportType}/${report.id}?action=edit`
                                                        )
                                                    }
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    تعديل
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                                    onClick={() =>
                                                        handleDeleteReport(report.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    حذف
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
