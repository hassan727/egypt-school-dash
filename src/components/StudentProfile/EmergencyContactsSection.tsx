import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmergencyContact } from '@/types/student';
import { STUDENT_OPTIONS } from '@/data/studentConstants';
import { Trash2, Plus } from 'lucide-react';
import { SmartPhoneInput } from '@/components/ui/SmartPhoneInput';
import { Checkbox } from '@/components/ui/checkbox';

interface EmergencyContactsSectionProps {
    data?: EmergencyContact[];
    onSave?: (data: EmergencyContact[]) => Promise<void>;
    isReadOnly?: boolean;
}

/**
 * قسم بيانات الطوارئ
 * يحتوي على جهات الاتصال في حالات الطوارئ
 * يسمح بإضافة عدة جهات اتصال
 */
export function EmergencyContactsSection({ data, onSave, isReadOnly = false }: EmergencyContactsSectionProps) {
    const [contacts, setContacts] = useState<EmergencyContact[]>(
        data || [{
            studentId: '', // Added to satisfy interface
            contactName: '',
            relationship: '',
            phone: '',
            address: '',
        }]
    );

    const [isSaving, setIsSaving] = useState(false);
    // في وضع الإضافة (isReadOnly = false)، الحقول مفعّلة بشكل افتراضي
    const [isEditing, setIsEditing] = useState(!isReadOnly);

    const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
        const updatedContacts = [...contacts];
        updatedContacts[index] = {
            ...updatedContacts[index],
            [field]: value,
        };
        setContacts(updatedContacts);
    };

    const addContact = () => {
        setContacts([
            ...contacts,
            {
                studentId: '', // Added to satisfy interface
                contactName: '',
                relationship: '',
                phone: '',
                address: '',
            },
        ]);
    };

    const removeContact = (index: number) => {
        if (contacts.length > 1) {
            setContacts(contacts.filter((_, i) => i !== index));
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSave) {
                await onSave(contacts);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            {/* رأس القسم */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">بيانات الطوارئ</h2>
                {!isReadOnly && (
                    <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        size="sm"
                    >
                        {isEditing ? 'إلغاء' : 'تعديل'}
                    </Button>
                )}
            </div>

            {/* قائمة جهات الاتصال */}
            <div className="space-y-6">
                {contacts.map((contact, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                        {/* رقم الجهة */}
                        <div className="absolute top-2 right-2 text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            جهة {index + 1}
                        </div>

                        {/* زر الحذف */}
                        {isEditing && !isReadOnly && contacts.length > 1 && (
                            <button
                                onClick={() => removeContact(index)}
                                className="absolute top-2 left-2 text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {/* اسم جهة الاتصال */}
                            <div className="md:col-span-2">
                                <Label htmlFor={`contactName-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                    اسم جهة الاتصال
                                </Label>
                                <Input
                                    id={`contactName-${index}`}
                                    value={contact.contactName}
                                    onChange={(e) => handleContactChange(index, 'contactName', e.target.value)}
                                    placeholder="أدخل اسم جهة الاتصال"
                                    disabled={isReadOnly || !isEditing}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* صلة القرابة */}
                            <div>
                                <Label htmlFor={`relationship-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                    صلة القرابة
                                </Label>
                                <Select value={contact.relationship} onValueChange={(value) => handleContactChange(index, 'relationship', value)} disabled={isReadOnly || !isEditing}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر الصلة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STUDENT_OPTIONS.relationshipTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* الجنسية */}
                            <div>
                                <Label htmlFor={`nationality-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                    الجنسية
                                </Label>
                                <Select
                                    value={contact.nationality || 'مصري'}
                                    onValueChange={(value) => handleContactChange(index, 'nationality', value)}
                                    disabled={isReadOnly || !isEditing}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر الجنسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STUDENT_OPTIONS.nationality.map((nat) => (
                                            <SelectItem key={nat} value={nat}>
                                                {nat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* رقم الهاتف */}
                            <div className="space-y-4">
                                <SmartPhoneInput
                                    id={`phone-${index}`}
                                    label="رقم الهاتف"
                                    value={contact.phone}
                                    onChange={(val) => handleContactChange(index, 'phone', val)}
                                    placeholder="أدخل رقم الهاتف"
                                    nationality={contact.nationality || 'مصري'}
                                    disabled={isReadOnly || !isEditing}
                                />

                                {/* رقم الواتساب */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor={`whatsapp-${index}`} className="text-sm font-medium text-gray-700">
                                            رقم الواتساب
                                        </Label>
                                        {!isReadOnly && isEditing && (
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`whatsapp_same-${index}`}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            handleContactChange(index, 'whatsappNumber', contact.phone);
                                                        }
                                                    }}
                                                    disabled={!contact.phone}
                                                />
                                                <Label htmlFor={`whatsapp_same-${index}`} className="text-xs text-blue-600 cursor-pointer">
                                                    نفس رقم الهاتف
                                                </Label>
                                            </div>
                                        )}
                                    </div>
                                    <SmartPhoneInput
                                        id={`whatsapp-${index}`}
                                        label=""
                                        value={contact.whatsappNumber || ''}
                                        onChange={(val) => handleContactChange(index, 'whatsappNumber', val)}
                                        placeholder="أدخل رقم الواتساب"
                                        nationality={contact.nationality || 'مصري'}
                                        disabled={isReadOnly || !isEditing}
                                    />
                                </div>
                            </div>

                            {/* عنوان السكن */}
                            <div className="md:col-span-2">
                                <Label htmlFor={`address-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                    عنوان السكن
                                </Label>
                                <Input
                                    id={`address-${index}`}
                                    value={contact.address}
                                    onChange={(e) => handleContactChange(index, 'address', e.target.value)}
                                    placeholder="أدخل عنوان السكن"
                                    disabled={isReadOnly || !isEditing}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* زر إضافة جهة اتصال */}
            {isEditing && !isReadOnly && (
                <div className="mt-6 mb-6">
                    <Button
                        onClick={addContact}
                        variant="outline"
                        className="w-full md:w-auto"
                    >
                        <Plus size={18} className="ml-2" />
                        إضافة جهة اتصال
                    </Button>
                </div>
            )}

            {/* أزرار الحفظ */}
            {isEditing && !isReadOnly && (
                <div className="flex gap-3 mt-6 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                    </Button>
                </div>
            )}
        </Card>
    );
}