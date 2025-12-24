import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface ExpulsionWarningFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ExpulsionWarningForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: ExpulsionWarningFormProps) {
    const [formData, setFormData] = useState({
        warning_date: getEgyptianDateString(),
        reason_for_warning: '',
        previous_violations_summary: '',
        violation_severity: 'خطيرة',
        final_warning_content: '',
        consequences_explained: '',
        issued_by: '',
        issued_date: getEgyptianDateString(),
        guardian_notification_method: 'كتابي',
        guardian_notification_date: '',
        guardian_acknowledged: false,
        guardian_signature_date: '',
        guardian_name: '',
        counselor_recommendation: '',
        appeal_allowed: false,
        appeal_deadline: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">إنذار بالفصل</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الإنذار</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ الإنذار
                            </Label>
                            <Input
                                type="date"
                                value={formData.warning_date}
                                onChange={(e) =>
                                    handleChange('warning_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                درجة الخطورة
                            </Label>
                            <Select
                                value={formData.violation_severity}
                                onValueChange={(value) =>
                                    handleChange('violation_severity', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="خطيرة">خطيرة</SelectItem>
                                    <SelectItem value="حرجة">حرجة</SelectItem>
                                    <SelectItem value="غاية في الخطورة">غاية في الخطورة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            سبب الإنذار
                        </Label>
                        <Textarea
                            placeholder="السبب الرئيسي للإنذار بالفصل"
                            value={formData.reason_for_warning}
                            onChange={(e) =>
                                handleChange('reason_for_warning', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملخص المخالفات السابقة
                        </Label>
                        <Textarea
                            placeholder="ملخص للمخالفات السابقة والتحذيرات"
                            value={formData.previous_violations_summary}
                            onChange={(e) =>
                                handleChange('previous_violations_summary', e.target.value)
                            }
                            rows={3}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">محتوى الإنذار</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            محتوى الإنذار النهائي
                        </Label>
                        <Textarea
                            placeholder="محتوى الإنذار النهائي بالفصل"
                            value={formData.final_warning_content}
                            onChange={(e) =>
                                handleChange('final_warning_content', e.target.value)
                            }
                            rows={4}
                            required
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            شرح العواقب
                        </Label>
                        <Textarea
                            placeholder="شرح العواقب التي قد تترتب على استمرار السلوك"
                            value={formData.consequences_explained}
                            onChange={(e) =>
                                handleChange('consequences_explained', e.target.value)
                            }
                            rows={3}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الإصدار</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                أصدره
                            </Label>
                            <Input
                                placeholder="اسم من أصدر الإنذار"
                                value={formData.issued_by}
                                onChange={(e) =>
                                    handleChange('issued_by', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ الإصدار
                            </Label>
                            <Input
                                type="date"
                                value={formData.issued_date}
                                onChange={(e) =>
                                    handleChange('issued_date', e.target.value)
                                }
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">إخطار ولي الأمر</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                طريقة الإخطار
                            </Label>
                            <Select
                                value={formData.guardian_notification_method}
                                onValueChange={(value) =>
                                    handleChange('guardian_notification_method', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="كتابي">كتابي</SelectItem>
                                    <SelectItem value="شفهي">شفهي</SelectItem>
                                    <SelectItem value="هاتفي">هاتفي</SelectItem>
                                    <SelectItem value="شخصي">شخصي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ الإخطار
                            </Label>
                            <Input
                                type="date"
                                value={formData.guardian_notification_date}
                                onChange={(e) =>
                                    handleChange('guardian_notification_date', e.target.value)
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
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.guardian_acknowledged}
                                    onChange={(e) =>
                                        handleChange('guardian_acknowledged', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                أقر ولي الأمر بالاستلام
                            </Label>
                        </div>
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
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التوصيات والاستئناف</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            توصية المرشد
                        </Label>
                        <Textarea
                            placeholder="توصية المرشد النفسي بشأن الإنذار"
                            value={formData.counselor_recommendation}
                            onChange={(e) =>
                                handleChange('counselor_recommendation', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.appeal_allowed}
                                    onChange={(e) =>
                                        handleChange('appeal_allowed', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                يُسمح بالاستئناف
                            </Label>
                        </div>

                        {formData.appeal_allowed && (
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                    آخر موعد للاستئناف
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.appeal_deadline}
                                    onChange={(e) =>
                                        handleChange('appeal_deadline', e.target.value)
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الإنذار'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
