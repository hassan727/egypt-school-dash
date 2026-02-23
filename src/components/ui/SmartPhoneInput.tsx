import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// Country codes with names for dropdown
const COUNTRY_CODES_LIST = [
    { code: '+20', name: 'مصر', nationality: 'مصري' },
    { code: '+966', name: 'السعودية', nationality: 'سعودي' },
    { code: '+971', name: 'الإمارات', nationality: 'إماراتي' },
    { code: '+965', name: 'الكويت', nationality: 'كويتي' },
    { code: '+974', name: 'قطر', nationality: 'قطري' },
    { code: '+973', name: 'البحرين', nationality: 'بحريني' },
    { code: '+968', name: 'عمان', nationality: 'عماني' },
    { code: '+967', name: 'اليمن', nationality: 'يمني' },
    { code: '+962', name: 'الأردن', nationality: 'أردني' },
    { code: '+961', name: 'لبنان', nationality: 'لبناني' },
    { code: '+963', name: 'سوريا', nationality: 'سوري' },
    { code: '+964', name: 'العراق', nationality: 'عراقي' },
    { code: '+970', name: 'فلسطين', nationality: 'فلسطيني' },
    { code: '+249', name: 'السودان', nationality: 'سوداني' },
    { code: '+218', name: 'ليبيا', nationality: 'ليبي' },
    { code: '+216', name: 'تونس', nationality: 'تونسي' },
    { code: '+213', name: 'الجزائر', nationality: 'جزائري' },
    { code: '+212', name: 'المغرب', nationality: 'مغربي' },
    { code: '+222', name: 'موريتانيا', nationality: 'موريتاني' },
    { code: '+252', name: 'الصومال', nationality: 'صومالي' },
    { code: '+253', name: 'جيبوتي', nationality: 'جيبوتي' },
    { code: '+269', name: 'جزر القمر', nationality: 'قمري' },
];

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
    // Get default country code based on nationality
    const getDefaultCountryCode = (nat: string) => {
        return COUNTRY_CODES[nat] || COUNTRY_CODES['default'];
    };

    // Extract country code and phone number from combined value
    const extractPhoneData = (fullValue: string): { code: string; number: string } => {
        if (!fullValue) return { code: getDefaultCountryCode(nationality), number: '' };

        // Try to match country code at the start
        const match = fullValue.match(/^(\+\d{1,4})(.*)/);
        if (match) {
            return { code: match[1], number: match[2] };
        }

        // No country code found, assume it's just the number
        return { code: getDefaultCountryCode(nationality), number: fullValue };
    };

    // State for selected country code and phone number (separated)
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');

    // Initialize and update when value or nationality changes
    useEffect(() => {
        const { code, number } = extractPhoneData(value);
        setSelectedCountryCode(code);
        setPhoneNumber(number);
    }, [value, nationality]);

    // Handle phone number input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value;
        setPhoneNumber(newNumber);

        // Merge code with number and send to parent
        onChange(selectedCountryCode + newNumber);
    };

    // Handle country code change
    const handleCountryCodeChange = (newCode: string) => {
        setSelectedCountryCode(newCode);

        // Merge new code with existing number and send to parent
        onChange(newCode + phoneNumber);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-600 font-bold">*</span>}
            </Label>

            <div className="flex gap-2">
                {/* Country Code Selector */}
                <Select
                    value={selectedCountryCode}
                    onValueChange={handleCountryCodeChange}
                    disabled={disabled}
                >
                    <SelectTrigger className="w-40 bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {COUNTRY_CODES_LIST.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                                {country.code} {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Phone Number Input */}
                <div className="flex-1">
                    <Input
                        id={id}
                        dir="ltr"
                        value={phoneNumber}
                        onChange={handleInputChange}
                        placeholder={placeholder || '1xxxxxxxx'}
                        disabled={disabled}
                        className={`w-full ${error ? 'border-red-500' : ''}`}
                    />
                </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            <p className="text-xs text-gray-500 text-right">
                المفتاح الافتراضي بناءً على الجنسية: {getDefaultCountryCode(nationality)} ({nationality})
                {selectedCountryCode !== getDefaultCountryCode(nationality) && (
                    <span className="text-blue-600 font-medium"> • تم تغيير المفتاح يدوياً إلى {selectedCountryCode}</span>
                )}
            </p>
        </div>
    );
}
