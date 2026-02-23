import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface ExpulsionDecisionFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ExpulsionDecisionForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: ExpulsionDecisionFormProps) {
    const [formData, setFormData] = useState({
        decision_date: getEgyptianDateString(),
        final_reason: '',
        violation_history: '',
        decision_justification: '',
        expulsion_type: 'مؤقتة',
        start_date: getEgyptianDateString(),
        end_date: '',
        is_permanent: false,
        issued_by_name: '',
        issued_by_position: '',
        issued_by_signature_date: '',
        principal_approved_date: '',
        guardian_notification_date: '',
        guardian_name: '',
        appeal_options: '',
        appeal_period_days: 30,
        legal_file_reference: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">قرار فصل</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4 bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium">
                        ⚠️ تحذير: هذا القرار حساس وقانوني. التأكد من صحة جميع البيانات ضروري جداً.
                    </p>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات القرار</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ القرار
                            </Label>
                            <Input
                                type="date"
                                value={formData.decision_date}
                                onChange={(e) =>
                                    handleChange('decision_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                نوع الفصل
                            </Label>
                            <Select
                                value={formData.expulsion_type}
                                onValueChange={(value) =>
                                    handleChange('expulsion_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="مؤقتة">مؤقتة</SelectItem>
                                    <SelectItem value="دائمة">دائمة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            السبب النهائي
                        </Label>
                        <Textarea
                            placeholder="السبب النهائي الذي أدى إلى قرار الفصل"
                            value={formData.final_reason}
                            onChange={(e) =>
                                handleChange('final_reason', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            سجل المخالفات
                        </Label>
                        <Textarea
                            placeholder="سجل المخالفات السابقة والمحاولات المبذولة"
                            value={formData.violation_history}
                            onChange={(e) =>
                                handleChange('violation_history', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            تبرير القرار
                        </Label>
                        <Textarea
                            placeholder="التبرير القانوني والتربوي للقرار"
                            value={formData.decision_justification}
                            onChange={(e) =>
                                handleChange('decision_justification', e.target.value)
                            }
                            rows={4}
                            required
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">فترة الفصل</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ البداية
                            </Label>
                            <Input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) =>
                                    handleChange('start_date', e.target.value)
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
                                value={formData.end_date}
                                onChange={(e) =>
                                    handleChange('end_date', e.target.value)
                                }
                                disabled={formData.is_permanent}
                            />
                        </div>

                        <div>
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.is_permanent}
                                    onChange={(e) =>
                                        handleChange('is_permanent', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                فصل دائم
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التوقيعات</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                أصدره (الاسم والوظيفة)
                            </Label>
                            <Input
                                placeholder="اسم من أصدر القرار"
                                value={formData.issued_by_name}
                                onChange={(e) =>
                                    handleChange('issued_by_name', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                الوظيفة
                            </Label>
                            <Input
                                placeholder="المنصب/الوظيفة"
                                value={formData.issued_by_position}
                                onChange={(e) =>
                                    handleChange('issued_by_position', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ التوقيع
                            </Label>
                            <Input
                                type="date"
                                value={formData.issued_by_signature_date}
                                onChange={(e) =>
                                    handleChange('issued_by_signature_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ موافقة المدير
                            </Label>
                            <Input
                                type="date"
                                value={formData.principal_approved_date}
                                onChange={(e) =>
                                    handleChange('principal_approved_date', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">إخطار ولي الأمر</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">حقوق الاستئناف</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            خيارات الاستئناف
                        </Label>
                        <Textarea
                            placeholder="شرح حقوق الاستئناف والجهات المختصة"
                            value={formData.appeal_options}
                            onChange={(e) =>
                                handleChange('appeal_options', e.target.value)
                            }
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                مدة الاستئناف (يوم)
                            </Label>
                            <Input
                                type="number"
                                value={formData.appeal_period_days}
                                onChange={(e) =>
                                    handleChange('appeal_period_days', parseInt(e.target.value))
                                }
                                min="1"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                رقم ملف التحقيق القانوني
                            </Label>
                            <Input
                                placeholder="رقم الملف"
                                value={formData.legal_file_reference}
                                onChange={(e) =>
                                    handleChange('legal_file_reference', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات إضافية
                        </Label>
                        <Textarea
                            placeholder="ملاحظات قانونية أو إدارية"
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
                        className="bg-red-700 hover:bg-red-800"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'إصدار القرار'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
