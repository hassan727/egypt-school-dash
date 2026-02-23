import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: schools } = await supabase.from('schools').select('id, school_code, school_name').limit(1);
    if (!schools || schools.length === 0) return;

    const targetSchoolId = schools[0].id;

    // Assign orphaned students
    const { error: err1, count: c1 } = await supabase
        .from('students')
        .update({ school_id: targetSchoolId })
        .is('school_id', null);

    // Assign orphaned employees
    const { error: err2, count: c2 } = await supabase
        .from('employees')
        .update({ school_id: targetSchoolId })
        .is('school_id', null);

    console.log("Updated students error:", err1?.message || "success");
    console.log("Updated employees error:", err2?.message || "success");

    // Check subscriptions
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('school_id', targetSchoolId);
    console.log("\nSubscriptions for " + schools[0].school_name + ":", subs);
}

check();
