/**
 * دوال مساعدة عامة للتطبيق
 */

// تنسيق التاريخ
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'تاريخ غير صحيح';
    }

    if (format === 'short') {
        return dateObj.toLocaleDateString('ar-EG');
    }

    return dateObj.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// تنسيق الوقت
export function formatTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'وقت غير صحيح';
    }

    return dateObj.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

// تنسيق التاريخ والوقت
export function formatDateTime(date: string | Date): string {
    return `${formatDate(date)} ${formatTime(date)}`;
}

// حساب العمر من تاريخ الميلاد
export function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

// تنسيق المبالغ المالية
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

// تنسيق النسبة المئوية
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

// حساب نسبة الحضور
export function calculateAttendanceRate(presentDays: number, totalDays: number): number {
    if (totalDays === 0) return 0;
    return (presentDays / totalDays) * 100;
}

// تقييم الأداء الأكاديمي
export function evaluateAcademicPerformance(gpa: number): string {
    if (gpa >= 3.7) return 'ممتاز';
    if (gpa >= 3.3) return 'جيد جداً';
    if (gpa >= 2.7) return 'جيد';
    if (gpa >= 2.0) return 'مقبول';
    return 'ضعيف';
}

// الحصول على لون حالة الحضور
export function getAttendanceStatusColor(status: string): string {
    switch (status) {
        case 'حاضر':
            return 'bg-green-100 text-green-800';
        case 'غائب':
            return 'bg-red-100 text-red-800';
        case 'متأخر':
            return 'bg-yellow-100 text-yellow-800';
        case 'معذور':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// الحصول على لون التقييم السلوكي
export function getConductRatingColor(rating: string): string {
    switch (rating) {
        case 'ممتاز':
            return 'bg-green-100 text-green-800';
        case 'جيد جداً':
            return 'bg-blue-100 text-blue-800';
        case 'جيد':
            return 'bg-cyan-100 text-cyan-800';
        case 'مقبول':
            return 'bg-yellow-100 text-yellow-800';
        case 'ضعيف':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// الحصول على لون حالة الملف
export function getFileStatusColor(status: string): string {
    switch (status) {
        case 'نشط':
            return 'bg-green-100 text-green-800';
        case 'مُيقف':
            return 'bg-yellow-100 text-yellow-800';
        case 'متقاعد':
            return 'bg-gray-100 text-gray-800';
        case 'محذوف':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// التحقق من صيغة البريد الإلكتروني
export function isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// التحقق من صيغة رقم الهاتف
export function isValidPhone(phone: string): boolean {
    const phonePattern = /^[0-9]{10,15}$/;
    return phonePattern.test(phone);
}

// التحقق من صيغة الرقم القومي
export function isValidNationalId(id: string): boolean {
    return /^[0-9]{14,15}$/.test(id);
}

// تنسيق الرقم القومي (إخفاء جزء منه)
export function maskNationalId(id: string): string {
    if (id.length < 6) return id;
    return id.substring(0, 3) + '***' + id.substring(id.length - 3);
}

// مقارنة تاريخين
export function getDateDifference(date1: Date | string, date2: Date | string): {
    days: number;
    months: number;
    years: number;
} {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    let days = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    let months = Math.floor(days / 30);
    let years = Math.floor(months / 12);

    return {
        days: days % 30,
        months: months % 12,
        years,
    };
}

// تحويل النص إلى عنوان
export function toTitleCase(text: string): string {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// تكرار عنصر في مصفوفة
export function arrayToMap<T extends { id: string }>(arr: T[]): Map<string, T> {
    return new Map(arr.map(item => [item.id, item]));
}

// فرز مصفوفة من الكائنات
export function sortBy<T>(arr: T[], key: keyof T, ascending = true): T[] {
    return [...arr].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        if (aValue < bValue) return ascending ? -1 : 1;
        if (aValue > bValue) return ascending ? 1 : -1;
        return 0;
    });
}

// تجميع مصفوفة من الكائنات
export function groupBy<T>(arr: T[], key: keyof T): Map<any, T[]> {
    return arr.reduce((acc, item) => {
        const groupKey = item[key];
        if (!acc.has(groupKey)) {
            acc.set(groupKey, []);
        }
        acc.get(groupKey)!.push(item);
        return acc;
    }, new Map<any, T[]>());
}

// دمج مصفوفتين من الكائنات
export function mergeArrays<T extends { id: string }>(arr1: T[], arr2: T[]): T[] {
    const map = new Map<string, T>();

    arr1.forEach(item => map.set(item.id, item));
    arr2.forEach(item => map.set(item.id, item));

    return Array.from(map.values());
}

// تحويل CSV إلى مصفوفة
export function parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: Record<string, string> = {};

            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });

            return obj;
        });
}

// تحويل مصفوفة إلى CSV
export function arrayToCSV<T>(data: T[], headers?: (keyof T)[]): string {
    if (data.length === 0) return '';

    const keys = headers || (Object.keys(data[0]) as (keyof T)[]);
    const csvHeaders = keys.join(',');

    const csvRows = data.map(item =>
        keys.map(key => {
            const value = item[key];
            const stringValue = String(value || '');
            return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
}

// التحقق من قيم المتطلب
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

// دالة التأخير (Debounce)
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// دالة الحد من معدل الاستدعاء (Throttle)
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let lastRun = 0;

    return function (...args: Parameters<T>) {
        const now = Date.now();
        if (now - lastRun >= limit) {
            func(...args);
            lastRun = now;
        }
    };
}

// توليد معرف عشوائي
export function generateId(prefix = ''): string {
    return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
}

// نسخ النص إلى الحافظة
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('خطأ في نسخ النص:', err);
        return false;
    }
}

// تحميل ملف
export function downloadFile(content: string | Blob, filename: string): void {
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
}

// قراءة ملف
export function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// الحصول على التاريخ والوقت المصري الحالي
export function getEgyptianDate(): Date {
    // التوقيت المصري هو EET (Eastern European Time) - Africa/Cairo
    const now = new Date();
    const egyptTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(now);

    // تحويل النص إلى كائن Date
    const [datePart, timePart] = egyptTime.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');

    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
}

// الحصول على تاريخ اليوم المصري بتنسيق YYYY-MM-DD
export function getEgyptianDateString(): string {
    const egyptDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    return egyptDate; // يعطي YYYY-MM-DD
}

// الحصول على الوقت المصري الحالي بتنسيق HH:MM
export function getEgyptianTimeString(): string {
    const egyptTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());

    return egyptTime;
}

// الحصول على الشهر المصري الحالي بتنسيق YYYY-MM
export function getEgyptianMonthString(): string {
    const egyptDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit'
    }).format(new Date());

    return egyptDate;
}