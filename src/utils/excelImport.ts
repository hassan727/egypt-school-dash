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
    // Name variations - be very flexible
    "الاسم الرباعي": "full_name_ar",
    "اسم الطالب": "full_name_ar",
    "الاسم": "full_name_ar",
    "اسم": "full_name_ar",
    "الاسم الكامل": "full_name_ar",
    "الإسم": "full_name_ar",
    "اسم الطالب/ة": "full_name_ar",
    "اسم الطالب الرباعي": "full_name_ar",
    "الاسم بالعربي": "full_name_ar",
    "اسم الطالبة": "full_name_ar",
    "student name": "full_name_ar",
    "name": "full_name_ar",
    "full name": "full_name_ar",
    "fullname": "full_name_ar",
    "student": "full_name_ar",

    // National ID variations
    "الرقم القومي": "national_id",
    "الرقم القومى": "national_id",
    "رقم قومي": "national_id",
    "قومي": "national_id",
    "national id": "national_id",
    "nationalid": "national_id",
    "id": "national_id",

    // Gender variations
    "الجنسية": "nationality",
    "النوع": "gender",
    "الجنس": "gender",
    "جنس": "gender",
    "نوع": "gender",
    "ذكر/انثى": "gender",
    "ذكر/أنثى": "gender",
    "gender": "gender",
    "sex": "gender",

    // Religion
    "الديانة": "religion",
    "الديانه": "religion",
    "ديانة": "religion",
    "ديانه": "religion",
    "religion": "religion",

    // Stage/Class
    "المرحلة": "stage",
    "المرحله": "stage",
    "الصف": "stage",
    "المرحلة الدراسية": "stage",
    "المرحله الدراسيه": "stage",
    "الصف الدراسي": "stage",
    "الصف الدراسى": "stage",
    "مرحلة": "stage",
    "Grade": "stage",
    "grade": "stage",
    "stage": "stage",

    "الفصل": "class",
    "فصل": "class",
    "الشعبة": "class",
    "شعبة": "class",
    "class": "class",
    "section": "class",

    // Academic year
    "سنة دراسية": "academic_year",
    "السنة الدراسية": "academic_year",
    "العام الدراسي": "academic_year",
    "السنه الدراسيه": "academic_year",
    "العام": "academic_year",
    "academic year": "academic_year",
    "year": "academic_year",

    // Guardian
    "ولي الامر": "guardian_full_name",
    "ولي الأمر": "guardian_full_name",
    "اسم الاب": "guardian_full_name",
    "اسم الأب": "guardian_full_name",
    "اسم ولي الامر": "guardian_full_name",
    "اسم ولي الأمر": "guardian_full_name",
    "الاب": "guardian_full_name",
    "الأب": "guardian_full_name",
    "guardian": "guardian_full_name",

    "هاتف ولي الامر": "guardian_phone",
    "هاتف ولي الأمر": "guardian_phone",
    "موبايل الاب": "guardian_phone",
    "موبايل الأب": "guardian_phone",
    "تليفون الاب": "guardian_phone",
    "تليفون الأب": "guardian_phone",
    "رقم ولي الامر": "guardian_phone",
    "رقم ولي الأمر": "guardian_phone",
    "رقم هاتف ولي الأمر": "guardian_phone",
    "رقم هاتف ولي الامر": "guardian_phone",
    "تليفون ولي الأمر": "guardian_phone",
    "موبايل ولي الأمر": "guardian_phone",
    "guardian phone": "guardian_phone",

    "واتساب ولي الامر": "guardian_whatsapp",
    "واتساب ولي الأمر": "guardian_whatsapp",
    "واتس اب": "guardian_whatsapp",
    "واتساب": "guardian_whatsapp",
    "رقم واتساب ولي الأمر": "guardian_whatsapp",
    "رقم واتساب ولي الامر": "guardian_whatsapp",
    "whatsapp": "guardian_whatsapp",

    "رقم قومي ولي الامر": "guardian_national_id",
    "رقم قومي ولي الأمر": "guardian_national_id",
    "قومي ولي الأمر": "guardian_national_id",
    "قومى ولى الامر": "guardian_national_id",

    "وظيفة ولي الامر": "guardian_job",
    "وظيفة ولي الأمر": "guardian_job",
    "وظيفه ولي الامر": "guardian_job",
    "وظيفة الاب": "guardian_job",
    "وظيفة الأب": "guardian_job",
    "guardian job": "guardian_job",

    // Mother
    "اسم الام": "mother_full_name",
    "اسم الأم": "mother_full_name",
    "الام": "mother_full_name",
    "الأم": "mother_full_name",
    "mother": "mother_full_name",

    "هاتف الام": "mother_phone",
    "هاتف الأم": "mother_phone",
    "موبايل الام": "mother_phone",
    "موبايل الأم": "mother_phone",
    "رقم هاتف الأم": "mother_phone",
    "رقم هاتف الام": "mother_phone",
    "تليفون الأم": "mother_phone",
    "mother phone": "mother_phone"
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

