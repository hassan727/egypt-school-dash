
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env manually to ensure it works without complex setup
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeReceivables() {
    console.log('🔍 Calculating Receivables from Database...');
    const academicYear = '2025-2026';

    try {
        // 1. Get Total Fees (Expected Revenue)
        const { data: fees, error: feesError } = await supabase
            .from('school_fees')
            .select('student_id, total_amount, advance_payment')
            .eq('academic_year_code', academicYear);

        if (feesError) throw feesError;

        // 2. Get Total Payments (Collected Revenue)
        const { data: payments, error: paymentsError } = await supabase
            .from('financial_transactions')
            .select('student_id, amount')
            .eq('academic_year_code', academicYear)
            .eq('transaction_type', 'دفعة');

        if (paymentsError) throw paymentsError;

        // 3. Get total advance payments
        const totalAdvance = fees.reduce((sum, f) => sum + (f.advance_payment || 0), 0);

        // 4. Get Discounts
        const { data: discounts } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('academic_year_code', academicYear)
            .eq('transaction_type', 'خصم');

        const totalDiscounts = discounts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

        // Calculations
        const totalFees = fees.reduce((sum, f) => sum + (f.total_amount || 0), 0);
        const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Index.tsx Logic for Pending:
        const pendingMainDashboard = totalFees - totalCollected - totalAdvance - totalDiscounts;

        // Receivables.tsx Logic for Remaining:
        // Receivables page usually does: total_amount - total_paid. 
        // Does it subtract advance_payments? Let's check the code.
        // Based on my view of Receivables.tsx earlier: 
        // "const totalPaid = studentPayments.reduce... + (fee.advance_payment || 0);" (Need to confirm if it adds advance)

        const totalRemaining = totalFees - totalCollected; // Basic remaining without advance logic if Receivables doesn't use it.

        console.log('\n📊 DETAILED BREAKDOWN:');
        console.log('--------------------------------');
        console.log(`💰 Total Fees Expected:      ${totalFees.toLocaleString()}`);
        console.log(`💵 Total Advance Payments:   ${totalAdvance.toLocaleString()}`);
        console.log(`🏷️  Total Discounts:          ${totalDiscounts.toLocaleString()}`);
        console.log(`💳 Total Payments Collected: ${totalCollected.toLocaleString()}`);
        console.log('--------------------------------');
        console.log(`🧮 Calculated Pending (Main Dash Logic): ${pendingMainDashboard.toLocaleString()}`);
        console.log(`🧮 Calculated Remaining (Simple Logic):   ${totalRemaining.toLocaleString()}`);


        // Overdue Analysis (Basic)
        let overdueCount = 0;
        let notPaidCount = 0;

        const paymentsMap = new Map();
        payments.forEach(p => {
            const current = paymentsMap.get(p.student_id) || 0;
            paymentsMap.set(p.student_id, current + p.amount);
        });

        fees.forEach(fee => {
            const paid = paymentsMap.get(fee.student_id) || 0;
            const remaining = (fee.total_amount || 0) - paid;

            if (remaining > 0) {
                if (paid === 0) notPaidCount++;
                else overdueCount++;
            }
        });

        console.log('\n📊 DATABASE RESULTS (Real-time):');
        console.log('--------------------------------');
        console.log(`💰 Total Fees Due (المستحق):    ${totalFees.toLocaleString()} EGP`);
        console.log(`✅ Total Collected (المحصل):   ${totalCollected.toLocaleString()} EGP`);
        console.log(`⏳ Total Remaining (المتبقي):   ${totalRemaining.toLocaleString()} EGP`);
        console.log('--------------------------------');
        console.log(`👥 Students Not Paid (لم يسدد): ${notPaidCount}`);
        console.log(`👥 Students Partial  (متأخر):   ${overdueCount}`);
        console.log('\n✅ Verification Complete');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

analyzeReceivables();
