/**
 * أنواع البيانات للنظام المالي الشامل
 * Types for the Comprehensive Financial System
 */

// =============================================
// تصنيفات الإيرادات والمصروفات
// =============================================

export interface RevenueCategory {
    id: string;
    categoryCode: string;
    categoryNameAr: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface ExpenseCategory {
    id: string;
    categoryCode: string;
    categoryNameAr: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
}

// =============================================
// الموظفين
// =============================================

export type EmployeeType = 'معلم' | 'إداري' | 'عامل';
export type ContractType = 'دائم' | 'مؤقت' | 'جزئي';

export interface Employee {
    id: string;
    employeeId: string;
    fullName: string;
    nationalId?: string;
    employeeType: EmployeeType;
    position?: string;
    department?: string;
    phone?: string;
    email?: string;
    address?: string;
    hireDate?: string;
    contractType: ContractType;
    baseSalary: number;
    bankAccount?: string;
    bankName?: string;
    isActive: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

// =============================================
// الرواتب
// =============================================

export type SalaryStatus = 'مستحق' | 'تم الصرف';

export interface Salary {
    id: string;
    employeeId: string;
    employee?: Employee; // للعرض
    academicYearCode: string;
    month: string; // YYYY-MM
    baseSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    status: SalaryStatus;
    paymentDate?: string;
    paymentMethod?: string;
    notes?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    items?: SalaryItem[];
}

export type SalaryItemType = 'بدل' | 'خصم';

export interface SalaryItem {
    id?: string;
    salaryId?: string;
    itemType: SalaryItemType;
    itemName: string;
    amount: number;
    notes?: string;
    createdAt?: string;
}

// =============================================
// السلف
// =============================================

export type LoanStatus = 'نشط' | 'مسدد';

export interface EmployeeLoan {
    id: string;
    employeeId: string;
    employee?: Employee;
    loanDate: string;
    totalAmount: number;
    monthlyDeduction: number;
    remainingAmount: number;
    status: LoanStatus;
    reason?: string;
    notes?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

// =============================================
// الحركات المالية العامة
// =============================================

export type TransactionType = 'إيراد' | 'مصروف';
export type ReferenceType = 'student_payment' | 'salary' | 'general' | 'refund';

export interface GeneralTransaction {
    id: string;
    academicYearCode: string;
    transactionDate: string;
    transactionType: TransactionType;
    categoryId?: string;
    categoryType?: 'revenue' | 'expense';
    categoryName?: string; // للعرض
    amount: number;
    description?: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    paymentMethod?: string;
    receiptNumber?: string;
    notes?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

// =============================================
// ملخصات مالية للوحة التحكم
// =============================================

export interface FinancialSummary {
    totalRevenue: number;
    totalExpenses: number;
    netBalance: number;
    studentPayments: number;
    totalSalaries: number;
    pendingSalaries: number;
    collectionRate: number;
    overdueStudents: number;
    revenueByCategory: CategorySummary[];
    expensesByCategory: CategorySummary[];
    monthlyTrend: MonthlyTrend[];
}

export interface CategorySummary {
    categoryCode: string;
    categoryName: string;
    amount: number;
    percentage: number;
}

export interface MonthlyTrend {
    month: string;
    revenue: number;
    expenses: number;
    net: number;
}

// =============================================
// فلاتر البحث
// =============================================

export interface FinanceFilters {
    academicYear?: string;
    startDate?: string;
    endDate?: string;
    transactionType?: TransactionType;
    categoryId?: string;
    employeeType?: EmployeeType;
    salaryStatus?: SalaryStatus;
}

// =============================================
// DTOs للإنشاء والتحديث
// =============================================

export interface CreateEmployeeDTO {
    fullName: string;
    nationalId?: string;
    employeeType: EmployeeType;
    position?: string;
    department?: string;
    phone?: string;
    email?: string;
    hireDate?: string;
    contractType?: ContractType;
    baseSalary: number;
}

export interface CreateSalaryDTO {
    employeeId: string;
    month: string;
    baseSalary: number;
    items?: SalaryItem[];
}

export interface CreateTransactionDTO {
    transactionDate: string;
    transactionType: TransactionType;
    categoryId?: string;
    amount: number;
    description?: string;
    paymentMethod?: string;
    receiptNumber?: string;
    notes?: string;
}

export interface PaySalaryDTO {
    salaryId: string;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
}
