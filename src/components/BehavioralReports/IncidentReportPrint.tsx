import { useEffect } from 'react';
import { 
    createFilledFormContent, 
    createBlankFormContent, 
    openPrintWindow,
    PrintHeaderData 
} from '@/utils/printUtils';

interface FormData {
    incident_date: string;
    incident_time: string;
    incident_location: string;
    incident_description: string;
    witness_names: string;
    reporter_name: string;
    reporter_role: string;
    severity_level: string;
    incident_type: string;
    behavioral_evidence: string;
    actions_taken: string;
}

interface IncidentReportPrintProps {
    data: FormData;
    headerData: PrintHeaderData;
    blank?: boolean;
    onClose?: () => void;
}

export function IncidentReportPrint({
    data,
    headerData,
    blank = false,
    onClose
}: IncidentReportPrintProps) {
    useEffect(() => {
        let htmlContent = '';

        if (blank) {
            const blankFields = [
                { label: 'تاريخ الواقعة' },
                { label: 'وقت الواقعة' },
                { label: 'مكان الواقعة' },
                { label: 'مستوى الخطورة' },
                { label: 'نوع المخالفة' },
                { label: 'وصف تفصيلي للواقعة', fullWidth: true },
                { label: 'أسماء الشهود', fullWidth: true },
                { label: 'اسم المراقب/المراقبة' },
                { label: 'دور المراقب' },
                { label: 'الأدلة السلوكية', fullWidth: true },
                { label: 'الإجراءات المتخذة فوراً', fullWidth: true },
            ];

            htmlContent = createBlankFormContent(
                'تقرير واقعة',
                blankFields,
                headerData
            );
        } else {
            const filledSections = [
                {
                    title: 'معلومات الواقعة',
                    fields: [
                        { label: 'تاريخ الواقعة', value: data.incident_date },
                        { label: 'وقت الواقعة', value: data.incident_time },
                        { label: 'مكان الواقعة', value: data.incident_location },
                        { label: 'نوع المخالفة', value: data.incident_type },
                        { label: 'مستوى الخطورة', value: data.severity_level },
                    ]
                },
                {
                    title: 'التفاصيل',
                    fields: [
                        { label: 'وصف تفصيلي للواقعة', value: data.incident_description, fullWidth: true },
                        { label: 'أسماء الشهود', value: data.witness_names, fullWidth: true },
                        { label: 'الأدلة السلوكية', value: data.behavioral_evidence, fullWidth: true },
                    ]
                },
                {
                    title: 'المسؤول',
                    fields: [
                        { label: 'اسم المراقب/المراقبة', value: data.reporter_name },
                        { label: 'دور المراقب', value: data.reporter_role },
                    ]
                },
                {
                    title: 'الإجراءات',
                    fields: [
                        { label: 'الإجراءات المتخذة فوراً', value: data.actions_taken, fullWidth: true },
                    ]
                }
            ];

            htmlContent = createFilledFormContent(
                'تقرير واقعة',
                filledSections,
                headerData
            );
        }

        openPrintWindow(htmlContent, `تقرير واقعة - ${headerData.studentName}`);
        onClose?.();
    }, [data, headerData, blank, onClose]);

    return null;
}
