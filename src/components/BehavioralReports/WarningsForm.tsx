import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface WarningsFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function WarningsForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: WarningsFormProps) {
    const [formData, setFormData] = useState({
        warning_type: 'خطي',
        warning_level: 1,
        warning_date: getEgyptianDateString(),
        reason: '',
        warning_content: '',
        previously_warned: false,
        previous_warning_dates: '',
        issued_by: '',
        issued_date: getEgyptianDateString(),
        guardian_notification_date: '',
        guardian_signature_date: '',
        effectiveness_review_date: '',
        effectiveness_status: '',
        next_step: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">إنذار</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الإنذار</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                نوع الإنذار
                            </Label>
                            <Select
                                value={formData.warning_type}
                                onValueChange={(value) =>
                                    handleChange('warning_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="شفهي">شفهي</SelectItem>
                                    <SelectItem value="خطي">خطي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                مستوى الإنذار
                            </Label>
                            <Select
                                value={formData.warning_level.toString()}
                                onValueChange={(value) =>
                                    handleChange('warning_level', parseInt(value))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <SelectItem key={level} value={level.toString()}>
                                            المستوى {level}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            السبب
                        </Label>
                        <Textarea
                            placeholder="السبب وراء إصدار الإنذار"
                            value={formData.reason}
                            onChange={(e) =>
                                handleChange('reason', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            محتوى الإنذار
                        </Label>
                        <Textarea
                            placeholder="محتوى الإنذار الرسمي"
                            value={formData.warning_content}
                            onChange={(e) =>
                                handleChange('warning_content', e.target.value)
                            }
                            rows={4}
                            required
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">السجل السابق</h3>

                    <div className="mb-4">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.previously_warned}
                                onChange={(e) =>
                                    handleChange('previously_warned', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            تم إنذاره سابقاً
                        </Label>
                    </div>

                    {formData.previously_warned && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تواريخ الإنذارات السابقة
                            </Label>
                            <Textarea
                                placeholder="أدرج تواريخ الإنذارات السابقة"
                                value={formData.previous_warning_dates}
                                onChange={(e) =>
                                    handleChange('previous_warning_dates', e.target.value)
                                }
                                rows={2}
                            />
                        </div>
                    )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ إخطار ولي الأمر
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
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">متابعة الفعالية</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ مراجعة الفعالية
                            </Label>
                            <Input
                                type="date"
                                value={formData.effectiveness_review_date}
                                onChange={(e) =>
                                    handleChange('effectiveness_review_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                حالة الفعالية
                            </Label>
                            <Select
                                value={formData.effectiveness_status}
                                onValueChange={(value) =>
                                    handleChange('effectiveness_status', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="فعال">فعال</SelectItem>
                                    <SelectItem value="جزئياً فعال">جزئياً فعال</SelectItem>
                                    <SelectItem value="غير فعال">غير فعال</SelectItem>
                                    <SelectItem value="قيد التقييم">قيد التقييم</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الخطوة التالية
                        </Label>
                        <Input
                            placeholder="الإجراء التالي المقترح"
                            value={formData.next_step}
                            onChange={(e) =>
                                handleChange('next_step', e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات
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
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الإنذار'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
