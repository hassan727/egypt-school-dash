/**
 * دالات التحقق من صحة بيانات الطالب
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface StudentValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * حقول مطلوبة في كل قسم
 */
export const REQUIRED_FIELDS = {
    personal: {
        fullNameAr: 'الاسم الكامل بالعربية',
        nationalId: 'الرقم القومي',
        dateOfBirth: 'تاريخ الميلاد',
        gender: 'النوع',
    },
    enrollment: {
        stage: 'المرحلة الدراسية',
        class: 'الفصل/الشعبة',
    },
    guardian: {
        fullName: 'اسم ولي الأمر',
        phone: 'رقم هاتف ولي الأمر',
    },
    mother: {
        fullName: 'اسم الأم',
        phone: 'رقم هاتف الأم',
    },
    emergency: {
        contactName: 'اسم جهة الاتصال',
        phone: 'رقم الهاتف',
        relationship: 'العلاقة',
    },
    fees: {
        totalAmount: 'المبلغ الإجمالي',
        installmentCount: 'عدد الأقساط',
    }
};

/**
 * التحقق من بيانات القسم الشخصي
 */
export function validatePersonalData(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.fullNameAr?.trim()) {
        errors.push({
            field: 'personal.fullNameAr',
            message: '❌ الاسم الكامل بالعربية مطلوب',
        });
    }

    if (!data.nationalId?.trim()) {
        errors.push({
            field: 'personal.nationalId',
            message: '❌ الرقم القومي مطلوب',
        });
    }

    if (!data.dateOfBirth) {
        errors.push({
            field: 'personal.dateOfBirth',
            message: '❌ تاريخ الميلاد مطلوب',
        });
    }

    if (!data.gender) {
        errors.push({
            field: 'personal.gender',
            message: '❌ النوع مطلوب',
        });
    }

    // التحقق من صيغة الرقم القومي (14 رقم)
    if (data.nationalId?.trim() && !/^\d{14}$/.test(data.nationalId)) {
        errors.push({
            field: 'personal.nationalId',
            message: '❌ الرقم القومي غير صحيح (يجب أن يكون 14 رقم)',
        });
    }

    return errors;
}

/**
 * التحقق من بيانات القيد
 */
export function validateEnrollmentData(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.stage?.trim()) {
        errors.push({
            field: 'enrollment.stage',
            message: '❌ المرحلة الدراسية مطلوبة',
        });
    }

    if (!data.class?.trim()) {
        errors.push({
            field: 'enrollment.class',
            message: '❌ الفصل/الشعبة مطلوبة',
        });
    }

    if (!data.enrollmentDate) {
        errors.push({
            field: 'enrollment.enrollmentDate',
            message: '❌ تاريخ القيد مطلوب',
        });
    }

    return errors;
}

/**
 * التحقق من بيانات ولي الأمر
 */
export function validateGuardianData(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.fullName?.trim()) {
        errors.push({
            field: 'guardian.fullName',
            message: '❌ اسم ولي الأمر مطلوب',
        });
    }

    if (!data.phone?.trim()) {
        errors.push({
            field: 'guardian.phone',
            message: '❌ رقم هاتف ولي الأمر مطلوب',
        });
    }

    // التحقق من صيغة الهاتف (رقم فقط و11 رقم)
    if (data.phone?.trim() && !/^\d{11}$/.test(data.phone.replace(/\D/g, ''))) {
        errors.push({
            field: 'guardian.phone',
            message: '❌ رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)',
        });
    }

    return errors;
}

/**
 * التحقق من بيانات الأم
 */
export function validateMotherData(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.fullName?.trim()) {
        errors.push({
            field: 'mother.fullName',
            message: '❌ اسم الأم مطلوب',
        });
    }

    if (!data.phone?.trim()) {
        errors.push({
            field: 'mother.phone',
            message: '❌ رقم هاتف الأم مطلوب',
        });
    }

    // التحقق من صيغة الهاتف (رقم فقط و11 رقم)
    if (data.phone?.trim() && !/^\d{11}$/.test(data.phone.replace(/\D/g, ''))) {
        errors.push({
            field: 'mother.phone',
            message: '❌ رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)',
        });
    }

    return errors;
}

