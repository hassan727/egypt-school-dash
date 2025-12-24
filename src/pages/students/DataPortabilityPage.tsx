import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDataExportImport } from '@/hooks/useDataExportImport';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { supabase } from '@/lib/supabase';
import { Download, Upload, FileJson, FileText, ArrowLeft, CheckCircle2, AlertCircle, Loader, Users, GraduationCap, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface StageData {
    id: string;
    name: string;
}

interface ClassData {
    id: string;
    name: string;
    stage_id: string;
}

export default function DataPortabilityPage() {
    const navigate = useNavigate();
    const { academicYears } = useGlobalFilter();
    const {
        exportToCSV,
        exportToJSON,
        importFromFile,
        progress,
        error: importError,
    } = useDataExportImport();

    // Export Filters State
    const [stages, setStages] = useState<StageData[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [selectedClass, setSelectedClass] = useState<string>('all');

    // Import State
    const [importYear, setImportYear] = useState<string>('');
    const [importStage, setImportStage] = useState<string>('');
    const [importClass, setImportClass] = useState<string>('');

    const [exportFields, setExportFields] = useState({
        personal: true,
        academic: true,
        financial: false,
        attendance: false,
        behavioral: false,
    });
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch stages and classes on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: stagesData } = await supabase.from('stages').select('id, name').order('name');
                const { data: classesData } = await supabase.from('classes').select('id, name, stage_id').order('name');

                if (stagesData) setStages(stagesData);
                if (classesData) setClasses(classesData);
            } catch (error) {
                console.error('Error fetching stages/classes:', error);
            }
        };
        fetchData();

        // Set default academic year
        if (academicYears.length > 0) {
            const current = academicYears.find(y => y.is_current);
            setSelectedYear(current?.year_code || academicYears[0]?.year_code || '');
            setImportYear(current?.year_code || academicYears[0]?.year_code || '');
        }
    }, [academicYears]);

    // Reset class when stage changes
    useEffect(() => {
        setSelectedClass('all');
    }, [selectedStage]);

    useEffect(() => {
        setImportClass('');
    }, [importStage]);

    // Get filtered classes for selected stage
    const filteredClasses = selectedStage && selectedStage !== 'all'
        ? classes.filter(c => c.stage_id === selectedStage)
        : [];

    const importFilteredClasses = importStage
        ? classes.filter(c => c.stage_id === importStage)
        : [];

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const fieldsToExport = Object.keys(exportFields).filter(
                key => exportFields[key as keyof typeof exportFields]
            );

            if (fieldsToExport.length === 0) {
                toast.warning('يرجى اختيار حقل واحد على الأقل للتصدير');
                setIsExporting(false);
                return;
            }

            if (!selectedYear) {
                toast.warning('يرجى اختيار السنة الدراسية');
                setIsExporting(false);
                return;
            }

            toast.info('جاري تصدير البيانات...');

            // Build export options with filters
            const exportOptions = {
                academicYear: selectedYear,
                stageId: selectedStage !== 'all' ? selectedStage : undefined,
                classId: selectedClass !== 'all' ? selectedClass : undefined,
                stageName: selectedStage !== 'all' ? stages.find(s => s.id === selectedStage)?.name : undefined,
                className: selectedClass !== 'all' ? classes.find(c => c.id === selectedClass)?.name : undefined,
            };

            if (exportFormat === 'csv') {
                await exportToCSV(fieldsToExport, exportOptions);
            } else {
                await exportToJSON(fieldsToExport, exportOptions);
            }

            toast.success(`تم تصدير البيانات بصيغة ${exportFormat.toUpperCase()} بنجاح! تحقق من مجلد التنزيلات.`);
        } catch (err) {
            toast.error(`خطأ في التصدير: ${err instanceof Error ? err.message : 'حدث خطأ'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (file: File) => {
        if (!importYear) {
            toast.warning('يرجى اختيار السنة الدراسية أولاً');
            return;
        }
        if (!importStage) {
            toast.warning('يرجى اختيار المرحلة الدراسية أولاً');
            return;
        }
        if (!importClass) {
            toast.warning('يرجى اختيار الفصل أولاً');
            return;
        }

        setIsImporting(true);
        try {
            toast.info('جاري استيراد البيانات...');

            const importContext = {
                academicYear: importYear,
                stageId: importStage,
                stageName: stages.find(s => s.id === importStage)?.name || '',
                classId: importClass,
                className: classes.find(c => c.id === importClass)?.name || '',
            };

            const result = await importFromFile(file, importContext);
            if (result.success) {
                toast.success(`تم استيراد ${result.rowsImported} طالب بنجاح!`);
            } else {
                toast.warning(`تم استيراد ${result.rowsImported} طالب. الأخطاء: ${result.errors?.length || 0}`);
            }
        } catch (err) {
            toast.error(`خطأ في الاستيراد: ${err instanceof Error ? err.message : 'حدث خطأ'}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <DashboardLayout>
            <PageLayout title="تصدير واستيراد البيانات" description="نقل بيانات الطلاب من وإلى النظام">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Download className="h-6 w-6 text-green-600" />
                                تصدير واستيراد البيانات
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">انقل بيانات الطلاب بسهولة إلى صيغ مختلفة</p>
                        </div>
                        <Button
                            onClick={() => navigate('/students')}
                            variant="outline"
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            عودة
                        </Button>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Export Section */}
                        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                            <div className="flex items-center gap-2 mb-6">
                                <Download className="h-5 w-5 text-blue-600" />
                                <h3 className="text-xl font-semibold text-gray-800">تصدير البيانات</h3>
                            </div>

                            {/* Filter Section - Stage/Class/Year */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
                                <div className="flex items-center gap-2 text-blue-700 font-semibold">
                                    <Users className="h-4 w-4" />
                                    <span>اختر نطاق التصدير</span>
                                </div>

                                {/* Academic Year */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4" />
                                        السنة الدراسية
                                    </Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر السنة الدراسية" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map(year => (
                                                <SelectItem key={year.year_code} value={year.year_code}>
                                                    {year.year_name_ar} {year.is_current ? '(الحالية)' : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Stage Selection */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm">
                                        <GraduationCap className="h-4 w-4" />
                                        المرحلة الدراسية
                                    </Label>
                                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر المرحلة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع المراحل</SelectItem>
                                            {stages.map(stage => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Class Selection */}
                                <div className="space-y-2">
                                    <Label className="text-sm">الفصل</Label>
                                    <Select
                                        value={selectedClass}
                                        onValueChange={setSelectedClass}
                                        disabled={selectedStage === 'all'}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر الفصل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع الفصول</SelectItem>
                                            {filteredClasses.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Info about sorting */}
                                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                    📌 سيتم ترتيب الطلاب: أبجدياً (الأولاد أولاً ثم البنات)
                                </div>
                            </div>

                            {/* Export Format Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-3">اختر صيغة التصدير</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'csv', label: 'CSV', icon: FileText },
                                        { value: 'json', label: 'JSON', icon: FileJson },
                                    ].map(format => {
                                        const Icon = format.icon;
                                        return (
                                            <button
                                                key={format.value}
                                                onClick={() => setExportFormat(format.value as 'csv' | 'json')}
                                                className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center gap-2 justify-center ${exportFormat === format.value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {format.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fields Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-3">اختر الحقول المراد تصديرها</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'personal', label: '👤 البيانات الشخصية' },
                                        { key: 'academic', label: '📚 البيانات الأكاديمية' },
                                        { key: 'financial', label: '💰 البيانات المالية' },
                                        { key: 'attendance', label: '📅 بيانات الحضور' },
                                        { key: 'behavioral', label: '⭐ البيانات السلوكية' },
                                    ].map(field => (
                                        <label key={field.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                            <input
                                                type="checkbox"
                                                checked={exportFields[field.key as keyof typeof exportFields]}
                                                onChange={(e) =>
                                                    setExportFields({
                                                        ...exportFields,
                                                        [field.key]: e.target.checked,
                                                    })
                                                }
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            <span className="text-gray-700">{field.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Export Button */}
                            <Button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full bg-blue-600 hover:bg-blue-700 gap-2 py-2"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin" />
                                        جاري التصدير...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        تصدير البيانات
                                    </>
                                )}
                            </Button>

                            {/* Info */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                                <p className="font-semibold mb-1">💡 نصيحة</p>
                                <p>سيتم تحميل البيانات المختارة على جهازك بصيغة {exportFormat.toUpperCase()}.</p>
                            </div>
                        </Card>

                        {/* Import Section */}
                        <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                            <div className="flex items-center gap-2 mb-6">
                                <Upload className="h-5 w-5 text-green-600" />
                                <h3 className="text-xl font-semibold text-gray-800">استيراد البيانات</h3>
                            </div>

                            {/* Import Context Selection */}
                            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg space-y-4">
                                <div className="flex items-center gap-2 text-green-700 font-semibold">
                                    <Users className="h-4 w-4" />
                                    <span>اختر وجهة الاستيراد (إلزامي)</span>
                                </div>

                                {/* Academic Year */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4" />
                                        السنة الدراسية *
                                    </Label>
                                    <Select value={importYear} onValueChange={setImportYear}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر السنة الدراسية" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map(year => (
                                                <SelectItem key={year.year_code} value={year.year_code}>
                                                    {year.year_name_ar} {year.is_current ? '(الحالية)' : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Stage Selection */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm">
                                        <GraduationCap className="h-4 w-4" />
                                        المرحلة الدراسية *
                                    </Label>
                                    <Select value={importStage} onValueChange={setImportStage}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر المرحلة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages.map(stage => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Class Selection */}
                                <div className="space-y-2">
                                    <Label className="text-sm">الفصل *</Label>
                                    <Select
                                        value={importClass}
                                        onValueChange={setImportClass}
                                        disabled={!importStage}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر الفصل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {importFilteredClasses.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* File Upload Area */}
                            <div className="mb-6">
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${importYear && importStage && importClass
                                            ? 'border-gray-300 hover:border-green-500'
                                            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                        }`}
                                    onClick={() => {
                                        if (importYear && importStage && importClass) {
                                            fileInputRef.current?.click();
                                        } else {
                                            toast.warning('يرجى اختيار السنة والمرحلة والفصل أولاً');
                                        }
                                    }}
                                >
                                    <Upload className={`h-12 w-12 mx-auto mb-3 ${importYear && importStage && importClass ? 'text-gray-400' : 'text-gray-300'}`} />
                                    <p className="font-semibold text-gray-700 mb-1">انقر هنا لاختيار ملف</p>
                                    <p className="text-sm text-gray-600">أو اسحب وأفلت ملف CSV أو JSON</p>
                                    <p className="text-xs text-gray-500 mt-2">الحد الأقصى: 50 ميجابايت</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.json"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            handleImport(e.target.files[0]);
                                        }
                                    }}
                                    className="hidden"
                                />
                            </div>

                            {/* Progress */}
                            {(isImporting || progress > 0) && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        {isImporting ? (
                                            <Loader className="h-4 w-4 animate-spin text-blue-600" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        )}
                                        <span className="text-sm font-semibold text-gray-800">
                                            {isImporting ? 'جاري الاستيراد...' : 'تم الانتهاء'}
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-full overflow-hidden h-2">
                                        <div
                                            className="bg-green-600 h-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">{Math.round(progress)}%</p>
                                </div>
                            )}

                            {/* Error Display */}
                            {importError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex gap-2 items-start">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-900">
                                            <p className="font-semibold mb-1">خطأ في الاستيراد</p>
                                            <p>{importError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-900">
                                <p className="font-semibold mb-1">✅ صيغ مدعومة</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>CSV مع رؤوس أعمدة</li>
                                    <li>JSON مع مصفوفة من الكائنات</li>
                                </ul>
                            </div>
                        </Card>
                    </div>

                    {/* Important Notice */}
                    <Card className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-900">
                                <p className="font-semibold mb-1">⚠️ تنبيه مهم</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>تأكد من صحة البيانات قبل الاستيراد</li>
                                    <li>الاستيراد لن يحذف البيانات الحالية</li>
                                    <li>سيتم تحديث السجلات المكررة تلقائياً</li>
                                    <li>احفظ نسخة احتياطية قبل الاستيراد</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </PageLayout>
        </DashboardLayout>
    );
}