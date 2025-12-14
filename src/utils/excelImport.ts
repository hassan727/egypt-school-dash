import * as XLSX from 'xlsx';

// Constants for normalization - simple static mappings for very common variations
const STATIC_STAGE_MAPPINGS: Record<string, string> = {
    "اول ابتدائي": "الصف الأول الابتدائي",
    "ثاني ابتدائي": "الصف الثاني الابتدائي",
    "ثالث ابتدائي": "الصف الثالث الابتدائي",
    "رابع ابتدائي": "الصف الرابع الابتدائي",
    "خامس ابتدائي": "الصف الخامس الابتدائي",
    "سادس ابتدائي": "الصف السادس الابتدائي",
    "اول اعدادي": "الصف الأول الإعدادي",
    "ثاني اعدادي": "الصف الثاني الإعدادي",
    "ثالث اعدادي": "الصف الثالث الإعدادي",
    "اول ثانوي": "الصف الأول الثانوي",
    "ثاني ثانوي": "الصف الثاني الثانوي",
    "ثالث ثانوي": "الصف الثالث الثانوي",
    "kg1": "KG1",
    "kg2": "KG2",
    "kg 1": "KG1",
    "kg 2": "KG2",
    // Add more mappings as needed
};

// Header Mappings (Fuzzy Match)
const HEADER_MAP: Record<string, string> = {
    "الاسم الرباعي": "full_name_ar",
    "اسم الطالب": "full_name_ar",
    "الاسم": "full_name_ar",
    "name": "full_name_ar",
    "full name": "full_name_ar",

    "الرقم القومي": "national_id",
    "national id": "national_id",

    "الجنسية": "nationality",
    "النوع": "gender",
    "الجنس": "gender",
    "الديانة": "religion",

    "المرحلة": "stage",
    "الصف": "stage",
    "المرحلة الدراسية": "stage",
    "المرحله الدراسيه": "stage",
    "الصف الدراسي": "stage",
    "Grade": "stage",
    "الفصل": "class",
    "class": "class",
    "section": "class",

    "سنة دراسية": "academic_year",
    "العام الدراسي": "academic_year",

    "ولي الامر": "guardian_full_name",
    "اسم الاب": "guardian_full_name",
    "اسم ولي الامر": "guardian_full_name",
    "اسم ولي الأمر": "guardian_full_name",

    "هاتف ولي الامر": "guardian_phone",
    "موبايل الاب": "guardian_phone",
    "تليفون الاب": "guardian_phone",
    "رقم ولي الامر": "guardian_phone",
    "رقم هاتف ولي الأمر": "guardian_phone",

    "واتساب ولي الامر": "guardian_whatsapp",
    "واتس اب": "guardian_whatsapp",
    "رقم واتساب ولي الأمر": "guardian_whatsapp",

    "رقم قومي ولي الامر": "guardian_national_id",
    "رقم قومي ولي الأمر": "guardian_national_id",
    "وظيفة ولي الامر": "guardian_job",
    "وظيفة ولي الأمر": "guardian_job",

    "اسم الام": "mother_full_name",
    "اسم الأم": "mother_full_name",
    "هاتف الام": "mother_phone",
    "موبايل الام": "mother_phone",
    "رقم هاتف الأم": "mother_phone"
};

export interface ProcessedStudent {
    data: any;
    errors: string[];
    warnings: string[];
    isValid: boolean;
    originalRow: any;
}

export interface ImportReferenceData {
    stages: { id: string; name: string }[];
    classes: { id: string; name: string; stage_id: string }[];
}

export interface ImportContext {
    academicYear: string;
    stageId: string;
    stageName: string;
    classId: string;
    className: string;
}

// 1. Text Cleaner & Normalizer
const cleanText = (text: any): string => {
    if (!text) return "";
    return String(text)
        .replace(/[^\w\s\u0600-\u06FF\-\.]/g, ' ') // Allow dots for abbreviations
        .replace(/\s+/g, ' ')
        .trim();
};

const normalizeArabic = (text: string): string => {
    if (!text) return "";
    let normalized = text.trim();

    // Unify Alef
    normalized = normalized.replace(/[أإآ]/g, 'ا');
    // Unify Yeh
    normalized = normalized.replace(/[ى]/g, 'ي');
    // Unify Ta Marbuta
    normalized = normalized.replace(/[ة]/g, 'ه');

    return normalized;
};

// 2. Number Parser (Scientific Notation Handler)
const parseCleanNumber = (val: any): string | null => {
    if (!val) return null;

    // Handle Excel Scientific Notation (e.g. 2.95E+13)
    if (typeof val === 'number') {
        // Convert to full string with precision
        return val.toLocaleString('fullwide', { useGrouping: false });
    }

    let str = String(val).trim();
    if (str.includes('E') || str.includes('e')) {
        return Number(str).toLocaleString('fullwide', { useGrouping: false });
    }

    // Remove non-digits
    return str.replace(/\D/g, '');
};

