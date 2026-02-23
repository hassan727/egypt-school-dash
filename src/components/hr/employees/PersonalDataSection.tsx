import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Save, CheckCircle } from "lucide-react";

export interface PersonalData {
    full_name_ar: string;
    national_id: string;
    birth_date: string;
    gender: string;
    marital_status: string;
    nationality: string;
    religion: string;
}

interface PersonalDataSectionProps {
    data: PersonalData;
    onSave: (data: PersonalData) => void;
    isReadOnly?: boolean;
}

export const PersonalDataSection = ({ data, onSave, isReadOnly = false }: PersonalDataSectionProps) => {
    const [formData, setFormData] = useState<PersonalData>(data);
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        setFormData(data);
    }, [data]);

    const handleChange = (field: keyof PersonalData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setIsModified(true);
    };

    const handleSave = () => {
        onSave(formData);
        setIsModified(false);
    };

    return (
        <Card className="border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
            <CardHeader className="bg-blue-50/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                    <User className="h-5 w-5" />
                    البيانات الشخصية
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="full_name_ar">الاسم الرباعي (بالعربية) <span className="text-red-500">*</span></Label>
                        <Input
                            id="full_name_ar"
                            value={formData.full_name_ar}
                            onChange={(e) => handleChange("full_name_ar", e.target.value)}
                            placeholder="الاسم كما هو في بطاقة الرقم القومي"
                            disabled={isReadOnly}
                            className="font-bold text-lg"
                        />
                    </div>

                    {/* National ID */}
                    <div className="space-y-2">
                        <Label htmlFor="national_id">الرقم القومي <span className="text-red-500">*</span></Label>
                        <Input
                            id="national_id"
                            value={formData.national_id}
                            onChange={(e) => handleChange("national_id", e.target.value)}
                            placeholder="14 رقم"
                            maxLength={14}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-2">
                        <Label htmlFor="birth_date">تاريخ الميلاد <span className="text-red-500">*</span></Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => handleChange("birth_date", e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <Label htmlFor="gender">الجنس <span className="text-red-500">*</span></Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(v) => handleChange("gender", v)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الجنس" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">ذكر</SelectItem>
                                <SelectItem value="female">أنثى</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nationality */}
                    <div className="space-y-2">
                        <Label htmlFor="nationality">الجنسية</Label>
                        <Input
                            id="nationality"
                            value={formData.nationality}
                            onChange={(e) => handleChange("nationality", e.target.value)}
                            placeholder="مثال: مصري"
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Religion */}
                    <div className="space-y-2">
                        <Label htmlFor="religion">الديانة</Label>
                        <Select
                            value={formData.religion}
                            onValueChange={(v) => handleChange("religion", v)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الديانة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="مسلم">مسلم</SelectItem>
                                <SelectItem value="مسيحي">مسيحي</SelectItem>
                                <SelectItem value="other">أخرى</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Marital Status */}
                    <div className="space-y-2">
                        <Label htmlFor="marital_status">الحالة الاجتماعية</Label>
                        <Select
                            value={formData.marital_status}
                            onValueChange={(v) => handleChange("marital_status", v)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">أعزب/ة</SelectItem>
                                <SelectItem value="married">متزوج/ة</SelectItem>
                                <SelectItem value="divorced">مطلق/ة</SelectItem>
                                <SelectItem value="widowed">أرمل/ة</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Save/Status Footer */}
                {!isReadOnly && (
                    <div className="flex justify-end border-t pt-4 mt-4">
                        {isModified ? (
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                                <Save className="w-4 h-4 ml-2" />
                                حفظ التغييرات
                            </Button>
                        ) : (
                            <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 pointer-events-none">
                                <CheckCircle className="w-4 h-4 ml-2" />
                                البيانات محفوظة
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
