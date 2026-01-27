import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartPhoneInput } from '@/components/ui/SmartPhoneInput';
import { EMERGENCY_CONTACT_RELATIONS } from '@/data/employeeConstants';

export interface ContactData {
    phone: string;
    whatsapp_number?: string;
    email?: string;
    address?: string;
    nationality: string;
    emergency_contact_name?: string;
    emergency_contact_relation?: string;
    emergency_contact_phone?: string;
}

interface ContactDataFormProps {
    data: ContactData;
    onChange: (field: keyof ContactData, value: string) => void;
    errors?: Record<string, string>;
    isReadOnly?: boolean;
}

export const ContactDataForm = ({ data, onChange, errors = {}, isReadOnly = false }: ContactDataFormProps) => {
    const [isSameAsPhone, setIsSameAsPhone] = useState(false);

    const handleWhatsappSameAsPhone = (checked: boolean) => {
        setIsSameAsPhone(checked);
        if (checked && data.phone) {
            onChange('whatsapp_number', data.phone);
        }
    };

    return (
        <div className="grid gap-4 py-4">
            {/* الجنسية - معروضة من البيانات الشخصية (قراءة فقط) */}
            <div className="grid gap-2">
                <Label htmlFor="contact_nationality" className="text-sm font-medium text-gray-700">
                    الجنسية <span className="text-gray-500 text-xs">(من البيانات الشخصية)</span>
                </Label>
                <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 flex items-center text-gray-700 font-medium">
                    {data.nationality || 'مصري'}
                </div>
                <p className="text-xs text-gray-500">الجنسية مأخوذة من البيانات الشخصية وتُستخدم لتحديد رمز البلد تلقائياً</p>
            </div>

            {/* رقم الهاتف */}
            <div className="grid gap-2">
                <SmartPhoneInput
                    id="contact_phone"
                    label="رقم الهاتف المحمول"
                    value={data.phone}
                    onChange={(val) => onChange('phone', val)}
                    nationality={data.nationality || 'مصري'}
                    placeholder="أدخل رقم الهاتف"
                    required
                    disabled={isReadOnly}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* رقم الواتساب */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="contact_whatsapp" className="text-sm font-medium text-gray-700">
                        رقم الواتساب
                    </Label>
                    {!isReadOnly && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="whatsapp_same_phone"
                                checked={isSameAsPhone}
                                onCheckedChange={handleWhatsappSameAsPhone}
                                disabled={!data.phone}
                            />
                            <Label htmlFor="whatsapp_same_phone" className="text-xs text-blue-600 cursor-pointer">
                                نفس رقم الهاتف
                            </Label>
                        </div>
                    )}
                </div>
                <SmartPhoneInput
                    id="contact_whatsapp"
                    label=""
                    value={data.whatsapp_number || ''}
                    onChange={(val) => onChange('whatsapp_number', val)}
                    nationality={data.nationality || 'مصري'}
                    placeholder="أدخل رقم الواتساب"
                    disabled={isReadOnly}
                />
                {errors.whatsapp_number && <p className="text-xs text-red-500">{errors.whatsapp_number}</p>}
            </div>

            {/* البريد الإلكتروني */}
            <div className="grid gap-2">
                <Label htmlFor="contact_email">البريد الإلكتروني</Label>
                <Input
                    id="contact_email"
                    type="email"
                    value={data.email || ''}
                    onChange={(e) => onChange('email', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="أدخل البريد الإلكتروني"
                    className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* العنوان */}
            <div className="grid gap-2">
                <Label htmlFor="contact_address">العنوان</Label>
                <Input
                    id="contact_address"
                    value={data.address || ''}
                    onChange={(e) => onChange('address', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="أدخل عنوان السكن"
                    className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>

            {/* جهة الاتصال في الطوارئ */}
            <div className="border-t pt-6 mt-6">
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm font-medium">
                    جهة الاتصال في الحالات الطارئة
                </div>

                {/* اسم الشخص في الطوارئ */}
                <div className="grid gap-2 mb-4">
                    <Label htmlFor="emergency_contact_name">اسم جهة الاتصال</Label>
                    <Input
                        id="emergency_contact_name"
                        value={data.emergency_contact_name || ''}
                        onChange={(e) => onChange('emergency_contact_name', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="أدخل اسم الشخص للاتصال به في الطوارئ"
                        className={errors.emergency_contact_name ? "border-red-500" : ""}
                    />
                    {errors.emergency_contact_name && <p className="text-xs text-red-500">{errors.emergency_contact_name}</p>}
                </div>

                {/* علاقة جهة الاتصال */}
                <div className="grid gap-2 mb-4">
                    <Label htmlFor="emergency_contact_relation">العلاقة</Label>
                    <Select
                        value={data.emergency_contact_relation || ''}
                        onValueChange={(v) => onChange('emergency_contact_relation', v)}
                        disabled={isReadOnly}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="اختر العلاقة" />
                        </SelectTrigger>
                        <SelectContent>
                            {EMERGENCY_CONTACT_RELATIONS.map((relation) => (
                                <SelectItem key={relation} value={relation}>
                                    {relation}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.emergency_contact_relation && <p className="text-xs text-red-500">{errors.emergency_contact_relation}</p>}
                </div>

                {/* رقم هاتف جهة الاتصال */}
                <div className="grid gap-2">
                    <SmartPhoneInput
                        id="emergency_contact_phone"
                        label="رقم الهاتف للاتصال في الطوارئ"
                        value={data.emergency_contact_phone || ''}
                        onChange={(val) => onChange('emergency_contact_phone', val)}
                        nationality={data.nationality || 'مصري'}
                        placeholder="أدخل رقم الهاتف"
                        disabled={isReadOnly}
                    />
                    {errors.emergency_contact_phone && <p className="text-xs text-red-500">{errors.emergency_contact_phone}</p>}
                </div>
            </div>
        </div>
    );
};
