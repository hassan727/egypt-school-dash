import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wallet, Save, CheckCircle, Calculator } from "lucide-react";

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

interface FinancialDataSectionProps {
    data: FinancialData;
    onSave: (data: FinancialData) => void;
    isReadOnly?: boolean;
}

export const FinancialDataSection = ({ data, onSave, isReadOnly = false }: FinancialDataSectionProps) => {
    const [formData, setFormData] = useState<FinancialData>(data);
    const [isModified, setIsModified] = useState(false);
    const [calculations, setCalculations] = useState({ gross: 0, insurance: 0, net: 0 });

    useEffect(() => {
        setFormData(data);
    }, [data]);

    // Recalculate whenever inputs change
    useEffect(() => {
        const gross =
            Number(formData.base_salary || 0) +
            Number(formData.incentives || 0) +
            Number(formData.housing_allowance || 0) +
            Number(formData.transport_allowance || 0) +
            Number(formData.work_nature_allowance || 0);

        const insurance = gross * (Number(formData.insurance_percentage || 0) / 100);
        const net = gross - insurance;

        setCalculations({ gross, insurance, net });
    }, [formData]);

    const handleChange = (field: keyof FinancialData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setIsModified(true);
    };

    const handleSave = () => {
        onSave(formData);
        setIsModified(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    return (
        <Card className="border-green-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-green-500" />
            <CardHeader className="bg-green-50/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                    <Wallet className="h-5 w-5" />
                    البيانات المالية
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Inputs Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Salary & Allowances */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <Label htmlFor="base_salary">الراتب الأساسي <span className="text-red-500">*</span></Label>
                                <Input
                                    id="base_salary"
                                    type="number"
                                    value={formData.base_salary}
                                    onChange={(e) => handleChange("base_salary", Number(e.target.value))}
                                    disabled={isReadOnly}
                                    className="bg-green-50/50 font-bold border-green-200"
                                />
                                <span className="absolute left-3 top-9 text-xs text-gray-400 font-bold">ج.م</span>
                            </div>
                            <div className="space-y-2">
                                <Label>الحوافز</Label>
                                <Input type="number" value={formData.incentives} onChange={(e) => handleChange("incentives", Number(e.target.value))} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>بدل السكن</Label>
                                <Input type="number" value={formData.housing_allowance} onChange={(e) => handleChange("housing_allowance", Number(e.target.value))} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>بدل الانتقال</Label>
                                <Input type="number" value={formData.transport_allowance} onChange={(e) => handleChange("transport_allowance", Number(e.target.value))} disabled={isReadOnly} />
                            </div>
                        </div>

                        <hr className="border-dashed border-gray-200" />

                        {/* Bank Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم البنك</Label>
                                <Input value={formData.bank_name} onChange={(e) => handleChange("bank_name", e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>رقم الحساب</Label>
                                <Input value={formData.bank_account} onChange={(e) => handleChange("bank_account", e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>IBAN</Label>
                                <Input value={formData.iban} onChange={(e) => handleChange("iban", e.target.value)} disabled={isReadOnly} dir="ltr" placeholder="EG..." />
                            </div>
                        </div>
                    </div>

                    {/* Calculations Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="bg-slate-900 text-white border-none shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Calculator className="h-4 w-4" />
                                    محاكاة الراتب
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400"><span>إجمالي (Gross)</span></div>
                                    <div className="text-xl font-bold">{formatCurrency(calculations.gross)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>تأمين ({formData.insurance_percentage}%)</span>
                                        <input
                                            type="number"
                                            className="w-12 h-5 text-xs bg-slate-700 text-center rounded border-none appearance-none"
                                            value={formData.insurance_percentage}
                                            onChange={(e) => handleChange("insurance_percentage", Number(e.target.value))}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div className="text-lg font-semibold text-red-300">
                                        - {formatCurrency(calculations.insurance)}
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-700">
                                    <div className="text-xs text-slate-400 mb-1">صافي الراتب المتوقع</div>
                                    <div className="text-2xl font-bold text-green-400">{formatCurrency(calculations.net)}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* Save/Status Footer */}
                {!isReadOnly && (
                    <div className="flex justify-end border-t pt-4 mt-4">
                        {isModified ? (
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4 ml-2" />
                                حفظ التغييرات
                            </Button>
                        ) : (
                            <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 pointer-events-none">
                                <CheckCircle className="w-4 h-4 ml-2" />
                                تم الحفظ
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
