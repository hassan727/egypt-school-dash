import { useState, useCallback } from 'react';

export type ValidationRule = {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
    min?: number;
    max?: number;
    email?: boolean;
    phone?: boolean;
};

export type ValidationSchema = {
    [key: string]: ValidationRule | ValidationRule[];
};

interface ValidationError {
    [key: string]: string[];
}

interface FieldValidation {
    isValid: boolean;
    errors: string[];
}

const DEFAULT_MESSAGES: Record<string, (rule: any) => string> = {
    required: () => 'هذا الحقل مطلوب',
    minLength: (rule: ValidationRule) => `الحد الأدنى ${rule.minLength} أحرف`,
    maxLength: (rule: ValidationRule) => `الحد الأقصى ${rule.maxLength} أحرف`,
    pattern: () => 'الصيغة غير صحيحة',
    email: () => 'بريد إلكتروني غير صحيح',
    phone: () => 'رقم هاتف غير صحيح',
    min: (rule: ValidationRule) => `يجب أن يكون على الأقل ${rule.min}`,
    max: (rule: ValidationRule) => `لا يمكن أن يتجاوز ${rule.max}`,
};

export function useFormValidation(schema: ValidationSchema) {
    const [errors, setErrors] = useState<ValidationError>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback(
        (fieldName: string, value: any): FieldValidation => {
            const rules = schema[fieldName];
            const fieldErrors: string[] = [];

            if (!rules) {
                return { isValid: true, errors: [] };
            }

            const rulesList = Array.isArray(rules) ? rules : [rules];

            for (const rule of rulesList) {
                // التحقق من المتطلب
                if (rule.required && (!value || value.toString().trim() === '')) {
                    fieldErrors.push(DEFAULT_MESSAGES.required(rule));
                    continue;
                }

                if (!value) continue;

                const valueStr = value.toString();

                // التحقق من الحد الأدنى للطول
                if (rule.minLength && valueStr.length < rule.minLength) {
                    fieldErrors.push(DEFAULT_MESSAGES.minLength(rule));
                }

                // التحقق من الحد الأقصى للطول
                if (rule.maxLength && valueStr.length > rule.maxLength) {
                    fieldErrors.push(DEFAULT_MESSAGES.maxLength(rule));
                }

                // التحقق من النمط
                if (rule.pattern && !rule.pattern.test(valueStr)) {
                    fieldErrors.push(DEFAULT_MESSAGES.pattern(rule));
                }

                // التحقق من البريد الإلكتروني
                if (rule.email) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(valueStr)) {
                        fieldErrors.push(DEFAULT_MESSAGES.email(rule));
                    }
                }

                // التحقق من رقم الهاتف
                if (rule.phone) {
                    const phonePattern = /^[\d\s\-\+\(\)]+$/;
                    if (!phonePattern.test(valueStr)) {
                        fieldErrors.push(DEFAULT_MESSAGES.phone(rule));
                    }
                }

                // التحقق من الحد الأدنى للقيمة
                if (rule.min !== undefined && Number(value) < rule.min) {
                    fieldErrors.push(DEFAULT_MESSAGES.min(rule));
                }

                // التحقق من الحد الأقصى للقيمة
                if (rule.max !== undefined && Number(value) > rule.max) {
                    fieldErrors.push(DEFAULT_MESSAGES.max(rule));
                }

                // التحقق المخصص
                if (rule.custom) {
                    const result = rule.custom(value);
                    if (result !== true) {
                        fieldErrors.push(typeof result === 'string' ? result : 'البيانات غير صحيحة');
                    }
                }
            }

            return {
                isValid: fieldErrors.length === 0,
                errors: fieldErrors,
            };
        },
        [schema]
    );

    const validateForm = useCallback(
        (formData: Record<string, any>): { isValid: boolean; errors: ValidationError } => {
            const newErrors: ValidationError = {};

            for (const fieldName of Object.keys(schema)) {
                const validation = validateField(fieldName, formData[fieldName]);
                if (!validation.isValid) {
                    newErrors[fieldName] = validation.errors;
                }
            }

            setErrors(newErrors);
            return {
                isValid: Object.keys(newErrors).length === 0,
                errors: newErrors,
            };
        },
        [schema, validateField]
    );

    const validateFieldOnChange = useCallback(
        (fieldName: string, value: any) => {
            const validation = validateField(fieldName, value);

            setErrors(prev => {
                if (validation.isValid) {
                    const { [fieldName]: _, ...rest } = prev;
                    return rest;
                } else {
                    return { ...prev, [fieldName]: validation.errors };
                }
            });

            return validation;
        },
        [validateField]
    );

    const validateFieldOnBlur = useCallback(
        (fieldName: string, value: any) => {
            setTouched(prev => ({ ...prev, [fieldName]: true }));
            return validateFieldOnChange(fieldName, value);
        },
        [validateFieldOnChange]
    );

    const clearErrors = useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);

    const clearFieldError = useCallback((fieldName: string) => {
        setErrors(prev => {
            const { [fieldName]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    return {
        errors,
        touched,
        validateField,
        validateForm,
        validateFieldOnChange,
        validateFieldOnBlur,
        clearErrors,
        clearFieldError,
        hasErrors: Object.keys(errors).length > 0,
    };
}

// قواعس التحقق الجاهزة
export const ValidationRules = {
    required: { required: true } as ValidationRule,
    email: { required: true, email: true } as ValidationRule,
    phone: { required: true, phone: true } as ValidationRule,
    arabicName: {
        required: true,
        minLength: 3,
        maxLength: 100,
        pattern: /^[\u0600-\u06FF\s]+$/,
    } as ValidationRule,
    arabicText: {
        maxLength: 500,
        pattern: /^[\u0600-\u06FF\s\.,!?]+$/,
    } as ValidationRule,
    nationalId: {
        required: true,
        pattern: /^[0-9]{14,15}$/,
    } as ValidationRule,
    studentId: {
        required: true,
        pattern: /^[A-Z0-9\-]+$/,
    } as ValidationRule,
    gpa: {
        required: true,
        min: 0,
        max: 4.0,
    } as ValidationRule,
    percentage: {
        required: true,
        min: 0,
        max: 100,
    } as ValidationRule,
    phoneNumber: {
        required: true,
        pattern: /^[0-9]{10,15}$/,
    } as ValidationRule,
    date: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
    } as ValidationRule,
    amount: {
        required: true,
        min: 0,
    } as ValidationRule,
};