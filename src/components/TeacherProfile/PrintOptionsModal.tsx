import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Printer,
    FileText,
    Banknote,
    Calendar,
    Award,
    Download,
    CheckCircle
} from 'lucide-react';
import { TeacherProfile } from '@/types/teacher';
import { toast } from 'sonner';

interface PrintOptionsModalProps {
    teacherProfile: TeacherProfile;
    trigger?: React.ReactNode;
}

export function PrintOptionsModal({ teacherProfile, trigger }: PrintOptionsModalProps) {
    const [open, setOpen] = useState(false);
    const [printing, setPrinting] = useState<string | null>(null);

    const printOptions = [
        {
            id: 'contract',
            label: 'عقد العمل',
            description: 'طباعة نسخة من عقد العمل الرسمي',
            icon: <FileText className="h-8 w-8 text-blue-600" />,
            color: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400'
        },
        {
            id: 'salary_slip',
            label: 'كشف الراتب',
            description: 'طباعة كشف الراتب الشهري',
            icon: <Banknote className="h-8 w-8 text-green-600" />,
            color: 'from-green-50 to-green-100 border-green-200 hover:border-green-400'
        },
        {
            id: 'leave_request',
            label: 'نموذج طلب إجازة',
            description: 'طباعة نموذج طلب إجازة فارغ',
            icon: <Calendar className="h-8 w-8 text-purple-600" />,
            color: 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400'
        },
        {
            id: 'experience_certificate',
            label: 'شهادة الخبرة',
            description: 'طباعة شهادة خبرة رسمية',
            icon: <Award className="h-8 w-8 text-orange-600" />,
            color: 'from-orange-50 to-orange-100 border-orange-200 hover:border-orange-400'
        },
        {
            id: 'comprehensive_report',
            label: 'تقرير شامل',
            description: 'طباعة جميع بيانات المعلم',
            icon: <Download className="h-8 w-8 text-indigo-600" />,
            color: 'from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-400'
        },
    ];

    const handlePrint = async (optionId: string) => {
        setPrinting(optionId);

        // محاكاة الطباعة
        await new Promise(resolve => setTimeout(resolve, 1000));

        // إنشاء صفحة الطباعة
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('فشل في فتح نافذة الطباعة');
            setPrinting(null);
            return;
        }

        const content = generatePrintContent(optionId, teacherProfile);

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            setPrinting(null);
            toast.success('تم فتح نافذة الطباعة');
        }, 500);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        طباعة
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Printer className="h-6 w-6 text-blue-600" />
                        خيارات الطباعة
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {printOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handlePrint(option.id)}
                            disabled={printing !== null}
                            className={`p-4 rounded-xl border-2 text-right transition-all duration-200 bg-gradient-to-br ${option.color} ${printing === option.id ? 'ring-2 ring-blue-500' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/50">
                                    {printing === option.id ? (
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                                    ) : (
                                        option.icon
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{option.label}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        جميع النماذج تحتوي على بيانات المعلم الحالية
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function generatePrintContent(type: string, profile: TeacherProfile): string {
    const commonStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Cairo', sans-serif; 
        direction: rtl; 
        padding: 40px;
        line-height: 1.6;
      }
      .header { 
        text-align: center; 
        border-bottom: 3px solid #1e3a8a; 
        padding-bottom: 20px; 
        margin-bottom: 30px;
      }
      .header h1 { color: #1e3a8a; font-size: 24px; }
      .header p { color: #6b7280; }
      .section { margin-bottom: 25px; }
      .section-title { 
        font-weight: 700; 
        color: #1e3a8a; 
        border-bottom: 2px solid #e5e7eb; 
        padding-bottom: 10px; 
        margin-bottom: 15px;
      }
      .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .info-item { display: flex; justify-content: space-between; border-bottom: 1px dotted #d1d5db; padding: 8px 0; }
      .label { color: #6b7280; }
      .value { font-weight: 600; color: #111827; }
      .footer { 
        margin-top: 50px; 
        display: flex; 
        justify-content: space-between; 
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      .signature-box { text-align: center; }
      .signature-line { border-bottom: 1px solid #000; width: 150px; margin: 30px auto 5px; }
      @media print {
        body { padding: 20px; }
        @page { margin: 1cm; }
      }
    </style>
  `;

    const header = `
    <div class="header">
      <h1>🏫 مدارس المستقبل الدولية</h1>
      <p>نظام إدارة الموارد البشرية</p>
    </div>
  `;

    switch (type) {
        case 'contract':
            return `
        <!DOCTYPE html>
        <html lang="ar">
        <head><meta charset="UTF-8">${commonStyles}</head>
        <body>
          ${header}
          <h2 style="text-align: center; margin-bottom: 30px;">عقد عمل</h2>
          
          <div class="section">
            <h3 class="section-title">بيانات الموظف</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">الاسم:</span><span class="value">${profile.personalData.fullNameAr}</span></div>
              <div class="info-item"><span class="label">الرقم القومي:</span><span class="value">${profile.personalData.nationalId}</span></div>
              <div class="info-item"><span class="label">المسمى الوظيفي:</span><span class="value">${profile.employmentData.jobTitle}</span></div>
              <div class="info-item"><span class="label">التخصص:</span><span class="value">${profile.employmentData.specialization}</span></div>
              <div class="info-item"><span class="label">تاريخ التعيين:</span><span class="value">${profile.employmentData.hireDate}</span></div>
              <div class="info-item"><span class="label">نوع العقد:</span><span class="value">${profile.employmentData.contractType}</span></div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">البنود والشروط</h3>
            <p style="line-height: 2;">
              بموجب هذا العقد، يلتزم الطرف الثاني بالعمل لدى الطرف الأول وفقاً للشروط والأحكام المنصوص عليها في لائحة العمل الداخلية...
            </p>
          </div>
          
          <div class="footer">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>الطرف الأول (الإدارة)</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>الطرف الثاني (الموظف)</p>
            </div>
          </div>
          
          <p style="text-align: center; margin-top: 30px; color: #6b7280;">
            تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}
          </p>
        </body>
        </html>
      `;

        case 'salary_slip':
            return `
        <!DOCTYPE html>
        <html lang="ar">
        <head><meta charset="UTF-8">${commonStyles}</head>
        <body>
          ${header}
          <h2 style="text-align: center; margin-bottom: 30px;">كشف الراتب الشهري</h2>
          
          <div class="section">
            <div class="info-grid">
              <div class="info-item"><span class="label">الاسم:</span><span class="value">${profile.personalData.fullNameAr}</span></div>
              <div class="info-item"><span class="label">الرقم الوظيفي:</span><span class="value">${profile.employmentData.employeeNumber}</span></div>
              <div class="info-item"><span class="label">القسم:</span><span class="value">${profile.employmentData.department || '-'}</span></div>
              <div class="info-item"><span class="label">الشهر:</span><span class="value">${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</span></div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">تفاصيل الراتب</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #d1d5db;">البند</th>
                <th style="padding: 10px; border: 1px solid #d1d5db;">المبلغ</th>
              </tr>
              <tr><td style="padding: 10px; border: 1px solid #d1d5db;">الراتب الأساسي</td><td style="padding: 10px; border: 1px solid #d1d5db;">${profile.currentSalary?.baseSalary || 0} ج</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d1d5db;">بدل السكن</td><td style="padding: 10px; border: 1px solid #d1d5db;">${profile.currentSalary?.housingAllowance || 0} ج</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #d1d5db;">بدل المواصلات</td><td style="padding: 10px; border: 1px solid #d1d5db;">${profile.currentSalary?.transportationAllowance || 0} ج</td></tr>
              <tr style="background: #dcfce7;"><td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">إجمالي البدلات</td><td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">${profile.currentSalary?.totalAllowances || 0} ج</td></tr>
              <tr style="background: #fee2e2;"><td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">إجمالي الاستقطاعات</td><td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">${profile.currentSalary?.totalDeductions || 0} ج</td></tr>
              <tr style="background: #1e3a8a; color: white;"><td style="padding: 10px; border: 1px solid #1e3a8a; font-weight: bold;">الراتب الصافي</td><td style="padding: 10px; border: 1px solid #1e3a8a; font-weight: bold;">${profile.currentSalary?.netSalary || 0} ج</td></tr>
            </table>
          </div>
          
          <div class="footer">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>توقيع الموظف</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>توقيع الحسابات</p>
            </div>
          </div>
        </body>
        </html>
      `;

        case 'experience_certificate':
            return `
        <!DOCTYPE html>
        <html lang="ar">
        <head><meta charset="UTF-8">${commonStyles}</head>
        <body>
          ${header}
          <h2 style="text-align: center; margin-bottom: 30px;">شهادة خبرة</h2>
          
          <div style="padding: 20px; line-height: 2.5; font-size: 16px;">
            <p>نشهد نحن إدارة مدارس المستقبل الدولية بأن السيد / السيدة:</p>
            <p style="text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0;">${profile.personalData.fullNameAr}</p>
            <p>حامل الرقم القومي: <strong>${profile.personalData.nationalId}</strong></p>
            <p>قد عمل/ت لدينا بوظيفة: <strong>${profile.employmentData.jobTitle}</strong></p>
            <p>في تخصص: <strong>${profile.employmentData.specialization}</strong></p>
            <p>منذ تاريخ: <strong>${profile.employmentData.hireDate}</strong></p>
            <p style="margin-top: 20px;">وقد أثبت/ت كفاءة عالية في العمل، والتزاماً تاماً بأخلاقيات المهنة.</p>
            <p style="margin-top: 20px;">أُعطيت هذه الشهادة بناءً على طلبه/ها، دون أي مسؤولية على المدرسة.</p>
          </div>
          
          <div class="footer">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>مدير الموارد البشرية</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>ختم المدرسة</p>
            </div>
          </div>
          
          <p style="text-align: center; margin-top: 30px; color: #6b7280;">
            تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}
          </p>
        </body>
        </html>
      `;

        default:
            return `
        <!DOCTYPE html>
        <html lang="ar">
        <head><meta charset="UTF-8">${commonStyles}</head>
        <body>
          ${header}
          <h2 style="text-align: center; margin-bottom: 30px;">تقرير شامل - ${profile.personalData.fullNameAr}</h2>
          
          <div class="section">
            <h3 class="section-title">البيانات الشخصية</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">الاسم:</span><span class="value">${profile.personalData.fullNameAr}</span></div>
              <div class="info-item"><span class="label">الهاتف:</span><span class="value">${profile.personalData.phone}</span></div>
              <div class="info-item"><span class="label">البريد:</span><span class="value">${profile.personalData.email || '-'}</span></div>
              <div class="info-item"><span class="label">العنوان:</span><span class="value">${profile.personalData.address}</span></div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">البيانات الوظيفية</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">الرقم الوظيفي:</span><span class="value">${profile.employmentData.employeeNumber}</span></div>
              <div class="info-item"><span class="label">المسمى:</span><span class="value">${profile.employmentData.jobTitle}</span></div>
              <div class="info-item"><span class="label">التخصص:</span><span class="value">${profile.employmentData.specialization}</span></div>
              <div class="info-item"><span class="label">تاريخ التعيين:</span><span class="value">${profile.employmentData.hireDate}</span></div>
            </div>
          </div>
          
          <p style="text-align: center; margin-top: 50px; color: #6b7280;">
            تم إنشاء هذا التقرير بتاريخ: ${new Date().toLocaleDateString('ar-EG')}
          </p>
        </body>
        </html>
      `;
    }
}
