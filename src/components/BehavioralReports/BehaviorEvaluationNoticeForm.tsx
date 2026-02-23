import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface BehaviorEvaluationNoticeFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function BehaviorEvaluationNoticeForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: BehaviorEvaluationNoticeFormProps) {
    const [formData, setFormData] = useState({
        evaluation_period: 'شهري',
        evaluation_start_date: getEgyptianDateString(),
        evaluation_end_date: getEgyptianDateString(),
        behavior_rating: 'جيد',
        attendance_summary: '',
        behavioral_summary: '',
        positive_aspects: '',
        areas_for_improvement: '',
        counselor_recommendations: '',
        parent_notification_date: '',
        guardian_signature_date: '',
        guardian_name: '',
        counselor_name: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">إخطار تقييم السلوك</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">فترة التقييم</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                نوع الفترة
                            </Label>
                            <Select
                                value={formData.evaluation_period}
                                onValueChange={(value) =>
                                    handleChange('evaluation_period', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="شهري">شهري</SelectItem>
                                    <SelectItem value="فصلي">فصلي</SelectItem>
                                    <SelectItem value="سنوي">سنوي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ البداية
                            </Label>
                            <Input
                                type="date"
                                value={formData.evaluation_start_date}
                                onChange={(e) =>
                                    handleChange('evaluation_start_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ النهاية
                            </Label>
                            <Input
                                type="date"
                                value={formData.evaluation_end_date}
                                onChange={(e) =>
                                    handleChange('evaluation_end_date', e.target.value)
                                }
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التقييم</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            تقييم السلوك
                        </Label>
                        <Select
                            value={formData.behavior_rating}
                            onValueChange={(value) =>
                                handleChange('behavior_rating', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ممتاز">ممتاز</SelectItem>
                                <SelectItem value="جيد جداً">جيد جداً</SelectItem>
                                <SelectItem value="جيد">جيد</SelectItem>
                                <SelectItem value="مقبول">مقبول</SelectItem>
                                <SelectItem value="ضعيف">ضعيف</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملخص الحضور
                        </Label>
                        <Textarea
                            placeholder="ملخص معلومات الحضور والغياب"
                            value={formData.attendance_summary}
                            onChange={(e) =>
                                handleChange('attendance_summary', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملخص السلوك
                        </Label>
                        <Textarea
                            placeholder="ملخص شامل لسلوك الطالب خلال الفترة"
                            value={formData.behavioral_summary}
                            onChange={(e) =>
                                handleChange('behavioral_summary', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">الملاحظات والتوصيات</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الجوانب الإيجابية
                        </Label>
                        <Textarea
                            placeholder="الجوانب الإيجابية في سلوك الطالب"
                            value={formData.positive_aspects}
                            onChange={(e) =>
                                handleChange('positive_aspects', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            المجالات المراد تحسينها
                        </Label>
                        <Textarea
                            placeholder="المجالات التي تحتاج تحسين"
                            value={formData.areas_for_improvement}
                            onChange={(e) =>
                                handleChange('areas_for_improvement', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            توصيات المرشد
                        </Label>
                        <Textarea
                            placeholder="التوصيات والمقترحات من المرشد"
                            value={formData.counselor_recommendations}
                            onChange={(e) =>
                                handleChange('counselor_recommendations', e.target.value)
                            }
                            rows={3}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الإخطار</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ إخطار الوالد
                            </Label>
                            <Input
                                type="date"
                                value={formData.parent_notification_date}
                                onChange={(e) =>
                                    handleChange('parent_notification_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ توقيع ولي الأمر
                            </Label>
                            <Input
                                type="date"
                                value={formData.guardian_signature_date}
                                onChange={(e) =>
                                    handleChange('guardian_signature_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                اسم ولي الأمر
                            </Label>
                            <Input
                                placeholder="اسم ولي الأمر"
                                value={formData.guardian_name}
                                onChange={(e) =>
                                    handleChange('guardian_name', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                اسم المرشد
                            </Label>
                            <Input
                                placeholder="اسم المرشد النفسي"
                                value={formData.counselor_name}
                                onChange={(e) =>
                                    handleChange('counselor_name', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الإخطار'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
