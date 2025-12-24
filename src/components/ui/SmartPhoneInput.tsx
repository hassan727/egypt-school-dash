import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SmartPhoneInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    nationality?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

const COUNTRY_CODES: Record<string, string> = {
    'مصري': '+20',
    'سعودي': '+966',
    'إماراتي': '+971',
    'كويتي': '+965',
    'قطري': '+974',
    'بحريني': '+973',
    'عماني': '+968',
    'يمني': '+967',
    'أردني': '+962',
    'لبناني': '+961',
    'سوري': '+963',
    'عراقي': '+964',
    'فلسطيني': '+970',
    'سوداني': '+249',
    'ليبي': '+218',
    'تونسي': '+216',
    'جزائري': '+213',
    'مغربي': '+212',
    'موريتاني': '+222',
    'صومالي': '+252',
    'جيبوتي': '+253',
    'قمري': '+269',
    'أخرى': '',
    // Default fallback
    'default': '+20'
};

export function SmartPhoneInput({
    id,
    label,
    value,
    onChange,
    nationality = 'مصري',
    placeholder = 'أدخل رقم الهاتف',
    required = false,
    disabled = false,
    error
}: SmartPhoneInputProps) {
    // Detect country code based on nationality
    const getCountryCode = (nat: string) => {
        return COUNTRY_CODES[nat] || COUNTRY_CODES['default'];
    };

    // Initialize logic
    useEffect(() => {
        // If value is empty and not disabled, verify if we should prepopulate
        // Note: We generally don't want to overwrite existing data unless it's a fresh start
        if (!value && !disabled) {
            // Optional: could auto-set prefix here, but it might be annoying if user backspaces.
            // Let's rely on the placeholder visual or just helper text.
        }
    }, [nationality, value, disabled]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;
        onChange(newValue);
    };

    const countryCode = getCountryCode(nationality);

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-600 font-bold">*</span>}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    dir="ltr" // Force LTR for phone numbers
                    value={value}
                    onChange={handleInputChange}
                    placeholder={`${countryCode} 1xxxxxxxx`}
                    disabled={disabled}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left ${error ? 'border-red-500' : 'border-gray-300'}`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-sm bg-gray-50 rounded-r-md border-l px-2">
                    {countryCode}
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-500 text-right">
                سيتم استخدام الرمز الدولي ({countryCode}) تلقائياً بناءً على الجنسية ({nationality})
            </p>
        </div>
    );
}
