import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { processExcelData, ImportReferenceData, ImportContext, generateSmartTemplate, convertRawDataToJSON } from '@/utils/excelImport';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { useSystemSchoolId } from '@/context/SystemContext';
import { StudentService } from '@/services/studentService';

interface ImportStudentsModalProps {
    onSuccess: () => void;
}

export function ImportStudentsModal({ onSuccess }: ImportStudentsModalProps) {
    const schoolId = useSystemSchoolId();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [failedData, setFailedData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sheet selection state (for multi-sheet Excel files)
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [workbookData, setWorkbookData] = useState<string | null>(null);

    // Reference Data State
    const [refData, setRefData] = useState<ImportReferenceData>({ stages: [], classes: [] });
    const [loadingRefs, setLoadingRefs] = useState(false);

    // Context Selection State
    const { academicYears } = useGlobalFilter(); // Get years from global context
    const [selectedYear, setSelectedYear] = useState<string>('2025-2026'); // Default to current/next
    const [selectedStage, setSelectedStage] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');

    useEffect(() => {
        // Reset class if stage changes
        setSelectedClass('');
    }, [selectedStage]);

    useEffect(() => {
        if (open) {
            fetchReferenceData();
        }
    }, [open]);

    const fetchReferenceData = async () => {
        if (!schoolId) return;
        setLoadingRefs(true);
        try {
            const { data: stages } = await supabase.from('stages').select('id, name').eq('school_id', schoolId);
            const { data: classes } = await supabase.from('classes').select('id, name, stage_id').eq('school_id', schoolId);
            setRefData({
                stages: stages || [],
                classes: classes || []
            });
        } catch (error) {
            console.error("Error fetching reference data:", error);
            toast.error("فشل في تحميل بيانات المراحل والفصول");
        } finally {
            setLoadingRefs(false);
        }
    };

    const downloadTemplate = () => {
        if (!selectedYear || !selectedStage || !selectedClass) {
            toast.error("يرجى اختيار السنة والمرحلة والفصل أولاً");
            return;
        }

        const stageObj = refData.stages.find(s => s.id === selectedStage);
        const classObj = refData.classes.find(c => c.id === selectedClass);

        if (!stageObj || !classObj) return;

        const context: ImportContext = {
            academicYear: selectedYear,
            stageId: stageObj.id,
            stageName: stageObj.name,
            classId: classObj.id,
            className: classObj.name
        };

        const wb = generateSmartTemplate(context);
        XLSX.writeFile(wb, `template_${classObj.name}_${selectedYear}.xlsx`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            readSheetNames(selectedFile);
        }
    };

    // Read sheet names from Excel file
    const readSheetNames = (file: File) => {
        if (!selectedYear || !selectedStage || !selectedClass) {
            toast.error("يرجى اختيار السنة والمرحلة والفصل أولاً");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result as string;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheets = workbook.SheetNames;

                // Save workbook data for later use
                setWorkbookData(data);
                setAvailableSheets(sheets);

                // Smart behavior: if only one sheet, skip selection and parse directly
                if (sheets.length === 1) {
                    setSelectedSheet(sheets[0]);
                    parseSelectedSheet(data, sheets[0]);
                } else {
                    // Multiple sheets - show selection step
                    setStep(2);
                }
            } catch (err) {
                console.error(err);
                toast.error('فشل في قراءة الملف. تأكد من أنه ملف Excel صالح.');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Parse specific sheet from the Excel file
    const parseSelectedSheet = (data: string, sheetName: string) => {
        if (!selectedYear || !selectedStage || !selectedClass) {
            toast.error("يرجى اختيار السنة والمرحلة والفصل أولاً");
            return;
        }

        const stageObj = refData.stages.find(s => s.id === selectedStage);
        const classObj = refData.classes.find(c => c.id === selectedClass);

        if (!stageObj || !classObj) {
            toast.error("بيانات المرحلة أو الفصل غير صحيحة");
            return;
        }

        const context: ImportContext = {
            academicYear: selectedYear,
            stageId: stageObj.id,
            stageName: stageObj.name,
            classId: classObj.id,
            className: classObj.name
        };

        try {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[sheetName];

            // 1. Get Raw Data (Array of Arrays) to find the header row manually
            const rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            // 2. Convert to Smart JSON
            const jsonData = convertRawDataToJSON(rawMatrix);

            // Use the smart processor with CONTEXT
            const { success, failed } = processExcelData(jsonData, refData, context);

            setPreviewData(success);
            setFailedData(failed);
            setStep(3); // Now step 3 is preview (was step 2)

            if (failed.length > 0) {
                toast.warning(`يوجد ${failed.length} صفوف بها أخطاء`);
            }

        } catch (err) {
            console.error(err);
            toast.error('فشل في معالجة الورقة المحددة.');
        }
    };

    const handleImport = async () => {
        setUploading(true);
        try {
            const studentsToInsert = previewData.map(row => ({
                student_id: row.student_id,
                full_name_ar: row.full_name_ar,
                national_id: row.national_id,
                gender: row.gender,
                religion: row.religion,
                nationality: row.nationality,
                class_id: row.class_id,
                stage: row.stage,
                class: row.class,
                academic_year: row.academic_year,
                // Guardian fields
                guardian_full_name: row.guardian_full_name,
                guardian_phone: row.guardian_phone,
                guardian_whatsapp: row.guardian_whatsapp,
                guardian_national_id: row.guardian_national_id,
                guardian_job: row.guardian_job,
                // Mother fields
                mother_full_name: row.mother_full_name,
                mother_phone: row.mother_phone,
                registration_status: 'provisionally_registered'
            }));

            if (!schoolId) {
                toast.error('لم يتم تحديد المدرسة');
                return;
            }

            await StudentService.importStudentsData(schoolId, studentsToInsert);

            toast.success(`تم استيراد ${studentsToInsert.length} طالب بنجاح`);
            setOpen(false);
            onSuccess();
            resetForm();
        } catch (err: any) {
            console.error(err);
            toast.error(`فشل الاستيراد: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setFile(null);
        setPreviewData([]);
        setFailedData([]);
        setAvailableSheets([]);
        setSelectedSheet('');
        setWorkbookData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    استيراد من Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>استيراد الطلاب</DialogTitle>
                    <DialogDescription>
                        أضف طلاب جدد عن طريق رفع ملف Excel. اختر المرحلة والفصل لتوليد قالب مناسب.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {loadingRefs && <div className="text-sm text-blue-600">جاري تحميل بيانات المراحل...</div>}

                    {step === 1 && !loadingRefs && (
                        <div className="space-y-4">
                            {/* 1. Context Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="space-y-2">
                                    <Label>السنة الدراسية</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر السنة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map(year => (
                                                <SelectItem key={year.year_code} value={year.year_code}>
                                                    {year.year_name_ar}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>المرحلة الدراسية</Label>
                                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر المرحلة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {refData.stages.map(stage => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>الفصل الدراسي</Label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedStage}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="اختر الفصل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {refData.classes
                                                .filter(c => c.stage_id === selectedStage)
                                                .map(cls => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    <div>
                                        <h4 className="font-medium">قالب الاستيراد</h4>
                                        <p className="text-sm text-gray-500">قم بتحميل القالب لملء البيانات بشكل صحيح</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={!selectedYear || !selectedStage || !selectedClass}>
                                    <Download className="h-4 w-4 mr-2" />
                                    تحميل القالب الذكي
                                </Button>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm font-medium">اضغط لرفع الملف أو اسحبه هنا</p>
                                <p className="text-xs text-gray-500 mt-1">XLSX, XLS (الحد الأقصى 5MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Sheet Selection (for multi-sheet Excel files) */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <Alert>
                                <FileSpreadsheet className="h-4 w-4" />
                                <AlertTitle>اختر الورقة</AlertTitle>
                                <AlertDescription>
                                    تم العثور على {availableSheets.length} ورقة في الملف. اختر الورقة المناسبة للفصل المحدد.
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-2 max-h-60 overflow-y-auto">
                                {availableSheets.map((sheet) => (
                                    <div
                                        key={sheet}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${selectedSheet === sheet
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                        onClick={() => setSelectedSheet(sheet)}
                                    >
                                        <input
                                            type="radio"
                                            name="sheet-selection"
                                            checked={selectedSheet === sheet}
                                            onChange={() => setSelectedSheet(sheet)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                        <span className="font-medium">{sheet}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStep(1);
                                        setAvailableSheets([]);
                                        setSelectedSheet('');
                                        setWorkbookData(null);
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="flex-1"
                                >
                                    رجوع
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (workbookData && selectedSheet) {
                                            parseSelectedSheet(workbookData, selectedSheet);
                                        }
                                    }}
                                    disabled={!selectedSheet}
                                    className="flex-1"
                                >
                                    متابعة
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview Data */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {/* Success Summary */}
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">تم قراءة {previewData.length} سجل صالح وجاهز للاستيراد</span>
                            </div>

                            {/* Errors Summary */}
                            {failedData.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>سجلات بها أخطاء ({failedData.length})</AlertTitle>
                                    <AlertDescription>
                                        <div className="mt-2 max-h-40 overflow-y-auto text-xs grid gap-1">
                                            {failedData.map((fail, i) => (
                                                <div key={i} className="pb-1 border-b border-red-200 last:border-0">
                                                    <strong>صف {fail.row}:</strong> {fail.errors.join('، ')}
                                                    <span className="opacity-50 mx-1">|</span>
                                                    {fail.data && (
                                                        <span className="text-gray-600">{fail.data['الاسم'] || fail.data['full_name_ar'] || 'بدون اسم'}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Preview Table */}
                            {previewData.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-700">معاينة البيانات المقبولة (أول 10):</h4>
                                    <div className="border rounded-md overflow-hidden overflow-x-auto">
                                        <table className="min-w-full border-collapse text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-right border-b">الاسم</th>
                                                    <th className="px-3 py-2 text-right border-b">القومي</th>
                                                    <th className="px-3 py-2 text-right border-b">المرحلة (المطابقة)</th>
                                                    <th className="px-3 py-2 text-right border-b">الفصل (المطابق)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {previewData.slice(0, 10).map((row, i) => (
                                                    <tr key={i} className="hover:bg-blue-50">
                                                        <td className="px-3 py-2">{row.full_name_ar}</td>
                                                        <td className="px-3 py-2">{row.national_id}</td>
                                                        <td className="px-3 py-2 text-green-700 font-medium bg-green-50">{row.stage}</td>
                                                        <td className="px-3 py-2 text-green-700 font-medium bg-green-50">{row.class}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {previewData.length > 10 && (
                                        <p className="text-xs text-gray-500 text-center">...و {previewData.length - 10} آخرين</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 3 && (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={resetForm} className="flex-1">إلغاء</Button>
                            <Button
                                onClick={handleImport}
                                disabled={uploading || previewData.length === 0}
                                className="flex-1"
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد واستيراد'}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
