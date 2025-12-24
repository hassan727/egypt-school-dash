import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getEgyptianDateString } from '@/utils/helpers';

interface GuardianSummonsFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function GuardianSummonsForm({
    onSubmit,
    onCancel,
    isLoading = false,
}: GuardianSummonsFormProps) {
    const [formData, setFormData] = useState({
        summons_date: getEgyptianDateString(),
        summons_time: '08:00',
        reason_for_summons: '',
        guardian_name: '',
        guardian_relationship: '',
        guardian_phone: '',
        attendance_date: '',
        attendance_time: '08:00',
        did_attend: false,
        meeting_summary: '',
        discussion_points: '',
        agreed_actions: '',
        meeting_notes: '',
        counselor_name: '',
        follow_up_required: false,
        follow_up_date: '',
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">استدعاء ولي أمر</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الاستدعاء</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ الاستدعاء
                            </Label>
                            <Input
                                type="date"
                                value={formData.summons_date}
                                onChange={(e) =>
                                    handleChange('summons_date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                وقت الاستدعاء
                            </Label>
                            <Input
                                type="time"
                                value={formData.summons_time}
                                onChange={(e) =>
                                    handleChange('summons_time', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            سبب الاستدعاء
                        </Label>
                        <Textarea
                            placeholder="اكتب السبب الرئيسي لاستدعاء ولي الأمر"
                            value={formData.reason_for_summons}
                            onChange={(e) =>
                                handleChange('reason_for_summons', e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات ولي الأمر</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                اسم ولي الأمر
                            </Label>
                            <Input
                                placeholder="اسم ولي الأمر الكامل"
                                value={formData.guardian_name}
                                onChange={(e) =>
                                    handleChange('guardian_name', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                صلة القرابة
                            </Label>
                            <Input
                                placeholder="والد، والدة، عم، إلخ"
                                value={formData.guardian_relationship}
                                onChange={(e) =>
                                    handleChange('guardian_relationship', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                رقم الهاتف
                            </Label>
                            <Input
                                placeholder="رقم الهاتف"
                                value={formData.guardian_phone}
                                onChange={(e) =>
                                    handleChange('guardian_phone', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الحضور</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                تاريخ الحضور المتوقع
                            </Label>
                            <Input
                                type="date"
                                value={formData.attendance_date}
                                onChange={(e) =>
                                    handleChange('attendance_date', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                وقت الحضور المتوقع
                            </Label>
                            <Input
                                type="time"
                                value={formData.attendance_time}
                                onChange={(e) =>
                                    handleChange('attendance_time', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.did_attend}
                                    onChange={(e) =>
                                        handleChange('did_attend', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                هل حضر ولي الأمر
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">تفاصيل الاجتماع</h3>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                ملخص الاجتماع
                            </Label>
                            <Textarea
                                placeholder="اكتب ملخص الاجتماع وما تم مناقشته"
                                value={formData.meeting_summary}
                                onChange={(e) =>
                                    handleChange('meeting_summary', e.target.value)
                                }
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                نقاط النقاش
                            </Label>
                            <Textarea
                                placeholder="النقاط الرئيسية التي تم مناقشتها"
                                value={formData.discussion_points}
                                onChange={(e) =>
                                    handleChange('discussion_points', e.target.value)
                                }
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                الإجراءات المتفق عليها
                            </Label>
                            <Textarea
                                placeholder="الخطوات المتفق عليها مع ولي الأمر"
                                value={formData.agreed_actions}
                                onChange={(e) =>
                                    handleChange('agreed_actions', e.target.value)
                                }
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                ملاحظات الاجتماع
                            </Label>
                            <Textarea
                                placeholder="ملاحظات عامة عن الاجتماع"
                                value={formData.meeting_notes}
                                onChange={(e) =>
                                    handleChange('meeting_notes', e.target.value)
                                }
                                rows={2}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                اسم المرشد/الموظف
                            </Label>
                            <Input
                                placeholder="من أجرى الاستدعاء"
                                value={formData.counselor_name}
                                onChange={(e) =>
                                    handleChange('counselor_name', e.target.value)
                                }
                            />
                        </div>
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
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الاستدعاء'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
