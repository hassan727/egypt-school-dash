import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface FollowUpReportFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function FollowUpReportForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: FollowUpReportFormProps) {
    const [formData, setFormData] = useState({
        follow_up_date: getEgyptianDateString(),
        follow_up_number: 1,
        period_covered_start_date: '',
        period_covered_end_date: '',
        progress_assessment: '',
        behavioral_changes: '',
        challenges_faced: '',
        strategies_adjusted: '',
        improvements_noted: '',
        areas_still_needing_work: '',
        student_response: '',
        teacher_observations: '',
        guardian_feedback: '',
        counselor_notes: '',
        next_steps: '',
        follow_up_recommendation: 'متابعة مستمرة',
        recommended_follow_up_date: '',
        counselor_name: '',
        counselor_signature_date: '',
        effectiveness_rating: '',
        notes: '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <Card className="p-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير متابعة</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات المتابعة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ المتابعة
                            </Label>
                            <Input
                                type="date"
                                value={formData.follow_up_date}
                                onChange={(e) =>
                                    handleChange('follow_up_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                رقم المتابعة
                            </Label>
                            <Input
                                type="number"
                                value={formData.follow_up_number}
                                onChange={(e) =>
                                    handleChange('follow_up_number', parseInt(e.target.value))
                                }
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">فترة التقرير</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ البداية
                            </Label>
                            <Input
                                type="date"
                                value={formData.period_covered_start_date}
                                onChange={(e) =>
                                    handleChange('period_covered_start_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ النهاية
                            </Label>
                            <Input
                                type="date"
                                value={formData.period_covered_end_date}
                                onChange={(e) =>
                                    handleChange('period_covered_end_date', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التقييم والملاحظات</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            تقييم التقدم
                        </Label>
                        <Textarea
                            placeholder="تقييم التقدم المحرز حتى الآن"
                            value={formData.progress_assessment}
                            onChange={(e) =>
                                handleChange('progress_assessment', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            التغييرات السلوكية
                        </Label>
                        <Textarea
                            placeholder="التغييرات السلوكية الملحوظة"
                            value={formData.behavioral_changes}
                            onChange={(e) =>
                                handleChange('behavioral_changes', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            التحديات التي واجهت
                        </Label>
                        <Textarea
                            placeholder="التحديات والعقبات التي واجهتها"
                            value={formData.challenges_faced}
                            onChange={(e) =>
                                handleChange('challenges_faced', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الاستراتيجيات المعدلة
                        </Label>
                        <Textarea
                            placeholder="أي تعديلات على الاستراتيجيات"
                            value={formData.strategies_adjusted}
                            onChange={(e) =>
                                handleChange('strategies_adjusted', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            التحسنات الملحوظة
                        </Label>
                        <Textarea
                            placeholder="التحسنات الملحوظة"
                            value={formData.improvements_noted}
                            onChange={(e) =>
                                handleChange('improvements_noted', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            المجالات التي تحتاج عمل إضافي
                        </Label>
                        <Textarea
                            placeholder="المجالات التي لا تزال تحتاج تحسين"
                            value={formData.areas_still_needing_work}
                            onChange={(e) =>
                                handleChange('areas_still_needing_work', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">الآراء والملاحظات</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            رد فعل الطالب
                        </Label>
                        <Textarea
                            placeholder="كيف استجاب الطالب للخطة"
                            value={formData.student_response}
                            onChange={(e) =>
                                handleChange('student_response', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات المعلمين
                        </Label>
                        <Textarea
                            placeholder="ملاحظات المعلمين حول السلوك"
                            value={formData.teacher_observations}
                            onChange={(e) =>
                                handleChange('teacher_observations', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات ولي الأمر
                        </Label>
                        <Textarea
                            placeholder="ملاحظات ولي الأمر عن السلوك في البيت"
                            value={formData.guardian_feedback}
                            onChange={(e) =>
                                handleChange('guardian_feedback', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات المرشد
                        </Label>
                        <Textarea
                            placeholder="ملاحظات المرشد الشاملة"
                            value={formData.counselor_notes}
                            onChange={(e) =>
                                handleChange('counselor_notes', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">الخطوات التالية</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الخطوات التالية
                        </Label>
                        <Textarea
                            placeholder="الخطوات المقترحة للمرحلة القادمة"
                            value={formData.next_steps}
                            onChange={(e) =>
                                handleChange('next_steps', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                توصية المتابعة
                            </Label>
                            <Select
                                value={formData.follow_up_recommendation}
                                onValueChange={(value) =>
                                    handleChange('follow_up_recommendation', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="متابعة مستمرة">متابعة مستمرة</SelectItem>
                                    <SelectItem value="متابعة دورية">متابعة دورية</SelectItem>
                                    <SelectItem value="متابعة عند الحاجة">متابعة عند الحاجة</SelectItem>
                                    <SelectItem value="إنهاء البرنامج">إنهاء البرنامج</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ المتابعة القادمة
                            </Label>
                            <Input
                                type="date"
                                value={formData.recommended_follow_up_date}
                                onChange={(e) =>
                                    handleChange('recommended_follow_up_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                اسم المرشد
                            </Label>
                            <Input
                                placeholder="اسم المرشد"
                                value={formData.counselor_name}
                                onChange={(e) =>
                                    handleChange('counselor_name', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ التوقيع
                            </Label>
                            <Input
                                type="date"
                                value={formData.counselor_signature_date}
                                onChange={(e) =>
                                    handleChange('counselor_signature_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تقييم الفعالية
                            </Label>
                            <Select
                                value={formData.effectiveness_rating}
                                onValueChange={(value) =>
                                    handleChange('effectiveness_rating', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="فعالة جداً">فعالة جداً</SelectItem>
                                    <SelectItem value="فعالة">فعالة</SelectItem>
                                    <SelectItem value="متوسطة">متوسطة</SelectItem>
                                    <SelectItem value="غير فعالة">غير فعالة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات عامة
                        </Label>
                        <Textarea
                            placeholder="ملاحظات إضافية"
                            value={formData.notes}
                            onChange={(e) =>
                                handleChange('notes', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ التقرير'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
