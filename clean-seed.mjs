import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanData() {
    console.log("Cleaning platform_notifications...");
    const res1 = await supabase.from('platform_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Result:", res1.error ? res1.error.message : "Success");

    console.log("Cleaning platform_support_tickets...");
    const res2 = await supabase.from('platform_support_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Result:", res2.error ? res2.error.message : "Success");

    console.log("Cleaning platform_payments...");
    const res3 = await supabase.from('platform_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Result:", res3.error ? res3.error.message : "Success");
}

cleanData();
