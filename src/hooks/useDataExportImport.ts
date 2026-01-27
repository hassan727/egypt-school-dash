import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSystemSchoolId } from '@/context/SystemContext';

interface ImportResult {
    success: boolean;
    rowsImported: number;
    errors?: { row: number; message: string }[];
}

interface ExportOptions {
    academicYear?: string;
    stageId?: string;
    classId?: string;
    stageName?: string;
    className?: string;
}

interface ImportContext {
    academicYear: string;
    stageId: string;
    stageName: string;
    classId: string;
    className: string;
}

/**
 * تطبيع النص العربي للمقارنة
 */
const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ى]/g, 'ي')
        .replace(/[ة]/g, 'ه')
        .trim();
};

/**
 * ترتيب الطلاب: أبجدياً (الأولاد أولاً ثم البنات)
 */
const sortStudents = (students: any[]): any[] => {
    return students.sort((a, b) => {
        // 1. ترتيب حسب الجنس: الذكور أولاً
        const genderA = normalizeArabic(a.gender || '');
        const genderB = normalizeArabic(b.gender || '');

        const isMaleA = genderA === 'ذكر';
        const isMaleB = genderB === 'ذكر';

        if (isMaleA && !isMaleB) return -1;
        if (!isMaleA && isMaleB) return 1;

        // 2. ترتيب أبجدي بالاسم
        const nameA = a.full_name_ar || '';
        const nameB = b.full_name_ar || '';
        return nameA.localeCompare(nameB, 'ar');
    });
};

/**
 * هوك لتصدير واستيراد بيانات الطلاب
 * يعمل مباشرة مع قاعدة بيانات Supabase
 */
