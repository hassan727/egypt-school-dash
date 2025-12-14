import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEgyptianDateString } from '@/utils/helpers';

interface ViolationConfessionFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ViolationConfessionForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: ViolationConfessionFormProps) {
    const [formData, setFormData] = useState({
        confession_date: getEgyptianDateString(),
        confession_time: '08:00',
        violation_description: '',
        student_confession: '',
        student_acknowledgment: false,
        witnessed_by: '',
        legal_guardian_present: false,
        guardian_name: '',
        guardian_signature_date: '',
        counselor_name: '',
        counselor_notes: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">إقرار بارتكاب مخالفة</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            تاريخ الإقرار
                        </Label>
                        <Input
                            type="date"
                            value={formData.confession_date}
                            onChange={(e) =>
                                handleChange('confession_date', e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            وقت الإقرار
                        </Label>
                        <Input
                            type="time"
                            value={formData.confession_time}
                            onChange={(e) =>
                                handleChange('confession_time', e.target.value)
                            }
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        وصف المخالفة
                    </Label>
                    <Textarea
                        placeholder="اكتب وصفاً دقيقاً للمخالفة"
                        value={formData.violation_description}
                        onChange={(e) =>
                            handleChange('violation_description', e.target.value)
                        }
                        rows={4}
                        required
                    />
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        اعتراف الطالب الكتابي
                    </Label>
                    <Textarea
                        placeholder="اعتراف الطالب بالمخالفة بصيغته الخاصة"
                        value={formData.student_confession}
                        onChange={(e) =>
                            handleChange('student_confession', e.target.value)
                        }
                        rows={4}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            شاهدوا الاعتراف
                        </Label>
                        <Input
                            placeholder="أسماء الشهود"
                            value={formData.witnessed_by}
                            onChange={(e) => handleChange('witnessed_by', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.student_acknowledgment}
                                onChange={(e) =>
                                    handleChange('student_acknowledgment', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            تأكيد الطالب
                        </Label>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات ولي الأمر</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.legal_guardian_present}
                                    onChange={(e) =>
                                        handleChange('legal_guardian_present', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                حضر ولي الأمر
                            </Label>
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

                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">ملاحظات المرشد</h3>

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
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ملاحظات المرشد
                        </Label>
                        <Textarea
                            placeholder="ملاحظات المرشد النفسي حول الإقرار والطالب"
                            value={formData.counselor_notes}
                            onChange={(e) =>
                                handleChange('counselor_notes', e.target.value)
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
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الإقرار'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