/**
 * التحقق من بيانات الطوارئ
 */
export function validateEmergencyContacts(data: any[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data || data.length === 0) {
        errors.push({
            field: 'emergency',
            message: '❌ يجب إضافة جهة اتصال طوارئ واحدة على الأقل',
        });
        return errors;
    }

    data.forEach((contact, index) => {
        if (!contact.contactName?.trim()) {
            errors.push({
                field: `emergency[${index}].contactName`,
                message: `❌ جهة الاتصال ${index + 1}: الاسم مطلوب`,
            });
        }

        if (!contact.phone?.trim()) {
            errors.push({
                field: `emergency[${index}].phone`,
                message: `❌ جهة الاتصال ${index + 1}: رقم الهاتف مطلوب`,
            });
        }

        if (!contact.relationship?.trim()) {
            errors.push({
                field: `emergency[${index}].relationship`,
                message: `❌ جهة الاتصال ${index + 1}: العلاقة مطلوبة`,
            });
        }

        // التحقق من صيغة الهاتف (رقم فقط و11 رقم)
        if (contact.phone?.trim() && !/^\d{11}$/.test(contact.phone.replace(/\D/g, ''))) {
            errors.push({
                field: `emergency[${index}].phone`,
                message: `❌ جهة الاتصال ${index + 1}: رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)`,
            });
        }
    });

    return errors;
}

/**
 * التحقق من بيانات المصروفات
 */
export function validateSchoolFees(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.totalAmount === undefined || data.totalAmount <= 0) {
        errors.push({
            field: 'fees.totalAmount',
            message: '❌ المبلغ الإجمالي مطلوب ويجب أن يكون أكبر من صفر',
        });
    }

    if (data.installmentCount === undefined || data.installmentCount <= 0) {
        errors.push({
            field: 'fees.installmentCount',
            message: '❌ عدد الأقساط مطلوب ويجب أن يكون أكبر من صفر',
        });
    }

    if (data.advancePayment === undefined) {
        errors.push({
            field: 'fees.advancePayment',
            message: '❌ الدفع المقدم مطلوب',
        });
    }

    return errors;
}

/**
 * التحقق الشامل من جميع بيانات الطالب
 */
export function validateStudentData(
    personalData: any,
    enrollmentData: any,
    guardianData: any,
    motherData: any,
    emergencyContacts: any[],
    schoolFees: any
): StudentValidationResult {
    const errors: ValidationError[] = [];

    // التحقق من كل قسم
    errors.push(...validatePersonalData(personalData));
    errors.push(...validateEnrollmentData(enrollmentData));
    errors.push(...validateGuardianData(guardianData));
    errors.push(...validateMotherData(motherData));
    errors.push(...validateEmergencyContacts(emergencyContacts));
    errors.push(...validateSchoolFees(schoolFees));

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * تنسيق رسالة الأخطاء لعرضها للمستخدم
 */
export function formatErrorMessage(errors: ValidationError[]): string {
    if (errors.length === 0) return '';

    const errorMessages = errors.map((err) => err.message).join('\n');
    return errorMessages;
}

/**
 * تنسيق رسالة الأخطاء كقائمة منقطة
 */
export function formatErrorList(errors: ValidationError[]): string {
    if (errors.length === 0) return '';

    const errorMessages = errors.map((err) => `• ${err.message}`);
    return errorMessages.join('\n');
}

/**
 * التحقق من صحة بيانات كل قسم على حدة
 */
export function validateSection(sectionName: string, data: any): StudentValidationResult {
    const errors: ValidationError[] = [];
    
    switch (sectionName) {
        case 'personal':
            errors.push(...validatePersonalData(data));
            break;
        case 'enrollment':
            errors.push(...validateEnrollmentData(data));
            break;
        case 'guardian':
            errors.push(...validateGuardianData(data));
            break;
        case 'mother':
            errors.push(...validateMotherData(data));
            break;
        case 'emergency':
            errors.push(...validateEmergencyContacts(data));
            break;
        case 'fees':
            errors.push(...validateSchoolFees(data));
            break;
        default:
            break;
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
}
