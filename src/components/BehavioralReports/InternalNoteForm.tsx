import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface InternalNoteFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function InternalNoteForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: InternalNoteFormProps) {
    const [formData, setFormData] = useState({
        note_date: getEgyptianDateString(),
        note_type: 'ملاحظة عامة',
        note_content: '',
        observed_behavior: '',
        context_information: '',
        recommended_actions: '',
        priority_level: 'عادي',
        follow_up_required: false,
        follow_up_date: '',
        created_by_name: '',
        created_by_role: '',
        visibility_scope: 'داخلي',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">مذكرة داخلية</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4 bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">
                        ℹ️ هذه مذكرة داخلية للاستخدام بين المرشدين والإدارة فقط
                    </p>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات المذكرة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ المذكرة
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
                                نوع المذكرة
                            </Label>
                            <Select
                                value={formData.note_type}
                                onValueChange={(value) =>
                                    handleChange('note_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ملاحظة عامة">ملاحظة عامة</SelectItem>
                                    <SelectItem value="ملاحظة تحذيرية">ملاحظة تحذيرية</SelectItem>
                                    <SelectItem value="ملاحظة طبية">ملاحظة طبية</SelectItem>
                                    <SelectItem value="ملاحظة نفسية">ملاحظة نفسية</SelectItem>
                                    <SelectItem value="ملاحظة أكاديمية">ملاحظة أكاديمية</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                مستوى الأولوية
                            </Label>
                            <Select
                                value={formData.priority_level}
                                onValueChange={(value) =>
                                    handleChange('priority_level', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="عادي">عادي</SelectItem>
                                    <SelectItem value="مهم">مهم</SelectItem>
                                    <SelectItem value="حساس">حساس</SelectItem>
                                    <SelectItem value="طارئ">طارئ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">محتوى المذكرة</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            المذكرة
                        </Label>
                        <Textarea
                            placeholder="اكتب محتوى المذكرة"
                            value={formData.note_content}
                            onChange={(e) =>
                                handleChange('note_content', e.target.value)
                            }
                            rows={4}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            السلوك الملاحظ
                        </Label>
                        <Textarea
                            placeholder="وصف السلوك أو المشكلة الملاحظة"
                            value={formData.observed_behavior}
                            onChange={(e) =>
                                handleChange('observed_behavior', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            معلومات السياق
                        </Label>
                        <Textarea
                            placeholder="معلومات إضافية عن السياق والظروف"
                            value={formData.context_information}
                            onChange={(e) =>
                                handleChange('context_information', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الإجراءات المقترحة
                        </Label>
                        <Textarea
                            placeholder="الإجراءات والتوصيات المقترحة"
                            value={formData.recommended_actions}
                            onChange={(e) =>
                                handleChange('recommended_actions', e.target.value)
                            }
                            rows={2}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">المتابعة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.follow_up_required}
                                    onChange={(e) =>
                                        handleChange('follow_up_required', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                تطلب متابعة
                            </Label>
                        </div>

                        {formData.follow_up_required && (
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
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الإنشاء</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                المنشئ (الاسم)
                            </Label>
                            <Input
                                placeholder="اسم من أنشأ المذكرة"
                                value={formData.created_by_name}
                                onChange={(e) =>
                                    handleChange('created_by_name', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                الدور/الوظيفة
                            </Label>
                            <Input
                                placeholder="مرشد، معلم، إداري"
                                value={formData.created_by_role}
                                onChange={(e) =>
                                    handleChange('created_by_role', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            نطاق الرؤية
                        </Label>
                        <Select
                            value={formData.visibility_scope}
                            onValueChange={(value) =>
                                handleChange('visibility_scope', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="داخلي">داخلي (مرشد فقط)</SelectItem>
                                <SelectItem value="إدارة">الإدارة والمرشدين</SelectItem>
                                <SelectItem value="معلمين">المعلمين والمرشدين</SelectItem>
                            </SelectContent>
                        </Select>
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
                        className="bg-slate-600 hover:bg-slate-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ المذكرة'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
