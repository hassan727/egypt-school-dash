import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EMPLOYEE_ROLE_SPECIFIC_FIELDS, DynamicFieldDefinition } from '@/data/employeeConstants';

export interface RoleSpecificData {
    [key: string]: string | number;
}

interface EmployeeRoleSpecificFieldsProps {
    employeeRole: string;
    data: RoleSpecificData;
    onChange: (field: string, value: string | number) => void;
    errors?: Record<string, string>;
    isReadOnly?: boolean;
}

export const EmployeeRoleSpecificFields = ({
    employeeRole,
    data,
    onChange,
    errors = {},
    isReadOnly = false,
}: EmployeeRoleSpecificFieldsProps) => {
    const fields = EMPLOYEE_ROLE_SPECIFIC_FIELDS[employeeRole];

    if (!fields || fields.length === 0) {
        return (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                لا توجد حقول إضافية لنوع الموظف المختار
            </div>
        );
    }

    const renderField = (field: DynamicFieldDefinition) => {
        const value = data[field.name] ?? '';
        const error = errors[field.name];

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        id={field.name}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        disabled={isReadOnly}
                    />
                );

            case 'number':
                return (
                    <Input
                        id={field.name}
                        type="number"
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        disabled={isReadOnly}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={field.name}
                        type="date"
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        disabled={isReadOnly}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={value.toString()}
                        onValueChange={(v) => onChange(field.name, v)}
                        disabled={isReadOnly}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || 'اختر خياراً'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'textarea':
                return (
                    <Textarea
                        id={field.name}
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        disabled={isReadOnly}
                        rows={4}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-800 text-sm font-medium">
                حقول إضافية حسب النوع الوظيفي
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field) => (
                    <div key={field.name} className="grid gap-2">
                        <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field)}
                        {errors[field.name] && <p className="text-xs text-red-500">{errors[field.name]}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};
