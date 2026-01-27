/**
 * غرفة التحكم المركزية - Control Room
 * البوابة الإجبارية لتحديد هوية النظام قبل العمل
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSystem, School } from '@/context/SystemContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { useAuth } from '@/context/AuthContext';
import {
    Building2,
    Calendar,
    User,
    Rocket,
    Loader2,
    Settings2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ControlRoom() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { identity, schools, isLoading, setSchool, setAcademicYear } = useSystem();
    const { academicYears, loading: yearsLoading } = useGlobalFilter();

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(identity.school?.id || '');
    const [selectedYear, setSelectedYear] = useState<string>(identity.academicYear || '');

    // Sync with existing identity
    useEffect(() => {
        if (identity.school?.id) {
            setSelectedSchoolId(identity.school.id);
        }
        if (identity.academicYear) {
            setSelectedYear(identity.academicYear);
        }
    }, [identity]);

    // Auto-select first school and active year if not selected
    useEffect(() => {
        if (!selectedSchoolId && schools.length > 0) {
            setSelectedSchoolId(schools[0].id);
        }
    }, [schools, selectedSchoolId]);

    useEffect(() => {
        if (!selectedYear && academicYears.length > 0) {
            const activeYear = academicYears.find((y: any) => y.is_active);
            setSelectedYear(activeYear?.year_code || academicYears[0]?.year_code || '');
        }
    }, [academicYears, selectedYear]);

    const handleStartWork = () => {
        if (!selectedSchoolId) {
            toast.error('يرجى اختيار المدرسة أولاً');
            return;
        }
        if (!selectedYear) {
            toast.error('يرجى اختيار السنة الدراسية');
            return;
        }

        const school = schools.find(s => s.id === selectedSchoolId);
        if (school) {
            setSchool(school);
            setAcademicYear(selectedYear);
            toast.success(`تم تحديد الهوية: ${school.school_name} - ${selectedYear}`);
            navigate('/');
        }
    };

    const isReady = selectedSchoolId && selectedYear;

    if (isLoading || yearsLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mx-auto" />
                    <p className="text-white/70">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-8 space-y-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-4">
                        <Settings2 className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">غرفة التحكم المركزية</h1>
                    <p className="text-white/60 max-w-md mx-auto">
                        حدد هوية النظام قبل البدء في العمل. هذه الإعدادات ستطبق على جميع الإدارات.
                    </p>
                </div>

                {/* Main Card */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-white text-xl">تحديد الهوية الأساسية</CardTitle>
                        <CardDescription className="text-white/60">
                            اختر المدرسة والسنة الدراسية للمتابعة
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {/* School Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-white font-medium">
                                <Building2 className="h-5 w-5 text-indigo-400" />
                                المدرسة
                            </label>
                            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 text-base">
                                    <SelectValue placeholder="اختر المدرسة..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {schools.map((school) => (
                                        <SelectItem key={school.id} value={school.id}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-indigo-500" />
                                                {school.school_name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedSchoolId && (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    تم اختيار المدرسة
                                </div>
                            )}
                        </div>

                        {/* Academic Year Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-white font-medium">
                                <Calendar className="h-5 w-5 text-purple-400" />
                                السنة الدراسية
                            </label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 text-base">
                                    <SelectValue placeholder="اختر السنة الدراسية..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears
                                        .sort((a: any, b: any) => b.year_code.localeCompare(a.year_code))
                                        .map((year: any) => (
                                            <SelectItem key={year.year_code} value={year.year_code}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-purple-500" />
                                                    {year.year_code}
                                                    {year.is_active && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                            نشطة
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {selectedYear && (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    تم اختيار السنة الدراسية
                                </div>
                            )}
                        </div>

                        {/* Current User Display */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-white font-medium">
                                <User className="h-5 w-5 text-cyan-400" />
                                المستخدم الحالي
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{user?.fullName || 'المطور'}</p>
                                    <p className="text-white/50 text-sm">{user?.role || 'admin'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/10 pt-4" />

                        {/* Status Summary */}
                        <div className={`rounded-lg p-4 ${isReady ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                            <div className="flex items-center gap-3">
                                {isReady ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                                ) : (
                                    <AlertCircle className="h-6 w-6 text-yellow-400" />
                                )}
                                <div>
                                    <p className={`font-medium ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {isReady ? 'جاهز للعمل' : 'يرجى إكمال الاختيارات'}
                                    </p>
                                    <p className="text-white/50 text-sm">
                                        {isReady
                                            ? `${schools.find(s => s.id === selectedSchoolId)?.school_name} - ${selectedYear}`
                                            : 'اختر المدرسة والسنة الدراسية للمتابعة'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Start Button */}
                        <Button
                            onClick={handleStartWork}
                            disabled={!isReady}
                            className={`w-full h-14 text-lg font-bold transition-all duration-300 ${isReady
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
                                    : 'bg-gray-600 cursor-not-allowed'
                                }`}
                        >
                            <Rocket className="h-5 w-5 ml-2" />
                            ابدأ العمل
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-white/40 text-sm mt-6">
                    يمكنك تغيير هذه الإعدادات لاحقاً من الشريط العلوي
                </p>
            </div>
        </div>
    );
}
