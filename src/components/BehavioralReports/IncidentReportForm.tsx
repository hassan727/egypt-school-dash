import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';
import { IncidentReportPrint } from './IncidentReportPrint';
import { PrintHeaderData } from '@/utils/printUtils';
import { supabase } from '@/lib/supabase';
import { PrinterIcon } from 'lucide-react';
import { SCHOOL_INFO, getCurrentAcademicYear } from '@/data/schoolConstants';

interface FormData {
    incident_date: string;
    incident_time: string;
    incident_location: string;
    incident_description: string;
    witness_names: string;
    reporter_name: string;
    reporter_role: string;
    severity_level: string;
    incident_type: string;
    behavioral_evidence: string;
    actions_taken: string;
}

interface StudentData {
    student_id: string;
    full_name_ar: string;
    stage: string;
    class: string;
}

interface IncidentReportFormProps {
    onSubmit: (data: FormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    studentId?: string;
}

export function IncidentReportForm({
    onSubmit,
    onCancel,
    isLoading = false,
    studentId = '',
}: IncidentReportFormProps) {
    const [formData, setFormData] = useState({
        incident_date: getEgyptianDateString(),
        incident_time: '08:00',
        incident_location: '',
        incident_description: '',
        witness_names: '',
        reporter_name: '',
        reporter_role: '',
        severity_level: 'متوسطة',
        incident_type: '',
        behavioral_evidence: '',
        actions_taken: '',
    });

    const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
    const [printMode, setPrintMode] = useState<'blank' | 'filled' | null>(null);

    useEffect(() => {
        const fetchStudentInfo = async () => {
            if (!studentId) return;
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('student_id, full_name_ar, stage, class')
                    .eq('student_id', studentId)
                    .single();

                if (!error && data) {
                    setStudentInfo(data as StudentData);
                }
            } catch (error) {
                console.error('Error fetching student info:', error);
            }
        };

        fetchStudentInfo();
    }, [studentId]);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const getPrintHeaderData = (): PrintHeaderData | null => {
        if (!studentInfo) return null;
        return {
            schoolName: SCHOOL_INFO.name,
            schoolLogo: SCHOOL_INFO.logo,
            academicYear: getCurrentAcademicYear(),
            studentName: studentInfo.full_name_ar || '',
            studentCode: studentInfo.student_id || '',
            grade: studentInfo.stage || '',
            class: studentInfo.class || '',
            studentId: studentInfo.student_id || '',
        };
    };

    if (printMode && getPrintHeaderData()) {
        return (
            <IncidentReportPrint
                data={formData}
                headerData={getPrintHeaderData()!}
                blank={printMode === 'blank'}
                onClose={() => setPrintMode(null)}
            />
        );
    }

    return (
        <Card className="p-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير واقعة</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            تاريخ الواقعة
                        </Label>
                        <Input
                            type="date"
                            value={formData.incident_date}
                            onChange={(e) =>
                                handleChange('incident_date', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            وقت الواقعة
                        </Label>
                        <Input
                            type="time"
                            value={formData.incident_time}
                            onChange={(e) =>
                                handleChange('incident_time', e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            مكان الواقعة
                        </Label>
                        <Input
                            placeholder="مثال: الفصل، الملعب، الممر"
                            value={formData.incident_location}
                            onChange={(e) =>
                                handleChange('incident_location', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            مستوى الخطورة
                        </Label>
                        <Select
                            value={formData.severity_level}
                            onValueChange={(value) =>
                                handleChange('severity_level', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="بسيطة">بسيطة</SelectItem>
                                <SelectItem value="متوسطة">متوسطة</SelectItem>
                                <SelectItem value="خطيرة">خطيرة</SelectItem>
                                <SelectItem value="حرجة">حرجة</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        نوع المخالفة
                    </Label>
                    <Input
                        placeholder="مثال: عدم الاحترام، العنف، السرقة"
                        value={formData.incident_type}
                        onChange={(e) => handleChange('incident_type', e.target.value)}
                        required
                    />
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        وصف تفصيلي للواقعة
                    </Label>
                    <Textarea
                        placeholder="اكتب وصفاً دقيقاً وموضوعياً لما حدث"
                        value={formData.incident_description}
                        onChange={(e) =>
                            handleChange('incident_description', e.target.value)
                        }
                        rows={5}
                        required
                    />
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        أسماء الشهود
                    </Label>
                    <Textarea
                        placeholder="أدرج أسماء الطلاب والموظفين الذين شهدوا الواقعة"
                        value={formData.witness_names}
                        onChange={(e) => handleChange('witness_names', e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            اسم المراقب/المراقبة
                        </Label>
                        <Input
                            placeholder="من قام بتوثيق الواقعة"
                            value={formData.reporter_name}
                            onChange={(e) =>
                                handleChange('reporter_name', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            دور المراقب
                        </Label>
                        <Input
                            placeholder="مثال: معلم، مرشد، إداري"
                            value={formData.reporter_role}
                            onChange={(e) => handleChange('reporter_role', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        الأدلة السلوكية
                    </Label>
                    <Textarea
                        placeholder="أي أدلة أو مؤشرات على السلوك المخالف"
                        value={formData.behavioral_evidence}
                        onChange={(e) =>
                            handleChange('behavioral_evidence', e.target.value)
                        }
                        rows={3}
                    />
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        الإجراءات المتخذة فوراً
                    </Label>
                    <Textarea
                        placeholder="الإجراءات الفورية التي تم اتخاذها"
                        value={formData.actions_taken}
                        onChange={(e) => handleChange('actions_taken', e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="space-y-4 pt-6 border-t">
                    <div className="flex gap-2 justify-start">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPrintMode('blank')}
                            className="flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <PrinterIcon className="h-4 w-4" />
                            ⇦ طباعة فارغ
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPrintMode('filled')}
                            className="flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <PrinterIcon className="h-4 w-4" />
                            ⇦ طباعة بالبيانات
                        </Button>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isLoading}
                        >
                            {isLoading ? 'جاري الحفظ...' : 'حفظ التقرير'}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}
