// سكريبت تحليل شامل للبيانات المالية
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function analyzeFinance() {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 تحليل شامل للبيانات المالية');
    console.log('═'.repeat(70));

    // 1. school_fees
    const { data: fees } = await supabase.from('school_fees').select('*');
    console.log('\n📋 school_fees:', fees?.length || 0);
    let totalFees = 0, totalAdvance = 0;
    fees?.forEach(f => {
        console.log(`   ${f.student_id}: المبلغ=${f.total_amount}, مقدمة=${f.advance_payment}`);
        totalFees += f.total_amount || 0;
        totalAdvance += f.advance_payment || 0;
    });

    // 2. financial_transactions
    const { data: trans } = await supabase.from('financial_transactions').select('*');
    console.log('\n📋 financial_transactions:', trans?.length || 0);
    let payments = 0, discounts = 0, refunds = 0;
    trans?.forEach(t => {
        console.log(`   ${t.transaction_type}: ${t.amount} (${t.description})`);
        if (t.transaction_type === 'دفعة') payments += t.amount || 0;
        if (t.transaction_type === 'خصم') discounts += t.amount || 0;
        if (t.transaction_type === 'استرجاع') refunds += t.amount || 0;
    });

    // 3. general_transactions
    const { data: general } = await supabase.from('general_transactions').select('*');
    console.log('\n📋 general_transactions:', general?.length || 0);
    let genRevenue = 0, genExpense = 0;
    general?.forEach(g => {
        console.log(`   ${g.transaction_type}: ${g.amount} (${g.description})`);
        if (g.transaction_type === 'إيراد') genRevenue += g.amount || 0;
        if (g.transaction_type === 'مصروف') genExpense += g.amount || 0;
    });

    // 4. salaries
    const { data: salaries } = await supabase.from('salaries').select('*');
    console.log('\n📋 salaries:', salaries?.length || 0);
    let paidSalaries = 0, pendingSalaries = 0;
    salaries?.forEach(s => {
        console.log(`   ${s.employee_id}: ${s.net_salary} (${s.status})`);
        if (s.status === 'تم الصرف') paidSalaries += s.net_salary || 0;
        else pendingSalaries += s.net_salary || 0;
    });

    // 5. employees
    const { data: employees } = await supabase.from('employees').select('*').eq('is_active', true);
    console.log('\n📋 employees (active):', employees?.length || 0);
    employees?.forEach(e => console.log(`   ${e.full_name}: ${e.employee_type}, راتب=${e.base_salary}`));

    // ===== الحسابات الصحيحة =====
    console.log('\n' + '═'.repeat(70));
    console.log('🧮 الحسابات الصحيحة:');
    console.log('═'.repeat(70));

    // إجمالي الإيرادات = إيرادات عامة + مدفوعات طلاب + مقدمات
    const totalRevenue = genRevenue + payments + totalAdvance;
    console.log(`\n✅ إجمالي الإيرادات: ${totalRevenue.toLocaleString()}`);
    console.log(`   (عامة: ${genRevenue} + مدفوعات: ${payments} + مقدمات: ${totalAdvance})`);

    // إجمالي المصروفات = مصروفات عامة + رواتب مدفوعة
    const totalExpenses = genExpense + paidSalaries;
    console.log(`\n✅ إجمالي المصروفات: ${totalExpenses.toLocaleString()}`);
    console.log(`   (عامة: ${genExpense} + رواتب: ${paidSalaries})`);

    // صافي الوضع المالي
    const netBalance = totalRevenue - totalExpenses;
    console.log(`\n✅ صافي الوضع المالي: ${netBalance.toLocaleString()}`);

    // تحصيل الطلاب = مدفوعات + مقدمات
    const studentCollection = payments + totalAdvance;
    console.log(`\n✅ تحصيل الطلاب: ${studentCollection.toLocaleString()}`);
    console.log(`   (مدفوعات: ${payments} + مقدمات: ${totalAdvance})`);

    // نسبة التحصيل
    const collectionRate = totalFees > 0 ? ((studentCollection) / totalFees) * 100 : 0;
    console.log(`\n✅ نسبة التحصيل: ${collectionRate.toFixed(1)}%`);
    console.log(`   (${studentCollection} / ${totalFees})`);

    // خصومات الطلاب
    console.log(`\n✅ خصومات الطلاب: ${discounts.toLocaleString()}`);

    // المبالغ المستحقة = الرسوم - المدفوعات - المقدمات - الخصومات
    const pendingPayments = totalFees - payments - totalAdvance - discounts;
    console.log(`\n✅ المبالغ المستحقة للتحصيل: ${Math.max(0, pendingPayments).toLocaleString()}`);
    console.log(`   (${totalFees} - ${payments} - ${totalAdvance} - ${discounts})`);

    // الرواتب المستحقة
    console.log(`\n✅ الرواتب المستحقة: ${pendingSalaries.toLocaleString()}`);

    // إجمالي الموظفين
    console.log(`\n✅ إجمالي الموظفين النشطين: ${employees?.length || 0}`);

    console.log('\n' + '═'.repeat(70));
}

analyzeFinance().catch(console.error);
