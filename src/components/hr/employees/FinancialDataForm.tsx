import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Calculator, AlertCircle } from "lucide-react";

export interface FinancialData {
    base_salary: number;
    incentives: number;
    housing_allowance: number;
    transport_allowance: number;
    work_nature_allowance: number;
    insurance_percentage: number;
    insurance_number: string;
    bank_name: string;
    bank_account: string;
    iban: string;
    account_type: string;
}

interface FinancialDataFormProps {
    data: FinancialData;
    onChange: (data: FinancialData) => void;
    isReadOnly?: boolean;
}

export const FinancialDataForm = ({ data, onChange, isReadOnly = false }: FinancialDataFormProps) => {
    const [calculations, setCalculations] = useState({ gross: 0, insurance: 0, net: 0 });

    // Recalculate whenever inputs change
    useEffect(() => {
        const gross =
            Number(data.base_salary || 0) +
            Number(data.incentives || 0) +
            Number(data.housing_allowance || 0) +
            Number(data.transport_allowance || 0) +
            Number(data.work_nature_allowance || 0);

        const insurance = gross * (Number(data.insurance_percentage || 0) / 100);
        const net = gross - insurance;

        setCalculations({ gross, insurance, net });
    }, [data]);

    const handleChange = (field: keyof FinancialData, value: string | number) => {
        onChange({ ...data, [field]: value });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-6">
                {/* 1. Salary & Allowances */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wallet className="h-5 w-5 text-blue-600" />
                            الرواتب والبدلات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="base_salary" className="flex items-center gap-1">الراتب الأساسي <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input
                                        id="base_salary"
                                        type="number"
                                        value={data.base_salary}
                                        onChange={(e) => handleChange("base_salary", Number(e.target.value))}
                                        disabled={isReadOnly}
                                        className="bg-blue-50/50 font-bold text-lg"
                                    />
                                    <span className="absolute left-3 top-3 text-xs text-gray-500 font-bold">ج.م</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incentives">الحوافز</Label>
                                <Input
                                    id="incentives"
                                    type="number"
                                    value={data.incentives}
                                    onChange={(e) => handleChange("incentives", Number(e.target.value))}
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="housing_allowance">بدل السكن</Label>
                                <Input
                                    id="housing_allowance"
                                    type="number"
                                    value={data.housing_allowance}
                                    onChange={(e) => handleChange("housing_allowance", Number(e.target.value))}
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transport_allowance">بدل الانتقال</Label>
                                <Input
                                    id="transport_allowance"
                                    type="number"
                                    value={data.transport_allowance}
                                    onChange={(e) => handleChange("transport_allowance", Number(e.target.value))}
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="work_nature_allowance">بدل طبيعة عمل</Label>
                                <Input
                                    id="work_nature_allowance"
                                    type="number"
                                    value={data.work_nature_allowance}
                                    onChange={(e) => handleChange("work_nature_allowance", Number(e.target.value))}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Insurance & Bank Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            البيانات البنكية والتأمينات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Insurance Section */}
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">التأمينات الاجتماعية</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="insurance_percentage">نسبة الخصم %</Label>
                                    <Input
                                        id="insurance_percentage"
                                        type="number"
                                        value={data.insurance_percentage}
                                        onChange={(e) => handleChange("insurance_percentage", Number(e.target.value))}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="insurance_number">رقم التأمين</Label>
                                    <Input
                                        id="insurance_number"
                                        value={data.insurance_number}
                                        onChange={(e) => handleChange("insurance_number", e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder="EMP-XXXX"
                                    />
                                </div>
                            </div>

                            {/* Bank Section */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">اسم البنك</Label>
                                    <Input
                                        id="bank_name"
                                        value={data.bank_name}
                                        onChange={(e) => handleChange("bank_name", e.target.value)}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_account">رقم الحساب</Label>
                                    <Input
                                        id="bank_account"
                                        value={data.bank_account}
                                        onChange={(e) => handleChange("bank_account", e.target.value)}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="iban">IBAN</Label>
                                    <Input
                                        id="iban"
                                        value={data.iban}
                                        onChange={(e) => handleChange("iban", e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder="EG..."
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_type">نوع الحساب</Label>
                                    <Select
                                        value={data.account_type}
                                        onValueChange={(v) => handleChange("account_type", v)}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger id="account_type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="جاري">حساب جاري</SelectItem>
                                            <SelectItem value="توفير">حساب توفير</SelectItem>
                                            <SelectItem value="راتب">حساب راتب</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calculations Information */}
            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl sticky top-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-slate-300 flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            ملخص الراتب الشهري
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>إجمالي الاستحقاقات</span>
                                <span>(Gross)</span>
                            </div>
                            <div className="text-2xl font-bold">{formatCurrency(calculations.gross)}</div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>خصم التأمينات ({data.insurance_percentage}%)</span>
                                <span className="text-red-400">-</span>
                            </div>
                            <div className="text-xl font-semibold text-red-300">
                                - {formatCurrency(calculations.insurance)}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-sm text-slate-400 mb-1">صافي الراتب</div>
                                    <div className="text-3xl font-bold text-green-400">
                                        {formatCurrency(calculations.net)}
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-green-400" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!isReadOnly && (
                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3 border border-blue-100">
                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">معلومة هامة</p>
                            يتم احتساب التأمينات تلقائياً بناءً على إجمالي الاستحقاقات (الأساسي + البدلات). يرجى مراجعة اللوائح الداخلية للشركة للتأكد من نسب الخصم.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