// Helper: Convert Raw Array of Arrays to JSON with Smart Header Detection
export const convertRawDataToJSON = (rawMatrix: any[][]): any[] => {
    // 1. Scan for Header Row
    let headerRowIndex = -1;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(rawMatrix.length, 20); i++) {
        const row = rawMatrix[i];
        // Check if this row looks like a header row
        // A header row usually contains string values that match our known headers
        const potentialHeaders = row.map(cell => String(cell).trim());
        const matchCount = potentialHeaders.filter(h => normalizeHeader(h)).length;

        // If we find at least 2 matches (e.g. Name + ID, or Name + Class), it's highly likely the header
        if (matchCount >= 2) {
            headerRowIndex = i;
            headers = potentialHeaders;
            break;
        }
    }

    // Fallback: If no strong match, try row 0 if it has strings
    if (headerRowIndex === -1 && rawMatrix.length > 0) {
        // Simple heuristic: Are all first row items strings?
        if (rawMatrix[0].every(cell => typeof cell === 'string')) {
            headerRowIndex = 0;
            headers = rawMatrix[0].map(c => String(c).trim());
        }
    }

    if (headerRowIndex === -1) return []; // Can't process

    // 2. Convert to JSON using found headers
    const jsonData: any[] = [];

    // Iterate rows AFTER the header
    for (let i = headerRowIndex + 1; i < rawMatrix.length; i++) {
        const row = rawMatrix[i];
        const rowObj: any = {};
        let hasData = false;

        headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
                // Use the original header string as key (ProcessExcelData will normalize it later)
                rowObj[header] = row[colIndex];
                if (String(row[colIndex]).trim()) hasData = true;
            }
        });

        if (hasData) {
            jsonData.push(rowObj);
        }
    }

    return jsonData;
};

