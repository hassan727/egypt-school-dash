import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wallet, Calendar, Receipt, Coins } from 'lucide-react';

interface FinancialTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  payment_method: string;
  transaction_date: string;
  receipt_number: string;
  created_by: string;
  created_at: string;
}

interface FeeInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string;
}

const FinancialHistory = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [installments, setInstallments] = useState<FeeInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    if (!studentId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Get student name
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('full_name_ar')
          .eq('student_id', studentId)
          .single();

        if (studentData && !studentError) {
          setStudentName(studentData.full_name_ar);
        }

        // Get financial transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('student_id', studentId)
          .order('transaction_date', { ascending: false });

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);

        // Get fee installments
        const { data: feesData, error: feesError } = await supabase
          .from('school_fees')
          .select('id')
          .eq('student_id', studentId)
          .single();

        if (feesData && !feesError) {
          const { data: installmentsData, error: installmentsError } = await supabase
            .from('fee_installments')
            .select('*')
            .eq('fee_id', feesData.id)
            .order('installment_number', { ascending: true });

          if (!installmentsError) {
            setInstallments(installmentsData || []);
          }
        }
      } catch (err) {
        console.error('Error fetching financial history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  const formatTransactionType = (type: string) => {
    const types: Record<string, string> = {
      'Payment': 'دفع',
      'Refund': 'استرداد',
      'Adjustment': 'تعديل'
    };
    return types[type] || type;
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      'Cash': 'نقداً',
      'Bank Transfer': 'تحويل بنكي',
      'Credit Card': 'بطاقة ائتمان',
      'Check': 'شيك'
    };
    return methods[method] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  if (!studentId) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p className="text-red-500">لم يتم تحديد معرّف الطالب</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wallet className="h-8 w-8 text-green-600" />
                السجلات المالية
              </h1>
              {studentName && (
                <p className="text-gray-600 mt-1">
                  الطالب: <span className="font-semibold">{studentName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <p className="text-gray-500">جاري تحميل السجلات...</p>
          </div>
        )}

        {/* No Records */}
        {!loading && transactions.length === 0 && installments.length === 0 && (
          <Card className="p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات مالية</h3>
            <p className="text-gray-500">لم يتم تسجيل أي معاملات مالية لهذا الطالب</p>
          </Card>
        )}

        {/* Installments Section */}
        {!loading && installments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5" />
              أقساط المصروفات الدراسية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installments.map((installment) => (
                <Card key={installment.id} className={`p-4 border ${installment.paid ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">القسط #{installment.installment_number}</h3>
                      <p className="text-sm text-gray-500">{formatCurrency(installment.amount)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${installment.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {installment.paid ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>تاريخ الاستحقاق: {formatDate(installment.due_date)}</div>
                    {installment.paid && installment.paid_date && (
                      <div>تاريخ الدفع: {formatDate(installment.paid_date)}</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {!loading && transactions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              المعاملات المالية
            </h2>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${transaction.transaction_type === 'Payment' ? 'bg-green-100' : transaction.transaction_type === 'Refund' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Wallet className={`h-5 w-5 ${transaction.transaction_type === 'Payment' ? 'text-green-600' : transaction.transaction_type === 'Refund' ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formatTransactionType(transaction.transaction_type)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.transaction_date)} • بواسطة {transaction.created_by}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${transaction.transaction_type === 'Payment' ? 'text-green-600' : transaction.transaction_type === 'Refund' ? 'text-red-600' : 'text-blue-600'}`}>
                      {transaction.transaction_type === 'Refund' ? '-' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {transaction.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">الوصف:</h4>
                        <p className="text-gray-700">{transaction.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">طريقة الدفع:</span>
                        <span className="text-gray-900 mr-2">{formatPaymentMethod(transaction.payment_method)}</span>
                      </div>
                      {transaction.receipt_number && (
                        <div>
                          <span className="text-gray-500">رقم الإيصال:</span>
                          <span className="text-gray-900 mr-2">{transaction.receipt_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      تاريخ التسجيل: {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FinancialHistory;