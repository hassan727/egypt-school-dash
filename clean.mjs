import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log("Starting cleanup...");

        let d1 = await supabase.from('platform_notifications').select('id');
        if (d1.data && d1.data.length > 0) {
            console.log(`Deleting ${d1.data.length} notifications...`);
            for (let r of d1.data) await supabase.from('platform_notifications').delete().eq('id', r.id);
        }

        let d2 = await supabase.from('platform_support_tickets').select('id');
        if (d2.data && d2.data.length > 0) {
            console.log(`Deleting ${d2.data.length} tickets...`);
            for (let r of d2.data) await supabase.from('platform_support_tickets').delete().eq('id', r.id);
        }

        let d3 = await supabase.from('platform_payments').select('id');
        if (d3.data && d3.data.length > 0) {
            console.log(`Deleting ${d3.data.length} payments...`);
            for (let r of d3.data) await supabase.from('platform_payments').delete().eq('id', r.id);
        }

        let d4 = await supabase.from('platform_audit_log').select('id');
        if (d4.data && d4.data.length > 0) {
            console.log(`Deleting ${d4.data.length} audit logs...`);
            for (let r of d4.data) await supabase.from('platform_audit_log').delete().eq('id', r.id);
        }

        console.log("Cleanup done.");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