// 3. Phone Formatter
const formatPhone = (val: any): string | null => {
    const raw = parseCleanNumber(val);
    if (!raw) return null;

    // Egyptian Mobile validation
    if (raw.startsWith('20')) {
        return raw; // Already formatted
    }
    if (raw.startsWith('01') && raw.length === 11) {
        return '2' + raw;
    }
    if (raw.startsWith('1') && raw.length === 10) {
        return '20' + raw;
    }

    return raw; // Return raw if pattern not matched (might be landline or intl)
};

// 4. Header Normalizer
const normalizeHeader = (header: string): string | null => {
    const clean = header.trim().replace(/[()\-_]/g, ' ').replace(/\s+/g, ' ').toLowerCase();

    // Exact map mapping
    if (HEADER_MAP[clean]) return HEADER_MAP[clean];

    // Partial Match
    for (const [key, value] of Object.entries(HEADER_MAP)) {
        if (clean === key || clean.includes(key)) return value;
    }

    return null;
};

// Smart Stage/Class Matcher
const findStageAndClassId = (
    stageInput: string,
    classInput: string,
    refData: ImportReferenceData
): { classId: string | null; stageName: string | null; className: string | null; error?: string } => {

    if (!stageInput || !classInput) {
        return { classId: null, stageName: null, className: null, error: "المرحلة والفصل مطلوبان" };
    }

    // A. Resolve Stage
    let targetStage = null;
    const cleanStageInput = cleanText(stageInput).toLowerCase();
    const normalizedStageInput = normalizeArabic(cleanStageInput);

    // 1. Try Exact/Normalized Name Match in DB
    targetStage = refData.stages.find(s =>
        s.name === stageInput ||
        normalizeArabic(s.name) === normalizedStageInput ||
        s.name.toLowerCase() === cleanStageInput
    );

    // 2. Try Static Mappings if not found
    if (!targetStage) {
        // Check if input matches a key in mappings (either exact or normalized)
        for (const [key, mappedName] of Object.entries(STATIC_STAGE_MAPPINGS)) {
            if (cleanStageInput === key || normalizedStageInput === normalizeArabic(key)) {
                // Found a mapping, now find the real stage object for this mapped name
                targetStage = refData.stages.find(s => s.name === mappedName);
                if (targetStage) break;
            }
        }
    }

    if (!targetStage) {
        // 3. Try "Contains" logic as fallback
        targetStage = refData.stages.find(s => {
            const dbNorm = normalizeArabic(s.name);
            return dbNorm.includes(normalizedStageInput) || normalizedStageInput.includes(dbNorm);
        });
    }

    if (!targetStage) {
        return { classId: null, stageName: null, className: null, error: `المرحلة غير معروفة: ${stageInput}` };
    }

    // B. Resolve Class within the found Stage
    let targetClass = null;

    // Clean class input: remove all spaces for better matching (e.g. "1 A" -> "1A")
    const cleanClassInput = String(classInput).trim().toUpperCase().replace(/\s+/g, '');
    const normalizedClassInput = normalizeArabic(cleanClassInput.toLowerCase());

    // Filter classes for this stage only
    const stageClasses = refData.classes.filter(c => c.stage_id === targetStage?.id);

    // Try finding class
    targetClass = stageClasses.find(c => {
        const dbNameClean = c.name.toUpperCase().replace(/\s+/g, '');
        return dbNameClean === cleanClassInput ||
            normalizeArabic(dbNameClean.toLowerCase()) === normalizedClassInput;
    });

    if (!targetClass) {
        // Try fallback for "First Grade" variations if strictly numerical/alpha
        // e.g. input "1/1" -> DB "1A"? No, too risky.
        // But maybe "الأول" -> "1"?
        // Let's stick to alphanumeric cleanup for now.

        return {
            classId: null,
            stageName: targetStage.name,
            className: null,
            error: `الفصل غير موجود في ${targetStage.name}: ${classInput}`
        };
    }

    return {
        classId: targetClass.id,
        stageName: targetStage.name,
        className: targetClass.name
    };
};

