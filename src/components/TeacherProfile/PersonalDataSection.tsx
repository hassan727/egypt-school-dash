import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    GraduationCap,
    Briefcase,
    Edit,
    Save,
    X
} from 'lucide-react';
import { useState } from 'react';
import { TeacherPersonalData, TeacherEmploymentData } from '@/types/teacher';
import { toast } from 'sonner';

interface PersonalDataSectionProps {
    personalData: TeacherPersonalData;
    employmentData: TeacherEmploymentData;
    onUpdatePersonal: (data: Partial<TeacherPersonalData>) => Promise<boolean>;
    onUpdateEmployment: (data: Partial<TeacherEmploymentData>) => Promise<boolean>;
    readOnly?: boolean;
}

export function PersonalDataSection({
    personalData,
    employmentData,
    onUpdatePersonal,
    onUpdateEmployment,
    readOnly = false
}: PersonalDataSectionProps) {
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingEmployment, setIsEditingEmployment] = useState(false);
    const [personalForm, setPersonalForm] = useState(personalData);
    const [employmentForm, setEmploymentForm] = useState(employmentData);
    const [saving, setSaving] = useState(false);

    const handleSavePersonal = async () => {
        try {
            setSaving(true);
            await onUpdatePersonal(personalForm);
            toast.success('تم حفظ البيانات الشخصية بنجاح');
            setIsEditingPersonal(false);
        } catch (error) {
            toast.error('حدث خطأ في حفظ البيانات');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEmployment = async () => {
        try {
            setSaving(true);
            await onUpdateEmployment(employmentForm);
            toast.success('تم حفظ البيانات الوظيفية بنجاح');
            setIsEditingEmployment(false);
        } catch (error) {
            toast.error('حدث خطأ في حفظ البيانات');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* البيانات الشخصية */}
            <Card className="p-6 border-t-4 border-t-blue-500">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <User className="h-6 w-6 text-blue-600" />
                        البيانات الشخصية
                    </h3>
                    {!readOnly && !isEditingPersonal && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingPersonal(true)}
                            className="gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            تعديل
                        </Button>
                    )}
                    {isEditingPersonal && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleSavePersonal}
                                disabled={saving}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Save className="h-4 w-4" />
                                حفظ
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsEditingPersonal(false);
                                    setPersonalForm(personalData);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* الاسم الكامل */}
                    <div>
                        <Label className="text-gray-600">الاسم الكامل (عربي)</Label>
                        {isEditingPersonal ? (
                            <Input
                                value={personalForm.fullNameAr}
                                onChange={(e) => setPersonalForm({ ...personalForm, fullNameAr: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.fullNameAr || '-'}</p>
                        )}
                    </div>

                    {/* الاسم الإنجليزي */}
                    <div>
                        <Label className="text-gray-600">الاسم الكامل (إنجليزي)</Label>
                        {isEditingPersonal ? (
                            <Input
                                value={personalForm.fullNameEn || ''}
                                onChange={(e) => setPersonalForm({ ...personalForm, fullNameEn: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.fullNameEn || '-'}</p>
                        )}
                    </div>

                    {/* الرقم القومي */}
                    <div>
                        <Label className="text-gray-600">الرقم القومي</Label>
                        {isEditingPersonal ? (
                            <Input
                                value={personalForm.nationalId}
                                onChange={(e) => setPersonalForm({ ...personalForm, nationalId: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.nationalId || '-'}</p>
                        )}
                    </div>

                    {/* تاريخ الميلاد */}
                    <div>
                        <Label className="text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            تاريخ الميلاد
                        </Label>
                        {isEditingPersonal ? (
                            <Input
                                type="date"
                                value={personalForm.dateOfBirth}
                                onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.dateOfBirth || '-'}</p>
                        )}
                    </div>

                    {/* الجنس */}
                    <div>
                        <Label className="text-gray-600">الجنس</Label>
                        {isEditingPersonal ? (
                            <Select
                                value={personalForm.gender}
                                onValueChange={(v) => setPersonalForm({ ...personalForm, gender: v as any })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ذكر">ذكر</SelectItem>
                                    <SelectItem value="أنثى">أنثى</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.gender || '-'}</p>
                        )}
                    </div>

                    {/* الجنسية */}
                    <div>
                        <Label className="text-gray-600">الجنسية</Label>
                        {isEditingPersonal ? (
                            <Input
                                value={personalForm.nationality}
                                onChange={(e) => setPersonalForm({ ...personalForm, nationality: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.nationality || '-'}</p>
                        )}
                    </div>

                    {/* الديانة */}
                    <div>
                        <Label className="text-gray-600">الديانة</Label>
                        {isEditingPersonal ? (
                            <Select
                                value={personalForm.religion}
                                onValueChange={(v) => setPersonalForm({ ...personalForm, religion: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="مسلم">مسلم</SelectItem>
                                    <SelectItem value="مسيحي">مسيحي</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.religion || '-'}</p>
                        )}
                    </div>

                    {/* الحالة الاجتماعية */}
                    <div>
                        <Label className="text-gray-600">الحالة الاجتماعية</Label>
                        {isEditingPersonal ? (
                            <Select
                                value={personalForm.maritalStatus}
                                onValueChange={(v) => setPersonalForm({ ...personalForm, maritalStatus: v as any })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="أعزب">أعزب</SelectItem>
                                    <SelectItem value="متزوج">متزوج</SelectItem>
                                    <SelectItem value="مطلق">مطلق</SelectItem>
                                    <SelectItem value="أرمل">أرمل</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.maritalStatus || '-'}</p>
                        )}
                    </div>

                    {/* رقم الهاتف */}
                    <div>
                        <Label className="text-gray-600 flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            رقم الهاتف
                        </Label>
                        {isEditingPersonal ? (
                            <Input
                                value={personalForm.phone}
                                onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.phone || '-'}</p>
                        )}
                    </div>

                    {/* واتساب */}
                    <div>
                        <Label className="text-gray-600">واتساب</Label>
                        {isEditingPersonal ? (
                            <Input
                                value={personalForm.whatsappNumber || ''}
                                onChange={(e) => setPersonalForm({ ...personalForm, whatsappNumber: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.whatsappNumber || '-'}</p>
                        )}
                    </div>

                    {/* البريد الإلكتروني */}
                    <div>
                        <Label className="text-gray-600 flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            البريد الإلكتروني
                        </Label>
                        {isEditingPersonal ? (
                            <Input
                                type="email"
                                value={personalForm.email || ''}
                                onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.email || '-'}</p>
                        )}
                    </div>

                    {/* العنوان */}
                    <div className="md:col-span-2 lg:col-span-3">
                        <Label className="text-gray-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            العنوان
                        </Label>
                        {isEditingPersonal ? (
                            <Textarea
                                value={personalForm.address}
                                onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{personalData.address || '-'}</p>
                        )}
                    </div>
                </div>
            </Card>

            {/* البيانات الوظيفية */}
            <Card className="p-6 border-t-4 border-t-green-500">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Briefcase className="h-6 w-6 text-green-600" />
                        البيانات الوظيفية
                    </h3>
                    {!readOnly && !isEditingEmployment && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingEmployment(true)}
                            className="gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            تعديل
                        </Button>
                    )}
                    {isEditingEmployment && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleSaveEmployment}
                                disabled={saving}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Save className="h-4 w-4" />
                                حفظ
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsEditingEmployment(false);
                                    setEmploymentForm(employmentData);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* الرقم الوظيفي */}
                    <div>
                        <Label className="text-gray-600">الرقم الوظيفي</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.employeeNumber}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, employeeNumber: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.employeeNumber || '-'}</p>
                        )}
                    </div>

                    {/* رقم التسجيل التربوي */}
                    <div>
                        <Label className="text-gray-600">رقم التسجيل التربوي</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.educationalRegistrationNumber || ''}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, educationalRegistrationNumber: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.educationalRegistrationNumber || '-'}</p>
                        )}
                    </div>

                    {/* تاريخ التعيين */}
                    <div>
                        <Label className="text-gray-600">تاريخ التعيين</Label>
                        {isEditingEmployment ? (
                            <Input
                                type="date"
                                value={employmentForm.hireDate}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, hireDate: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.hireDate || '-'}</p>
                        )}
                    </div>

                    {/* نوع العقد */}
                    <div>
                        <Label className="text-gray-600">نوع العقد</Label>
                        {isEditingEmployment ? (
                            <Select
                                value={employmentForm.contractType}
                                onValueChange={(v) => setEmploymentForm({ ...employmentForm, contractType: v as any })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="دائم">دائم</SelectItem>
                                    <SelectItem value="مؤقت">مؤقت</SelectItem>
                                    <SelectItem value="حر">حر</SelectItem>
                                    <SelectItem value="استشاري">استشاري</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.contractType || '-'}</p>
                        )}
                    </div>

                    {/* الحالة الوظيفية */}
                    <div>
                        <Label className="text-gray-600">الحالة الوظيفية</Label>
                        {isEditingEmployment ? (
                            <Select
                                value={employmentForm.employmentStatus}
                                onValueChange={(v) => setEmploymentForm({ ...employmentForm, employmentStatus: v as any })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="نشط">نشط</SelectItem>
                                    <SelectItem value="إجازة">إجازة</SelectItem>
                                    <SelectItem value="موقوف">موقوف</SelectItem>
                                    <SelectItem value="مستقيل">مستقيل</SelectItem>
                                    <SelectItem value="منتهي">منتهي</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${employmentData.employmentStatus === 'نشط' ? 'bg-green-100 text-green-800' :
                                    employmentData.employmentStatus === 'إجازة' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {employmentData.employmentStatus || '-'}
                            </span>
                        )}
                    </div>

                    {/* المسمى الوظيفي */}
                    <div>
                        <Label className="text-gray-600">المسمى الوظيفي</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.jobTitle}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, jobTitle: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.jobTitle || '-'}</p>
                        )}
                    </div>

                    {/* المؤهل العلمي */}
                    <div>
                        <Label className="text-gray-600 flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            المؤهل العلمي
                        </Label>
                        {isEditingEmployment ? (
                            <Select
                                value={employmentForm.highestQualification}
                                onValueChange={(v) => setEmploymentForm({ ...employmentForm, highestQualification: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="دبلوم">دبلوم</SelectItem>
                                    <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                                    <SelectItem value="ماجستير">ماجستير</SelectItem>
                                    <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.highestQualification || '-'}</p>
                        )}
                    </div>

                    {/* التخصص */}
                    <div>
                        <Label className="text-gray-600">التخصص</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.qualificationField}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, qualificationField: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.qualificationField || '-'}</p>
                        )}
                    </div>

                    {/* القسم */}
                    <div>
                        <Label className="text-gray-600">القسم</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.department || ''}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, department: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.department || '-'}</p>
                        )}
                    </div>

                    {/* المدرسة/الفرع */}
                    <div>
                        <Label className="text-gray-600">المدرسة/الفرع</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.schoolBranch}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, schoolBranch: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.schoolBranch || '-'}</p>
                        )}
                    </div>

                    {/* التخصص التدريسي */}
                    <div>
                        <Label className="text-gray-600">التخصص التدريسي</Label>
                        {isEditingEmployment ? (
                            <Input
                                value={employmentForm.specialization}
                                onChange={(e) => setEmploymentForm({ ...employmentForm, specialization: e.target.value })}
                            />
                        ) : (
                            <p className="text-lg font-semibold mt-1">{employmentData.specialization || '-'}</p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
