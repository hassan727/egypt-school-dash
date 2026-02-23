import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface PositiveNoteFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function PositiveNoteForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: PositiveNoteFormProps) {
    const [formData, setFormData] = useState({
        note_date: getEgyptianDateString(),
        positive_behavior: '',
        behavior_context: '',
        achievement_type: 'سلوك إيجابي',
        impact_on_school_community: '',
        encouraging_words: '',
        recognized_by_name: '',
        recognized_by_role: '',
        visibility: 'عام',
        share_with_parents: false,
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">ملاحظة إيجابية</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4 bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">
                        ✨ وثق السلوكيات والإنجازات الإيجابية للطالب
                    </p>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الملاحظة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ الملاحظة
                            </Label>
                            <Input
                                type="date"
                                value={formData.note_date}
                                onChange={(e) =>
                                    handleChange('note_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                نوع الإنجاز
                            </Label>
                            <Select
                                value={formData.achievement_type}
                                onValueChange={(value) =>
                                    handleChange('achievement_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="سلوك إيجابي">سلوك إيجابي</SelectItem>
                                    <SelectItem value="مساعدة الآخرين">مساعدة الآخرين</SelectItem>
                                    <SelectItem value="قيادة">قيادة</SelectItem>
                                    <SelectItem value="إنجاز أكاديمي">إنجاز أكاديمي</SelectItem>
                                    <SelectItem value="مشاركة">مشاركة</SelectItem>
                                    <SelectItem value="استفسار ممتاز">استفسار ممتاز</SelectItem>
                                    <SelectItem value="تحسن ملحوظ">تحسن ملحوظ</SelectItem>
                                    <SelectItem value="مبادرة">مبادرة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">تفاصيل الإنجاز</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            السلوك الإيجابي
                        </Label>
                        <Textarea
                            placeholder="وصف السلوك الإيجابي أو الإنجاز"
                            value={formData.positive_behavior}
                            onChange={(e) =>
                                handleChange('positive_behavior', e.target.value)
                            }
                            rows={4}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            السياق
                        </Label>
                        <Textarea
                            placeholder="السياق والظروف التي حدث فيها هذا السلوك"
                            value={formData.behavior_context}
                            onChange={(e) =>
                                handleChange('behavior_context', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            التأثير على المجتمع المدرسي
                        </Label>
                        <Textarea
                            placeholder="كيف يؤثر هذا الإنجاز على المجتمع المدرسي"
                            value={formData.impact_on_school_community}
                            onChange={(e) =>
                                handleChange('impact_on_school_community', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            كلمات تشجيعية
                        </Label>
                        <Textarea
                            placeholder="كلمات تشجيعية وتحفيزية للطالب"
                            value={formData.encouraging_words}
                            onChange={(e) =>
                                handleChange('encouraging_words', e.target.value)
                            }
                            rows={3}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الاعتراف</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                المعترف به (الاسم)
                            </Label>
                            <Input
                                placeholder="اسم من يسجل هذا الإنجاز"
                                value={formData.recognized_by_name}
                                onChange={(e) =>
                                    handleChange('recognized_by_name', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                الدور/الوظيفة
                            </Label>
                            <Input
                                placeholder="معلم، مرشد، إداري"
                                value={formData.recognized_by_role}
                                onChange={(e) =>
                                    handleChange('recognized_by_role', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                نطاق الرؤية
                            </Label>
                            <Select
                                value={formData.visibility}
                                onValueChange={(value) =>
                                    handleChange('visibility', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="عام">عام</SelectItem>
                                    <SelectItem value="الفصل">الفصل</SelectItem>
                                    <SelectItem value="المدرسة">المدرسة</SelectItem>
                                    <SelectItem value="خاص">خاص</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.share_with_parents}
                                    onChange={(e) =>
                                        handleChange('share_with_parents', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                مشاركة مع الوالدين
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">ملاحظات إضافية</h3>

                    <div>
                        <Textarea
                            placeholder="أي ملاحظات أخرى"
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
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