// Main Processor
export const processExcelData = (rawData: any[], refData: ImportReferenceData, context?: ImportContext): { success: any[], failed: any[] } => {
    const success: any[] = [];
    const failed: any[] = [];

    rawData.forEach((row, index) => {
        const student: any = { registration_status: 'active' };
        const errors: string[] = [];

        // Temp vars for smart matching
        let rawStage = "";
        let rawClass = "";

        // If Context is provided, pre-fill it
        if (context) {
            student['class_id'] = context.classId;
            student['stage'] = context.stageName;
            student['class'] = context.className;
            student['academic_year'] = context.academicYear;
        }

        // Map Headers & Process Values
        Object.keys(row).forEach(originalKey => {
            const mappedKey = normalizeHeader(originalKey);
            const value = row[originalKey];

            if (!mappedKey) return; // Skip unknown columns

            if (mappedKey === 'full_name_ar' || mappedKey === 'guardian_full_name' || mappedKey === 'mother_full_name') {
                student[mappedKey] = cleanText(value);
            } else if (mappedKey === 'national_id' || mappedKey === 'guardian_national_id' || mappedKey === 'mother_national_id') {
                const cleaned = parseCleanNumber(value);
                // Validation: National ID length (warn only, don't block unless critical?)
                // Strict requirement usually: 14 digits
                if (mappedKey === 'national_id' && (cleaned && cleaned.length !== 14)) {
                    errors.push(`الرقم القومي غير صالح: ${cleaned} (يجب أن يكون 14 رقم)`);
                }
                student[mappedKey] = cleaned;
            } else if (mappedKey.includes('phone') || mappedKey.includes('whatsapp')) {
                student[mappedKey] = formatPhone(value);
            } else if (mappedKey === 'stage') {
                rawStage = String(value).trim();
            } else if (mappedKey === 'class') {
                rawClass = String(value).trim();
            } else if (mappedKey === 'religion') {
                student[mappedKey] = String(value).trim();
            } else {
                student[mappedKey] = value;
            }
        });

        // Smart Resolve Stage & Class (ONLY IF NO CONTEXT provided)
        if (!context) {
            const resolution = findStageAndClassId(rawStage, rawClass, refData);

            if (resolution.error) {
                errors.push(resolution.error);
                // Keep raw values for user to see what failed
                student['stage'] = rawStage;
                student['class'] = rawClass;
            } else {
                student['class_id'] = resolution.classId;
                student['stage'] = resolution.stageName; // For display/legacy
                student['class'] = resolution.className; // For display/legacy
            }
        }

        // If context provided, we trust the context, but ensure we don't have conflicts? 
        // No, user said ignore file values. But maybe warn if they differ? 
        // For simplicity, we just use context as the source of truth.

        // Mandatory Checks
        if (!student.full_name_ar || student.full_name_ar.length < 5) {
            errors.push("الاسم رباعي مطلوب (أكبر من 5 أحرف)");
        }

        // Basic dup check (very weak, relying on unique constraints in DB later, but good for UX)
        // logic here...

        // Final Decision
        if (errors.length > 0) {
            failed.push({ row: index + 2, data: row, errors }); // Row + 2 because Excel 1-based + Header
        } else {
            // Generate ID if not present (usually DB does this, but we have student_id field)
            if (!student.student_id) {
                const year = new Date().getFullYear();
                const randomNum = Math.floor(Math.random() * 10000);
                student.student_id = `STU${year}${randomNum.toString().padStart(4, '0')}`;
            }
            if (!student.nationality) student.nationality = 'مصري';
            if (!student.gender) student.gender = 'ذكر';
            // Normalize gender variations
            if (student.gender && (student.gender === 'انثي' || student.gender === 'أنثي')) {
                student.gender = 'أنثى';
            }
            if (!student.academic_year) student.academic_year = '2025-2026';

            success.push(student);
        }
    });

    return { success, failed };
};

export const generateSmartTemplate = (context: ImportContext) => {
    // Generate rows with pre-filled context
    const templateData = [
        {
            "الاسم الرباعي": "",
            "الرقم القومي": "", // Text
            "النوع": "ذكر",    // Dropdown value
            "الديانة": "مسلم",
            "المرحلة الدراسية": context.stageName, // Locked
            "الفصل": context.className,            // Locked
            "السنة الدراسية": context.academicYear, // Pre-filled
            "اسم ولي الأمر": "",
            "رقم هاتف ولي الأمر": "", // Text
            "رقم واتساب ولي الأمر": "",
            "رقم قومي ولي الأمر": "",
            "وظيفة ولي الأمر": "",
            "اسم الأم": "",
            "رقم هاتف الأم": ""
        }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths (optional but nice)
    ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 20 }, // National ID
        { wch: 10 }, // Gender
        { wch: 10 }, // Religion
        { wch: 20 }, // Stage
        { wch: 10 }, // Class
        { wch: 15 }, // Year
        { wch: 25 }, // Guardian Name
        { wch: 15 }, // Guardian Phone
        { wch: 15 }, // Guardian Whatsapp
        { wch: 20 }, // Guardian ID
        { wch: 15 }, // Guardian Job
        { wch: 25 }, // Mother Name
        { wch: 15 }, // Mother Phone
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    return wb;
};
