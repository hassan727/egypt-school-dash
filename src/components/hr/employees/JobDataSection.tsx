import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Briefcase, Save, CheckCircle } from "lucide-react";

export interface JobData {
    job_title: string;
    employee_type: string;
    contract_type: string;
    hire_date: string;
    status: string;
}

interface JobDataSectionProps {
    data: JobData;
    onSave: (data: JobData) => void;
    isReadOnly?: boolean;
}

export const JobDataSection = ({ data, onSave, isReadOnly = false }: JobDataSectionProps) => {
    const [formData, setFormData] = useState<JobData>(data);
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        setFormData(data);
    }, [data]);

    const handleChange = (field: keyof JobData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setIsModified(true);
    };

    const handleSave = () => {
        onSave(formData);
        setIsModified(false);
    };

    return (
        <Card className="border-purple-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-purple-500" />
            <CardHeader className="bg-purple-50/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-purple-800">
                    <Briefcase className="h-5 w-5" />
                    البيانات الوظيفية
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Job Title */}
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="job_title">المسمى الوظيفي <span className="text-red-500">*</span></Label>
                        <Input
                            id="job_title"
                            value={formData.job_title}
                            onChange={(e) => handleChange("job_title", e.target.value)}
                            placeholder="مثال: معلم لغة عربية"
                            disabled={isReadOnly}
                            className="font-semibold"
                        />
                    </div>

                    {/* Hire Date */}
                    <div className="space-y-2">
                        <Label htmlFor="hire_date">تاريخ التعيين <span className="text-red-500">*</span></Label>
                        <Input
                            id="hire_date"
                            type="date"
                            value={formData.hire_date}
                            onChange={(e) => handleChange("hire_date", e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Employee Type */}
                    <div className="space-y-2">
                        <Label htmlFor="employee_type">نظام العمل</Label>
                        <Select
                            value={formData.employee_type}
                            onValueChange={(v) => handleChange("employee_type", v)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نظام العمل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full_time">دوام كامل</SelectItem>
                                <SelectItem value="part_time">دوام جزئي</SelectItem>
                                <SelectItem value="contract">عقد مؤقت</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contract Type */}
                    <div className="space-y-2">
                        <Label htmlFor="contract_type">نوع العقد</Label>
                        <Select
                            value={formData.contract_type}
                            onValueChange={(v) => handleChange("contract_type", v)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نوع العقد" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="permanent">دائم</SelectItem>
                                <SelectItem value="temporary">مؤقت / سنوي</SelectItem>
                                <SelectItem value="probation">تحت الاختبار</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">حالة الموظف</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(v) => handleChange("status", v)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">نشط / على رأس العمل</SelectItem>
                                <SelectItem value="vacation">في إجازة</SelectItem>
                                <SelectItem value="suspended">موقف مؤقتاً</SelectItem>
                                <SelectItem value="terminated">منتهي خدماته</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Save/Status Footer */}
                {!isReadOnly && (
                    <div className="flex justify-end border-t pt-4 mt-4">
                        {isModified ? (
                            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                                <Save className="w-4 h-4 ml-2" />
                                حفظ التغييرات
                            </Button>
                        ) : (
                            <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 pointer-events-none">
                                <CheckCircle className="w-4 h-4 ml-2" />
                                تم الحفظ
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
