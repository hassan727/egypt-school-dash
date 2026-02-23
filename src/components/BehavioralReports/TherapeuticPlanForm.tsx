import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface TherapeuticPlanFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function TherapeuticPlanForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: TherapeuticPlanFormProps) {
    const [formData, setFormData] = useState({
        plan_start_date: getEgyptianDateString(),
        plan_duration_days: 30,
        plan_end_date: '',
        behavioral_issues_identified: '',
        plan_objectives: '',
        therapeutic_strategies: '',
        teacher_responsibilities: '',
        counselor_responsibilities: '',
        guardian_responsibilities: '',
        student_responsibilities: '',
        expected_outcomes: '',
        monitoring_frequency: 'أسبوعي',
        monitoring_method: '',
        key_contacts: '',
        counselor_name: '',
        counselor_signature_date: '',
        guardian_agreement: false,
        guardian_signature_date: '',
        guardian_name: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">خطة علاجية</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">فترة الخطة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ البداية
                            </Label>
                            <Input
                                type="date"
                                value={formData.plan_start_date}
                                onChange={(e) =>
                                    handleChange('plan_start_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                المدة (أيام)
                            </Label>
                            <Input
                                type="number"
                                value={formData.plan_duration_days}
                                onChange={(e) =>
                                    handleChange('plan_duration_days', parseInt(e.target.value))
                                }
                                min="1"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ النهاية
                            </Label>
                            <Input
                                type="date"
                                value={formData.plan_end_date}
                                onChange={(e) =>
                                    handleChange('plan_end_date', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التشخيص والأهداف</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            المشاكل السلوكية المحددة
                        </Label>
                        <Textarea
                            placeholder="وصف المشاكل السلوكية المحددة للطالب"
                            value={formData.behavioral_issues_identified}
                            onChange={(e) =>
                                handleChange('behavioral_issues_identified', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            أهداف الخطة
                        </Label>
                        <Textarea
                            placeholder="الأهداف المراد تحقيقها من الخطة العلاجية"
                            value={formData.plan_objectives}
                            onChange={(e) =>
                                handleChange('plan_objectives', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الاستراتيجيات العلاجية
                        </Label>
                        <Textarea
                            placeholder="الاستراتيجيات والتقنيات المستخدمة"
                            value={formData.therapeutic_strategies}
                            onChange={(e) =>
                                handleChange('therapeutic_strategies', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            النتائج المتوقعة
                        </Label>
                        <Textarea
                            placeholder="ما هي النتائج المتوقعة من تطبيق الخطة"
                            value={formData.expected_outcomes}
                            onChange={(e) =>
                                handleChange('expected_outcomes', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">المسؤوليات</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            مسؤوليات المعلم
                        </Label>
                        <Textarea
                            placeholder="المهام والمسؤوليات على المعلم"
                            value={formData.teacher_responsibilities}
                            onChange={(e) =>
                                handleChange('teacher_responsibilities', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            مسؤوليات المرشد
                        </Label>
                        <Textarea
                            placeholder="المهام والمسؤوليات على المرشد النفسي"
                            value={formData.counselor_responsibilities}
                            onChange={(e) =>
                                handleChange('counselor_responsibilities', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            مسؤوليات ولي الأمر
                        </Label>
                        <Textarea
                            placeholder="المهام والمسؤوليات على ولي الأمر"
                            value={formData.guardian_responsibilities}
                            onChange={(e) =>
                                handleChange('guardian_responsibilities', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            مسؤوليات الطالب
                        </Label>
                        <Textarea
                            placeholder="ما هو المطلوب من الطالب"
                            value={formData.student_responsibilities}
                            onChange={(e) =>
                                handleChange('student_responsibilities', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">المتابعة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تكرار المتابعة
                            </Label>
                            <Select
                                value={formData.monitoring_frequency}
                                onValueChange={(value) =>
                                    handleChange('monitoring_frequency', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="يومي">يومي</SelectItem>
                                    <SelectItem value="أسبوعي">أسبوعي</SelectItem>
                                    <SelectItem value="شهري">شهري</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                طريقة المتابعة
                            </Label>
                            <Input
                                placeholder="مثال: اجتماعات، ملاحظات، اختبارات"
                                value={formData.monitoring_method}
                                onChange={(e) =>
                                    handleChange('monitoring_method', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            جهات الاتصال الرئيسية
                        </Label>
                        <Textarea
                            placeholder="أسماء وأرقام جهات الاتصال المهمة"
                            value={formData.key_contacts}
                            onChange={(e) =>
                                handleChange('key_contacts', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التوقيعات والموافقة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ توقيع المرشد
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
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.guardian_agreement}
                                    onChange={(e) =>
                                        handleChange('guardian_agreement', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                موافقة ولي الأمر
                            </Label>
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
                                    <SelectItem value="متوسطة الفعالية">متوسطة الفعالية</SelectItem>
                                    <SelectItem value="غير فعالة">غير فعالة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات
                        </Label>
                        <Textarea
                            placeholder="ملاحظات إضافية حول الخطة"
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
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الخطة'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
