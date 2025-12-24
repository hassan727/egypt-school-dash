/**
 * StudentImportPage - صفحة استيراد الطلاب من Excel
 * Dedicated page for Excel import with enhanced UI
 */

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Download,
    FileCheck,
    Users,
    Key,
    Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { processExcelData, ImportReferenceData, ImportContext, generateSmartTemplate, convertRawDataToJSON } from '@/utils/excelImport';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { getDefaultSchoolId } from '@/services/authService';

export default function StudentImportPage() {
    const { selectedYear } = useGlobalFilter();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [failedData, setFailedData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection state
    const [selectedStage, setSelectedStage] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [workbookData, setWorkbookData] = useState<string>('');
    const [schoolId, setSchoolId] = useState<string>('');

    // Reference data
    const [refData, setRefData] = useState<ImportReferenceData>({
        stages: [],
        classes: []
    });

    // Load reference data and default school
    useEffect(() => {
        const fetchData = async () => {
            // Fetch stages and classes
            const { data: stages } = await supabase.from('stages').select('*').order('name');
            const { data: classes } = await supabase.from('classes').select('*, stages(name)');
            setRefData({
                stages: stages || [],
                classes: classes || []
            });

            // Fetch default school
            const defSchoolId = await getDefaultSchoolId();
            if (defSchoolId) {
                setSchoolId(defSchoolId);
            }
        };
        fetchData();
    }, []);

    // Filter classes by stage
    const filteredClasses = refData.classes.filter(c => c.stage_id === selectedStage);

    // Download template
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
        XLSX.writeFile(wb, `نموذج_استيراد_${classObj.name}_${selectedYear}.xlsx`);
        toast.success('تم تحميل النموذج');
    };

    // Handle file change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            readSheetNames(selectedFile);
        }
    };

    // Read sheet names
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

                setWorkbookData(data);
                setAvailableSheets(sheets);

                if (sheets.length === 1) {
                    setSelectedSheet(sheets[0]);
                    parseSelectedSheet(data, sheets[0]);
                } else {
                    setStep(2);
                }
            } catch (err) {
                console.error(err);
                toast.error('فشل في قراءة الملف');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Parse selected sheet
    const parseSelectedSheet = (data: string, sheetName: string) => {
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
            const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
            const jsonData = convertRawDataToJSON(rawMatrix);
            const { success, failed } = processExcelData(jsonData, refData, context);

            // Add school_id to each student
            const successWithSchool = success.map(s => ({ ...s, school_id: schoolId }));

            setPreviewData(successWithSchool);
            setFailedData(failed);
            setStep(3);

            if (failed.length > 0) {
                toast.warning(`يوجد ${failed.length} صفوف بها أخطاء`);
            }
        } catch (err) {
            console.error(err);
            toast.error('فشل في معالجة الملف');
        }
    };

    // Handle import
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
                school_id: row.school_id,
                guardian_full_name: row.guardian_full_name,
                guardian_phone: row.guardian_phone,
                guardian_whatsapp: row.guardian_whatsapp,
                guardian_national_id: row.guardian_national_id,
                mother_full_name: row.mother_full_name,
                mother_phone: row.mother_phone,
                registration_status: 'provisionally_registered'
            }));

            const { error } = await supabase.from('students').insert(studentsToInsert);

            if (error) throw error;

            toast.success(`تم استيراد ${studentsToInsert.length} طالب بنجاح`);
            setStep(4);
        } catch (err: any) {
            console.error(err);
            toast.error(`فشل الاستيراد: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setStep(1);
        setFile(null);
        setPreviewData([]);
        setFailedData([]);
        setSelectedSheet('');
        setAvailableSheets([]);
        setWorkbookData('');
    };

    return (
        <DashboardLayout>
            <PageLayout
                title="استيراد الطلاب من Excel"
                description="استيراد بيانات الطلاب بشكل جماعي من ملف Excel"
                showBackButton
            >
                {/* Info Alert */}
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                    <Info className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800">إنشاء الحسابات تلقائي</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>عند استيراد الطلاب، يتم إنشاء حسابات تسجيل الدخول تلقائيًا</li>
                            <li>اسم المستخدم = الرقم القومي (14 رقم)</li>
                            <li>كلمة المرور = آخر 6 أرقام من الرقم القومي</li>
                            <li>لا يُسمح باستيراد اسم مستخدم أو كلمة مرور من Excel</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                {/* Step 1: Select & Upload */}
                {step === 1 && (
                    <div className="space-y-6">
                        {/* Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5" />
                                    الخطوة 1: اختر البيانات المطلوبة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>السنة الدراسية</Label>
                                        <Input value={selectedYear} disabled className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>المرحلة</Label>
                                        <Select value={selectedStage} onValueChange={setSelectedStage}>
                                            <SelectTrigger>
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
                                        <Label>الفصل</Label>
                                        <Select
                                            value={selectedClass}
                                            onValueChange={setSelectedClass}
                                            disabled={!selectedStage}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الفصل" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredClasses.map(cls => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={downloadTemplate}
                                        disabled={!selectedStage || !selectedClass}
                                    >
                                        <Download className="h-4 w-4 ml-2" />
                                        تحميل النموذج
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upload */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    الخطوة 2: رفع الملف
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={!selectedStage || !selectedClass}
                                    />
                                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-lg font-medium mb-2">اسحب الملف هنا أو انقر للاختيار</p>
                                    <p className="text-sm text-muted-foreground">
                                        يدعم ملفات Excel (xlsx, xls)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: Sheet Selection */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>اختر الورقة المطلوبة</CardTitle>
                            <CardDescription>
                                الملف يحتوي على عدة أوراق، اختر الورقة التي تريد استيرادها
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر ورقة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSheets.map(sheet => (
                                        <SelectItem key={sheet} value={sheet}>
                                            {sheet}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={resetForm}>
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={() => parseSelectedSheet(workbookData, selectedSheet)}
                                    disabled={!selectedSheet}
                                >
                                    متابعة
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Preview */}
                {step === 3 && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-green-700">سجلات صالحة</p>
                                        <p className="text-2xl font-bold text-green-800">{previewData.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-red-50 border-red-200">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                    <div>
                                        <p className="text-sm text-red-700">سجلات بها أخطاء</p>
                                        <p className="text-2xl font-bold text-red-800">{failedData.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>معاينة البيانات</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto max-h-96">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>الاسم</TableHead>
                                                <TableHead>الرقم القومي</TableHead>
                                                <TableHead>النوع</TableHead>
                                                <TableHead>ولي الأمر</TableHead>
                                                <TableHead>الحساب</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.slice(0, 10).map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{row.full_name_ar}</TableCell>
                                                    <TableCell className="font-mono">{row.national_id}</TableCell>
                                                    <TableCell>{row.gender}</TableCell>
                                                    <TableCell>{row.guardian_full_name || '-'}</TableCell>
                                                    <TableCell>
                                                        {row.national_id?.length === 14 ? (
                                                            <Badge className="bg-green-100 text-green-700 border-0">
                                                                <Key className="h-3 w-3 ml-1" />
                                                                سيُنشأ
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">لا يوجد</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {previewData.length > 10 && (
                                        <p className="text-center text-sm text-muted-foreground mt-4">
                                            ... و {previewData.length - 10} سجل آخر
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={resetForm}>
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={uploading || previewData.length === 0}
                                className="flex-1"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        جاري الاستيراد...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 ml-2" />
                                        استيراد {previewData.length} طالب
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                                <FileCheck className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-700 mb-2">
                                تم الاستيراد بنجاح!
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                تم استيراد {previewData.length} طالب وإنشاء حساباتهم تلقائيًا
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={resetForm}>
                                    استيراد آخر
                                </Button>
                                <Button asChild>
                                    <a href="/students/settings/accounts">
                                        <Users className="h-4 w-4 ml-2" />
                                        عرض الحسابات
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </PageLayout>
        </DashboardLayout>
    );
}
