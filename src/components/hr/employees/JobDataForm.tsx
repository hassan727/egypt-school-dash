import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface JobData {
    job_title: string;
    employee_type: string;
    contract_type: string;
    hire_date: string;
    status: string;
}

interface JobDataFormProps {
    data: JobData;
    onChange: (field: keyof JobData, value: string) => void;
    isReadOnly?: boolean;
}

export const JobDataForm = ({ data, onChange, isReadOnly = false }: JobDataFormProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="job_title">المسمى الوظيفي</Label>
                <Input
                    id="job_title"
                    value={data.job_title}
                    onChange={(e) => onChange('job_title', e.target.value)}
                    placeholder="مثال: معلم لغة عربية"
                    disabled={isReadOnly}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="hire_date">تاريخ التعيين</Label>
                <Input
                    id="hire_date"
                    type="date"
                    value={data.hire_date}
                    onChange={(e) => onChange('hire_date', e.target.value)}
                    disabled={isReadOnly}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="employee_type">نظام العمل</Label>
                <Select
                    value={data.employee_type}
                    onValueChange={(v) => onChange('employee_type', v)}
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
            <div className="space-y-2">
                <Label htmlFor="contract_type">نوع العقد</Label>
                <Select
                    value={data.contract_type}
                    onValueChange={(v) => onChange('contract_type', v)}
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
            <div className="space-y-2">
                <Label htmlFor="status">حالة الموظف</Label>
                <Select
                    value={data.status}
                    onValueChange={(v) => onChange('status', v)}
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
    );
};
