
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReceivables() {
    console.log('Starting Receivables Verification...');
    console.log('-----------------------------------');

    const academicYear = '2025-2026';

    // 1. Fetch Fees (Expectations)
    const { data: fees, error: feesError } = await supabase
        .from('school_fees')
        .select('student_id, total_amount')
        .eq('academic_year_code', academicYear);

    if (feesError) {
        console.error('Error fetching fees:', feesError);
        return;
    }

    // 2. Fetch Payments (Actuals)
    const { data: payments, error: paymentsError } = await supabase
        .from('financial_transactions')
        .select('student_id, amount')
        .eq('academic_year_code', academicYear)
        .eq('transaction_type', 'دفعة');

    if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return;
    }

    console.log(`Fetched ${fees?.length || 0} fee records.`);
    console.log(`Fetched ${payments?.length || 0} payment transactions.`);

    // 3. Aggregate Data
    let totalDue = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let notPaidCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;

    fees?.forEach(fee => {
        const studentPayments = payments?.filter(p => p.student_id === fee.student_id) || [];
        const paidAmount = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const amountDue = fee.total_amount || 0;

        totalDue += amountDue;
        totalCollected += paidAmount;

        // Status Logic
        const progress = amountDue > 0 ? (paidAmount / amountDue) : 0;

        if (progress >= 1) {
            completedCount++;
        } else if (progress >= 0.5) {
            inProgressCount++;
        } else if (paidAmount > 0) {
            overdueCount++; // Paid something but < 50%
        } else {
            notPaidCount++;
        }
    });

    const totalRemaining = totalDue - totalCollected;

    console.log('\n--- Calculated Stats (Database) ---');
    console.log(`Total Due (إجمالي المستحقات): ${totalDue.toLocaleString()}`);
    console.log(`Total Collected (تم تحصيله): ${totalCollected.toLocaleString()}`);
    console.log(`Total Remaining (المتبقي): ${totalRemaining.toLocaleString()}`);
    console.log(`-----------------------------------`);
    console.log(`Completed (مكتمل): ${completedCount}`);
    console.log(`In Progress (جاري السداد): ${inProgressCount}`);
    console.log(`Overdue (متأخر): ${overdueCount}`);
    console.log(`Not Paid (لم يسدد): ${notPaidCount}`);
    console.log(`Total Students Verified: ${fees?.length}`);
}

verifyReceivables();
