import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface PledgeCommitmentFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function PledgeCommitmentForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: PledgeCommitmentFormProps) {
    const [formData, setFormData] = useState({
        pledge_date: getEgyptianDateString(),
        pledge_content: '',
        commitment_duration_days: 30,
        committed_actions: '',
        student_signature_date: '',
        guardian_signature_date: '',
        guardian_name: '',
        witness_names: '',
        counselor_name: '',
        counselor_signature_date: '',
        compliance_status: 'قيد المراقبة',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">إقرار وتعهد</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات التعهد</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ التعهد
                            </Label>
                            <Input
                                type="date"
                                value={formData.pledge_date}
                                onChange={(e) =>
                                    handleChange('pledge_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                مدة التعهد (أيام)
                            </Label>
                            <Input
                                type="number"
                                value={formData.commitment_duration_days}
                                onChange={(e) =>
                                    handleChange('commitment_duration_days', parseInt(e.target.value))
                                }
                                min="1"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            محتوى التعهد
                        </Label>
                        <Textarea
                            placeholder="اكتب محتوى التعهد الكامل"
                            value={formData.pledge_content}
                            onChange={(e) =>
                                handleChange('pledge_content', e.target.value)
                            }
                            rows={4}
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            الإجراءات المتعهد بها
                        </Label>
                        <Textarea
                            placeholder="الإجراءات والأفعال المتعهد بها من قبل الطالب"
                            value={formData.committed_actions}
                            onChange={(e) =>
                                handleChange('committed_actions', e.target.value)
                            }
                            rows={3}
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">التوقيعات</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ توقيع الطالب
                            </Label>
                            <Input
                                type="date"
                                value={formData.student_signature_date}
                                onChange={(e) =>
                                    handleChange('student_signature_date', e.target.value)
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                أسماء الشهود
                            </Label>
                            <Textarea
                                placeholder="أسماء الشهود على التعهد"
                                value={formData.witness_names}
                                onChange={(e) =>
                                    handleChange('witness_names', e.target.value)
                                }
                                rows={2}
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

                    <div className="mt-4">
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
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">متابعة الالتزام</h3>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            حالة الالتزام
                        </Label>
                        <Select
                            value={formData.compliance_status}
                            onValueChange={(value) =>
                                handleChange('compliance_status', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="قيد المراقبة">قيد المراقبة</SelectItem>
                                <SelectItem value="ملتزم">ملتزم</SelectItem>
                                <SelectItem value="متخلف">متخلف</SelectItem>
                                <SelectItem value="مكتمل">مكتمل</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات
                        </Label>
                        <Textarea
                            placeholder="ملاحظات إضافية حول التعهد والالتزام"
                            value={formData.notes}
                            onChange={(e) =>
                                handleChange('notes', e.target.value)
                            }
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="bg-pink-600 hover:bg-pink-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ التعهد'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