export function useDataExportImport() {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const schoolId = useSystemSchoolId();

    /**
     * تصدير البيانات بصيغة CSV
     */
    const exportToCSV = async (fieldsToExport: string[], options?: ExportOptions) => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');
            setProgress(10);
            setError(null);

            // 1. بناء استعلام الطلاب مع الفلاتر
            let query = supabase
                .from('students')
                .select(`
                    *,
                    classes (
                        name,
                        stages (name)
                    )
                `)
                .eq('school_id', schoolId); // Enforce School Identity

            // تطبيق الفلاتر
            if (options?.academicYear) {
                query = query.eq('academic_year', options.academicYear);
            }
            if (options?.classId) {
                query = query.eq('class_id', options.classId);
            } else if (options?.stageId) {
                // إذا تم اختيار مرحلة كاملة، نجلب كل الفصول في هذه المرحلة
                const { data: stageClasses } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('stage_id', options.stageId)
                    .eq('school_id', schoolId); // Enforce School Identity

                if (stageClasses && stageClasses.length > 0) {
                    const classIds = stageClasses.map(c => c.id);
                    query = query.in('class_id', classIds);
                }
            }

            const { data: students, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            if (!students || students.length === 0) {
                throw new Error('لا توجد بيانات للتصدير في النطاق المحدد');
            }

            setProgress(30);

            // 2. ترتيب الطلاب (الأولاد أولاً، ثم أبجدياً)
            const sortedStudents = sortStudents(students);

            setProgress(50);

            // 3. بناء رؤوس الأعمدة
            let headers: string[] = ['معرف_الطالب', 'الاسم_الكامل', 'النوع'];

            if (fieldsToExport.includes('personal')) {
                headers.push('الرقم_القومي', 'الديانة', 'الجنسية', 'تاريخ_الميلاد', 'مكان_الميلاد');
            }
            if (fieldsToExport.includes('academic')) {
                headers.push('المرحلة', 'الفصل', 'السنة_الدراسية', 'نوع_القيد');
            }
            if (fieldsToExport.includes('financial')) {
                headers.push('حالة_المصروفات');
            }
            if (fieldsToExport.includes('attendance')) {
                headers.push('حالة_الحضور');
            }
            if (fieldsToExport.includes('behavioral')) {
                headers.push('الحالة_السلوكية');
            }

            // إضافة بيانات ولي الأمر دائماً مع البيانات الشخصية
            if (fieldsToExport.includes('personal')) {
                headers.push('ولي_الأمر', 'هاتف_ولي_الأمر', 'واتساب_ولي_الأمر', 'وظيفة_ولي_الأمر');
                headers.push('اسم_الأم', 'هاتف_الأم');
            }

            setProgress(60);

            // 4. بناء صفوف البيانات
            const rows: string[][] = [];

            for (const student of sortedStudents) {
                const row: string[] = [
                    student.student_id || '',
                    student.full_name_ar || '',
                    student.gender || '',
                ];

                if (fieldsToExport.includes('personal')) {
                    row.push(
                        student.national_id || '',
                        student.religion || '',
                        student.nationality || '',
                        student.date_of_birth || '',
                        student.place_of_birth || ''
                    );
                }

                if (fieldsToExport.includes('academic')) {
                    row.push(
                        student.classes?.stages?.name || student.stage || '',
                        student.classes?.name || student.class || '',
                        student.academic_year || '',
                        student.enrollment_type || ''
                    );
                }

                if (fieldsToExport.includes('financial')) {
                    row.push(student.file_status || 'نشط');
                }

                if (fieldsToExport.includes('attendance')) {
                    row.push('--'); // سيتم تحسينها لاحقاً
                }

                if (fieldsToExport.includes('behavioral')) {
                    row.push('--'); // سيتم تحسينها لاحقاً
                }

                if (fieldsToExport.includes('personal')) {
                    row.push(
                        student.guardian_full_name || '',
                        student.guardian_phone || '',
                        student.guardian_whatsapp || '',
                        student.guardian_job || '',
                        student.mother_full_name || '',
                        student.mother_phone || ''
                    );
                }

                rows.push(row);
            }

            setProgress(80);

            // 5. تحويل إلى CSV مع دعم UTF-8 BOM للعربية
            const BOM = '\uFEFF';
            const csvContent = BOM + headers.join(',') + '\n' +
                rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

            // 6. إنشاء اسم الملف الذكي
            let filename = `students_export`;
            if (options?.stageName) filename += `_${options.stageName}`;
            if (options?.className) filename += `_${options.className}`;
            if (options?.academicYear) filename += `_${options.academicYear}`;
            filename += `_${new Date().toISOString().split('T')[0]}.csv`;

            // 7. تحميل الملف
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setProgress(100);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'حدث خطأ في التصدير';
            setError(message);
            throw new Error(message);
        }
    };

    /**
     * تصدير البيانات بصيغة JSON
     */
    const exportToJSON = async (fieldsToExport: string[], options?: ExportOptions) => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');
            setProgress(10);
            setError(null);

            // 1. بناء استعلام الطلاب مع الفلاتر
            let query = supabase
                .from('students')
                .select(`
                    *,
                    classes (
                        name,
                        stages (name)
                    )
                `)
                .eq('school_id', schoolId); // Enforce School Identity

            // تطبيق الفلاتر
            if (options?.academicYear) {
                query = query.eq('academic_year', options.academicYear);
            }
            if (options?.classId) {
                query = query.eq('class_id', options.classId);
            } else if (options?.stageId) {
                const { data: stageClasses } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('stage_id', options.stageId)
                    .eq('school_id', schoolId); // Enforce School Identity

                if (stageClasses && stageClasses.length > 0) {
                    const classIds = stageClasses.map(c => c.id);
                    query = query.in('class_id', classIds);
                }
            }

            const { data: students, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            if (!students || students.length === 0) {
                throw new Error('لا توجد بيانات للتصدير في النطاق المحدد');
            }

            setProgress(30);

            // 2. ترتيب الطلاب (الأولاد أولاً، ثم أبجدياً)
            const sortedStudents = sortStudents(students);

            setProgress(50);

            // 3. تحويل البيانات
            const exportData = sortedStudents.map(student => {
                const data: Record<string, any> = {
                    student_id: student.student_id,
                    full_name_ar: student.full_name_ar,
                    gender: student.gender,
                };

                if (fieldsToExport.includes('personal')) {
                    data.personal = {
                        national_id: student.national_id,
                        religion: student.religion,
                        nationality: student.nationality,
                        date_of_birth: student.date_of_birth,
                        place_of_birth: student.place_of_birth,
                    };
                    data.guardian = {
                        full_name: student.guardian_full_name,
                        phone: student.guardian_phone,
                        whatsapp: student.guardian_whatsapp,
                        job: student.guardian_job,
                    };
                    data.mother = {
                        full_name: student.mother_full_name,
                        phone: student.mother_phone,
                    };
                }

                if (fieldsToExport.includes('academic')) {
                    data.academic = {
                        stage: student.classes?.stages?.name || student.stage,
                        class: student.classes?.name || student.class,
                        academic_year: student.academic_year,
                        enrollment_type: student.enrollment_type,
                    };
                }

                return data;
            });

            setProgress(80);

            // 4. إنشاء اسم الملف الذكي
            let filename = `students_export`;
            if (options?.stageName) filename += `_${options.stageName}`;
            if (options?.className) filename += `_${options.className}`;
            if (options?.academicYear) filename += `_${options.academicYear}`;
            filename += `_${new Date().toISOString().split('T')[0]}.json`;

            // 5. تحميل الملف
            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setProgress(100);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'حدث خطأ في التصدير';
            setError(message);
            throw new Error(message);
        }
    };

    /**
     * استيراد البيانات من ملف CSV أو JSON
     */
    const importFromFile = async (file: File, context?: ImportContext): Promise<ImportResult> => {
        try {
            if (!schoolId) throw new Error('يرجى اختيار المدرسة أولاً');
            setProgress(10);
            setError(null);

            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const text = await file.text();

            let studentsToImport: any[] = [];

            if (fileExtension === 'json') {
                // استيراد من JSON
                const jsonData = JSON.parse(text);
                studentsToImport = Array.isArray(jsonData) ? jsonData : [jsonData];

                // تحويل الهيكل إلى هيكل قاعدة البيانات
                studentsToImport = studentsToImport.map(item => ({
                    student_id: item.student_id || `STU${Date.now()}${Math.floor(Math.random() * 1000)}`,
                    school_id: schoolId, // Enforce School Identity
                    full_name_ar: item.full_name_ar || item.personal?.full_name_ar,
                    national_id: item.national_id || item.personal?.national_id,
                    gender: item.gender || item.personal?.gender || 'ذكر',
                    religion: item.religion || item.personal?.religion || 'مسلم',
                    nationality: item.nationality || item.personal?.nationality || 'مصري',
                    // استخدام السياق إذا كان متوفراً
                    class_id: context?.classId,
                    stage: context?.stageName || item.stage || item.academic?.stage,
                    class: context?.className || item.class || item.academic?.class,
                    academic_year: context?.academicYear || item.academic_year || item.academic?.academic_year || '2025-2026',
                    guardian_full_name: item.guardian_full_name || item.guardian?.full_name,
                    guardian_phone: item.guardian_phone || item.guardian?.phone,
                    registration_status: 'provisionally_registered'
                }));

            } else if (fileExtension === 'csv') {
                // استيراد من CSV
                const lines = text.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    throw new Error('الملف فارغ أو لا يحتوي على بيانات');
                }

                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    const record: Record<string, string> = {};

                    headers.forEach((header, index) => {
                        record[header] = values[index] || '';
                    });

                    studentsToImport.push({
                        student_id: record['معرف_الطالب'] || `STU${Date.now()}${Math.floor(Math.random() * 1000)}`,
                        school_id: schoolId, // Enforce School Identity
                        full_name_ar: record['الاسم_الكامل'] || record['الاسم'],
                        national_id: record['الرقم_القومي'],
                        gender: record['النوع'] || 'ذكر',
                        religion: record['الديانة'] || 'مسلم',
                        nationality: record['الجنسية'] || 'مصري',
                        // استخدام السياق إذا كان متوفراً
                        class_id: context?.classId,
                        stage: context?.stageName || record['المرحلة'],
                        class: context?.className || record['الفصل'],
                        academic_year: context?.academicYear || record['السنة_الدراسية'] || '2025-2026',
                        guardian_full_name: record['ولي_الأمر'],
                        guardian_phone: record['هاتف_ولي_الأمر'],
                        registration_status: 'provisionally_registered'
                    });
                }
            } else {
                throw new Error('صيغة الملف غير مدعومة. استخدم CSV أو JSON');
            }

            setProgress(50);

            // فلترة السجلات الصالحة فقط
            const validStudents = studentsToImport.filter(s => s.full_name_ar && s.full_name_ar.length > 3);
            const errors: { row: number; message: string }[] = [];

            studentsToImport.forEach((s, index) => {
                if (!s.full_name_ar || s.full_name_ar.length <= 3) {
                    errors.push({ row: index + 2, message: 'الاسم مطلوب (أكثر من 3 أحرف)' });
                }
            });

            if (validStudents.length === 0) {
                throw new Error('لا توجد سجلات صالحة للاستيراد');
            }

            setProgress(70);

            // إدخال البيانات في قاعدة البيانات
            const { error: insertError } = await supabase
                .from('students')
                .insert(validStudents);

            if (insertError) {
                throw new Error(`خطأ في قاعدة البيانات: ${insertError.message}`);
            }

            setProgress(100);

            return {
                success: true,
                rowsImported: validStudents.length,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (err) {
            const message = err instanceof Error ? err.message : 'حدث خطأ في الاستيراد';
            setError(message);
            throw new Error(message);
        }
    };

    return {
        exportToCSV,
        exportToJSON,
        importFromFile,
        progress,
        error,
    };
}