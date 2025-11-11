import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StudentProfile } from '@/types/student';

interface ExportOptions {
    includePersonalData: boolean;
    includeAcademic: boolean;
    includeFinancial: boolean;
    includeAttendance: boolean;
    includeBehavioral: boolean;
    format: 'csv' | 'json';
}

interface ImportResult {
    successful: number;
    failed: number;
    errors: { row: number; error: string }[];
}

export function useDataExportImport() {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);

    // تصدير بيانات الطالب
    const exportStudentData = async (
        studentProfiles: StudentProfile[],
        options: ExportOptions
    ): Promise<string | Blob> => {
        try {
            setExporting(true);
            setProgress(0);

            if (options.format === 'json') {
                return exportToJSON(studentProfiles, options);
            } else {
                return exportToCSV(studentProfiles, options);
            }
        } catch (err) {
            console.error('خطأ في تصدير البيانات:', err);
            throw err;
        } finally {
            setExporting(false);
            setProgress(100);
        }
    };

    const exportToJSON = async (
        studentProfiles: StudentProfile[],
        options: ExportOptions
    ): Promise<string> => {
        const exportData = studentProfiles.map(profile => {
            const data: Record<string, any> = {
                studentId: profile.studentId,
            };

            if (options.includePersonalData) {
                data.personalData = profile.personalData;
                data.enrollmentData = profile.enrollmentData;
                data.guardianData = profile.guardianData;
                data.motherData = profile.motherData;
                data.administrativeData = profile.administrativeData;
                data.emergencyContacts = profile.emergencyContacts;
            }

            if (options.includeAcademic) {
                data.academicRecords = profile.academicRecords;
            }

            if (options.includeFinancial) {
                data.schoolFees = profile.schoolFees;
                data.otherExpenses = profile.otherExpenses;
                data.financialTransactions = profile.financialTransactions;
            }

            if (options.includeAttendance) {
                data.attendanceRecords = profile.attendanceRecords;
            }

            if (options.includeBehavioral) {
                data.behavioralData = profile.behavioralData;
                data.behavioralRecords = profile.behavioralRecords;
            }

            return data;
        });

        return JSON.stringify(exportData, null, 2);
    };

    const exportToCSV = async (
        studentProfiles: StudentProfile[],
        options: ExportOptions
    ): Promise<string> => {
        let csv = '';
        const headers: string[] = ['معرف الطالب', 'الاسم'];

        if (options.includePersonalData) {
            headers.push('المرحلة', 'الفصل', 'ولي الأمر', 'رقم الهاتف');
        }

        if (options.includeAcademic) {
            headers.push('المعدل التراكمي', 'متوسط الدرجات', 'حالة النجاح');
        }

        if (options.includeFinancial) {
            headers.push('إجمالي المصروفات', 'المسدد', 'المتبقي');
        }

        if (options.includeAttendance) {
            headers.push('أيام الحضور', 'أيام الغياب', 'نسبة الحضور');
        }

        if (options.includeBehavioral) {
            headers.push('التقييم السلوكي', 'الملاحظات');
        }

        csv = headers.join(',') + '\n';

        studentProfiles.forEach(profile => {
            const row: string[] = [
                profile.studentId,
                profile.personalData.fullNameAr,
            ];

            if (options.includePersonalData) {
                row.push(
                    profile.enrollmentData.stage,
                    profile.enrollmentData.class,
                    profile.guardianData.fullName,
                    profile.guardianData.phone
                );
            }

            if (options.includeAcademic && profile.academicRecords.length > 0) {
                const academic = profile.academicRecords[0];
                row.push(
                    academic.currentGPA?.toString() || '',
                    academic.averageMarks?.toString() || '',
                    academic.passingStatus || ''
                );
            } else if (options.includeAcademic) {
                row.push('', '', '');
            }

            if (options.includeFinancial) {
                row.push(
                    profile.schoolFees?.totalAmount?.toString() || '0',
                    (profile.schoolFees?.totalAmount || 0).toString(),
                    '0'
                );
            }

            if (options.includeAttendance) {
                const presentDays = profile.attendanceRecords.filter(r => r.status === 'حاضر').length;
                const absentDays = profile.attendanceRecords.filter(r => r.status === 'غائب').length;
                const total = profile.attendanceRecords.length;
                const rate = total > 0 ? ((presentDays / total) * 100).toFixed(2) : '0';

                row.push(
                    presentDays.toString(),
                    absentDays.toString(),
                    rate
                );
            }

            if (options.includeBehavioral) {
                row.push(
                    profile.behavioralData.conductRating,
                    profile.behavioralData.counselorNotes
                );
            }

            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        return csv;
    };

    // استيراد بيانات الطلاب
    const importStudentData = async (file: File): Promise<ImportResult> => {
        try {
            setImporting(true);
            setProgress(0);

            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'json') {
                return await importFromJSON(file);
            } else if (fileExtension === 'csv') {
                return await importFromCSV(file);
            } else {
                throw new Error('صيغة الملف غير مدعومة. استخدم CSV أو JSON');
            }
        } catch (err) {
            console.error('خطأ في استيراد البيانات:', err);
            throw err;
        } finally {
            setImporting(false);
            setProgress(100);
        }
    };

    const importFromJSON = async (file: File): Promise<ImportResult> => {
        const text = await file.text();
        const data = JSON.parse(text);

        let successful = 0;
        let failed = 0;
        const errors: { row: number; error: string }[] = [];

        const totalRecords = data.length;

        for (let i = 0; i < totalRecords; i++) {
            try {
                const record = data[i];

                // إدراج/تحديث الطالب
                if (record.personalData) {
                    const { error } = await supabase
                        .from('students')
                        .upsert({
                            student_id: record.studentId,
                            full_name_ar: record.personalData.fullNameAr,
                            national_id: record.personalData.nationalId,
                            date_of_birth: record.personalData.dateOfBirth,
                            gender: record.personalData.gender,
                        });

                    if (error) throw error;
                }

                // استيراد البيانات الأكاديمية
                if (record.academicRecords && record.academicRecords.length > 0) {
                    for (const academic of record.academicRecords) {
                        const { error } = await supabase
                            .from('academic_records')
                            .upsert({
                                student_id: record.studentId,
                                current_gpa: academic.currentGPA,
                                average_marks: academic.averageMarks,
                                passing_status: academic.passingStatus,
                            });

                        if (error) throw error;
                    }
                }

                // استيراد بيانات الحضور
                if (record.attendanceRecords && record.attendanceRecords.length > 0) {
                    for (const attendance of record.attendanceRecords) {
                        const { error } = await supabase
                            .from('attendance_records')
                            .insert({
                                student_id: record.studentId,
                                date: attendance.date,
                                status: attendance.status,
                                notes: attendance.notes,
                            });

                        if (error) throw error;
                    }
                }

                successful++;
                setProgress(Math.round(((i + 1) / totalRecords) * 100));
            } catch (err) {
                failed++;
                errors.push({
                    row: i + 1,
                    error: err instanceof Error ? err.message : 'خطأ غير معروف',
                });
            }
        }

        return { successful, failed, errors };
    };

    const importFromCSV = async (file: File): Promise<ImportResult> => {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        let successful = 0;
        let failed = 0;
        const errors: { row: number; error: string }[] = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                if (!lines[i].trim()) continue;

                const cells = lines[i].split(',');
                const record: Record<string, any> = {};

                headers.forEach((header, index) => {
                    record[header.trim()] = cells[index]?.trim();
                });

                // إدراج/تحديث الطالب
                const { error } = await supabase
                    .from('students')
                    .upsert({
                        student_id: record['معرف الطالب'],
                        full_name_ar: record['الاسم'],
                        stage: record['المرحلة'],
                        class: record['الفصل'],
                    });

                if (error) throw error;

                successful++;
                setProgress(Math.round((i / lines.length) * 100));
            } catch (err) {
                failed++;
                errors.push({
                    row: i + 1,
                    error: err instanceof Error ? err.message : 'خطأ غير معروف',
                });
            }
        }

        return { successful, failed, errors };
    };

    // تنزيل الملف
    const downloadFile = (content: string | Blob, filename: string) => {
        const url = content instanceof Blob
            ? URL.createObjectURL(content)
            : URL.createObjectURL(new Blob([content], { type: 'text/plain' }));

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return {
        exporting,
        importing,
        progress,
        exportStudentData,
        importStudentData,
        downloadFile,
    };
}