import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkEmployees() {
    const { data, error } = await supabase.from('employees').select('id, full_name, employee_id');
    if (error) {
        console.error('Error fetching employees:', error);
        return;
    }
    console.log('Employees found:', data.length);
    console.log(data);
}

checkEmployees();