// Main Processor
// Now expects `rawData` to be the JSON array produced either by XLSX direct or our smart converter
export const processExcelData = (rawData: any[], refData: ImportReferenceData, context?: ImportContext): { success: any[], failed: any[] } => {
    const success: any[] = [];
    const failed: any[] = [];

    // 1. Locate Header Row (Smart Scan)
    // Sometimes files have titles in the first few rows. We scan up to 20 rows to find the header.
    let headerRowIndex = 0;
    let foundHeader = false;

    // We look for a row that has at least one column resembling "Name" or "Student Name"
    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        const row = rawData[i];
        const keys = Object.keys(row);
        const values = Object.values(row).map(v => String(v).trim());

        // Check keys (if sheet_to_json parsed headers already) or values (if checking raw rows)
        // Note: XLSX.utils.sheet_to_json by default uses first row as header. 
        // If the real header is later, the keys might be __EMPTY_1 etc, and the values will be the headers.
        // BUT, since we already converted to JSON, XLSX likely messed up if header wasn't row 1.
        // Wait! We can't re-parse here easily without the raw sheet.
        // STRATEGY: We assume the input `rawData` might be malformed if XLSX used row 1 as header but it wasn't.
        // Actually, the caller passed `jsonData` from `XLSX.utils.sheet_to_json(sheet)`. 
        // If header is row 5, rows 1-4 become data rows with weird keys.

        // Better Strategy: The caller should handle Finding the Header Row BEFORE converting to JSON?
        // No, let's try to fix it here if possible. 
        // If `sheet_to_json` was called without `header: 1`, it tries to guess or uses row 0.

        // Let's rely on finding a ROW whose values look like headers.
        const potentialHeaders = keys.map(k => String(k)); // If keys are the headers

        // Check if any key matches our known headers
        const matchCount = potentialHeaders.filter(h => normalizeHeader(h)).length;
        if (matchCount > 0) {
            // Found it! using default parsing.
            headerRowIndex = 0;
            foundHeader = true;
            break;
        }
    }

    // THIS IS TRICKY: `processExcelData` receives `rawData` which is ALREADY JSON.
    // If the header wasn't line 1, XLSX.sheet_to_json(sheet) produces garbage keys for later rows.
    // We MUST parse the sheet differently in the Caller OR accept that we need to pass the SHEET not JSON.
    // HOWEVER: fixing this in `ImportStudentsModal` is better.

    // Let's revert this specific change and return empty/failed if we can't find columns, 
    // and instruct the helper to be called with options.

    // Actually, `rawData` is what we have. Let's process it as is for now.
    // If user says headers match but fail, check logical mapping.

    // Wait, the user said the file has: "م اسم الطالب الجنس الديانة"
    // "م" is likely "seq" or ignored.
    // "اسم الطالب" -> full_name_ar (Matches HEADER_MAP)
    // "الجنس" -> gender (Matches HEADER_MAP)
    // "الديانة" -> religion (Matches HEADER_MAP)

    // If it fails, maybe `rawStage` and `rawClass` are missing?
    // The code logic says:
    // // Smart Resolve Stage & Class (ONLY IF NO CONTEXT provided)
    // if (!context) { ... }

    // But in `ImportStudentsModal`, we ALWAYS pass `context`!
    // const context: ImportContext = { ... };
    // processExcelData(jsonData, refData, context);

    // So `rawStage` and `rawClass` are NOT used for resolution.
    // The context provides stage/class.

    // So why "No Name"?
    // "الاسم رباعي مطلوب" -> student.full_name_ar is missing.
    // This happens if `mappedKey === 'full_name_ar'` is never hit.
    // This happens if `normalizeHeader(originalKey)` returns null.

    // Means `originalKey` (e.g. "اسم الطالب") is not matching in `HEADER_MAP`.
    // But I just added "اسم الطالب".

    // Maybe hidden characters? BOM? encoding?
    // Let's add a debugger log or similar? I can't see console.

    // Let's be extremely lenient with header normalization.

    rawData.forEach((row, index) => {
        // Skip rows that look empty or are just titles in the middle of data (rare)
        if (Object.keys(row).length < 2) return;

        const student: any = { registration_status: 'active' };
        const errors: string[] = [];

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
                if (mappedKey === 'national_id' && (cleaned && cleaned.length !== 14)) {
                    // Optional warning
                }
                student[mappedKey] = cleaned;
            } else if (mappedKey.includes('phone') || mappedKey.includes('whatsapp')) {
                student[mappedKey] = formatPhone(value);
            } else if (mappedKey === 'stage') {
                student['stage'] = String(value).trim(); // Keep raw for now if needed, but context overrides usually
            } else if (mappedKey === 'class') {
                student['class'] = String(value).trim();
            } else if (mappedKey === 'religion') {
                student[mappedKey] = String(value).trim();
            } else if (mappedKey === 'gender') {
                student[mappedKey] = String(value).trim();
            } else {
                student[mappedKey] = value;
            }
        });

        // Mandatory Checks
        // If Name is missing, maybe it's under a key we didn't recognize OR blank row
        if (!student.full_name_ar || student.full_name_ar.length < 5) {
            // Don't error immediately if the row looks totally empty or just "sequence" number
            // But if it has other data, it's an error.

            // Check if row has significant data
            const hasData = Object.values(row).some(v => v && String(v).trim().length > 1);
            if (hasData) {
                errors.push(`الاسم رباعي مطلوب (أكبر من 5 أحرف)|${student.full_name_ar || 'بدون اسم'}`);
            } else {
                return; // Skip empty row silently
            }
        }

        // Final Decision
        if (errors.length > 0) {
            failed.push({ row: index + 2, data: row, errors });
        } else {
            // Defaults
            if (!student.student_id) {
                const year = new Date().getFullYear();
                // Format: STU + Year + 6 digits (Timestamp part + Random) to ensure uniqueness
                // Using last 3 digits of timestamp + 3 random digits
                const timestampPart = Date.now().toString().slice(-4);
                const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');

                // STU + Year + 9 digits (secure enough)
                student.student_id = `STU${year}${timestampPart}${randomPart}`;
            }
            if (!student.nationality) student.nationality = 'مصري';
            if (!student.gender) student.gender = 'ذكر';
            // Normalize gender variations
            if (student.gender && (student.gender === 'انثي' || student.gender === 'أنثي' || student.gender === 'انثى')) {
                student.gender = 'أنثى';
            }
            if (student.academic_year === undefined) student.academic_year = '2025-2026';

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
