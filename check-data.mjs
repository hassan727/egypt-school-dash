import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: students } = await supabase.from('students').select('id, school_id');
    const { data: employees } = await supabase.from('employees').select('id, school_id');

    const sMap = {};
    students?.forEach(s => sMap[s.school_id] = (sMap[s.school_id] || 0) + 1);

    const eMap = {};
    employees?.forEach(e => eMap[e.school_id] = (eMap[e.school_id] || 0) + 1);

    console.log("Students by School ID:", sMap);
    console.log("Employees by School ID:", eMap);
}

check();
