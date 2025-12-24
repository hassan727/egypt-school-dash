import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PersonalData {
    full_name_ar: string;
    national_id: string;
    birth_date: string;
    gender: string;
    marital_status: string;
    nationality: string;
    religion: string;
}

interface PersonalDataFormProps {
    data: PersonalData;
    onChange: (field: keyof PersonalData, value: string) => void;
    errors?: Record<string, string>;
    isReadOnly?: boolean;
}

export const PersonalDataForm = ({ data, onChange, errors = {}, isReadOnly = false }: PersonalDataFormProps) => {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="full_name_ar">الاسم الرباعي <span className="text-red-500">*</span></Label>
                <Input
                    id="full_name_ar"
                    value={data.full_name_ar}
                    onChange={(e) => onChange('full_name_ar', e.target.value)}
                    disabled={isReadOnly}
                    className={errors.full_name_ar ? "border-red-500" : ""}
                />
                {errors.full_name_ar && <p className="text-xs text-red-500">{errors.full_name_ar}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="national_id">الرقم القومي <span className="text-red-500">*</span></Label>
                <Input
                    id="national_id"
                    value={data.national_id}
                    onChange={(e) => onChange('national_id', e.target.value)}
                    disabled={isReadOnly}
                    maxLength={14}
                    className={errors.national_id ? "border-red-500" : ""}
                />
                {errors.national_id && <p className="text-xs text-red-500">{errors.national_id}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="birth_date">تاريخ الميلاد <span className="text-red-500">*</span></Label>
                <Input
                    id="birth_date"
                    type="date"
                    value={data.birth_date}
                    onChange={(e) => onChange('birth_date', e.target.value)}
                    disabled={isReadOnly}
                    className={errors.birth_date ? "border-red-500" : ""}
                />
                {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="gender">الجنس <span className="text-red-500">*</span></Label>
                <Select
                    value={data.gender}
                    onValueChange={(v) => onChange('gender', v)}
                    disabled={isReadOnly}
                >
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                        <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="marital_status">الحالة الاجتماعية</Label>
                <Select
                    value={data.marital_status}
                    onValueChange={(v) => onChange('marital_status', v)}
                    disabled={isReadOnly}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة الاجتماعية" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">أعزب/ة</SelectItem>
                        <SelectItem value="married">متزوج/ة</SelectItem>
                        <SelectItem value="divorced">مطلق/ة</SelectItem>
                        <SelectItem value="widowed">أرمل/ة</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="nationality">الجنسية</Label>
                <Input
                    id="nationality"
                    value={data.nationality}
                    onChange={(e) => onChange('nationality', e.target.value)}
                    disabled={isReadOnly}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="religion">الديانة</Label>
                <Select
                    value={data.religion}
                    onValueChange={(v) => onChange('religion', v)}
                    disabled={isReadOnly}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="اختر الديانة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="مسلم">مسلم</SelectItem>
                        <SelectItem value="مسيحي">مسيحي</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
