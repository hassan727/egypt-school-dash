'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HelpGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 left-4 gap-2 bg-transparent"
        >
          <HelpCircle className="h-4 w-4" />
          دليل الاستخدام
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>دليل استخدام نظام رصد الدرجات</DialogTitle>
          <DialogDescription>
            معلومات شاملة عن كيفية استخدام النظام
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">البدء السريع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>1. اختر المرحلة:</strong> ابدأ باختيار المرحلة التعليمية (ابتدائي، إعدادي، ثانوي)
              </p>
              <p>
                <strong>2. اختر الفصل:</strong> ثم اختر الفصل التابع للمرحلة المختارة
              </p>
              <p>
                <strong>3. اختر المادة:</strong> حدد المادة الدراسية المراد إدخال درجاتها
              </p>
              <p>
                <strong>4. اختر الأسبوع:</strong> اختر الأسبوع الدراسي لإدخال البيانات
              </p>
              <p>
                <strong>5. أدخل الدرجات:</strong> انقر على الخلايا وأدخل درجات الطلاب
              </p>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اختصارات لوحة المفاتيح</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-2">
                      <kbd className="bg-muted px-2 py-1 rounded text-xs">Tab</kbd>
                    </td>
                    <td className="py-2 px-2">الانتقال إلى الخلية التالية (يميناً)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">
                      <kbd className="bg-muted px-2 py-1 rounded text-xs">Shift+Tab</kbd>
                    </td>
                    <td className="py-2 px-2">الانتقال إلى الخلية السابقة (يساراً)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">
                      <kbd className="bg-muted px-2 py-1 rounded text-xs">↑/↓</kbd>
                    </td>
                    <td className="py-2 px-2">الانتقال أعلى أو أسفل</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">
                      <kbd className="bg-muted px-2 py-1 rounded text-xs">Enter</kbd>
                    </td>
                    <td className="py-2 px-2">حفظ الدرجة والانتقال للأسفل</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">
                      <kbd className="bg-muted px-2 py-1 rounded text-xs">Esc</kbd>
                    </td>
                    <td className="py-2 px-2">إلغاء التعديل</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">
                      <kbd className="bg-muted px-2 py-1 rounded text-xs">Del</kbd>
                    </td>
                    <td className="py-2 px-2">حذف الدرجة</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Data Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">التحقق من صحة البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>الألوان المستخدمة:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <span className="inline-block w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></span>
                  أخضر: درجة صحيحة وتم حفظها
                </li>
                <li>
                  <span className="inline-block w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2"></span>
                  أزرق: الخلية قيد التعديل
                </li>
                <li>
                  <span className="inline-block w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></span>
                  أحمر: درجة خاطئة (تتجاوز الحد الأقصى)
                </li>
              </ul>
              <p className="mt-4">
                <strong>قواعد الإدخال:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>يجب أن تكون الدرجة رقمية</li>
                <li>الدرجة لا يمكن أن تكون سالبة</li>
                <li>الدرجة لا تزيد عن الحد الأقصى للفئة</li>
              </ul>
            </CardContent>
          </Card>

          {/* Export Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تصدير البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>تصدير الدرجات:</strong> يصدر درجات الطلاب لأسبوع معين بصيغة CSV يمكن فتحها في Excel
              </p>
              <p>
                <strong>تصدير المتوسطات:</strong> يصدر متوسطات الفئات والمتوسط الكلي لكل طالب بصيغة CSV
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                ملاحظة: يتم إضافة BOM للملف لدعم الأحرف العربية بشكل صحيح في Excel
              </p>
            </CardContent>
          </Card>

          {/* Calculation Formula */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">صيغة الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>متوسط الفئة:</strong> مجموع درجات الفئة ÷ عدد الأسابيع
              </p>
              <p>
                <strong>المتوسط الكلي:</strong> يتم حساب المتوسط الكلي بناءً على وزن كل فئة من الدرجات الكلية
              </p>
              <div className="bg-muted p-2 rounded text-xs mt-2 font-mono">
                المتوسط الكلي = مجموع(متوسط الفئة × وزن الفئة) / إجمالي الأوزان
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">نصائح مهمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  تأكد من حفظ البيانات بعد إدخال الدرجات باستخدام زر "حفظ البيانات"
                </li>
                <li>
                  يمكنك عرض الإحصائيات والرسوم البيانية بعد إدخال البيانات
                </li>
                <li>
                  استخدم الاختصارات لتسريع عملية الإدخال
                </li>
                <li>
                  يتم حساب المتوسطات تلقائياً بعد حفظ البيانات
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
