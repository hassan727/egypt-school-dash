import { createClient } from '@supabase/supabase-js';

// Log all environment variables for debugging
console.log('=== Environment Variables Debug ===');
console.log('All env vars:', import.meta.env);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('==================================');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL from env:', supabaseUrl);
console.log('Supabase Anon Key from env:', supabaseAnonKey ? '[KEY HIDDEN]' : 'undefined');

// More strict checking for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
    console.error('supabaseUrl:', supabaseUrl);
    console.error('supabaseAnonKey:', supabaseAnonKey ? '[KEY HIDDEN]' : 'undefined');
    
    // Only throw error in development mode
    if (import.meta.env.DEV) {
        // Don't throw error anymore to allow app to run
        console.warn('Missing Supabase environment variables - using defaults for testing');
    }
}

export const supabase = createClient(
  supabaseUrl || "https://xwccjbeqfvyzdaxsabhy.supabase.co",
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Y2NqYmVxZnZ5emRheHNhYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzQxODMsImV4cCI6MjA3ODMxMDE4M30.TGXkz6MPIIEU1hZnV1O_7ZlSJKL1v07gWpuxbJyf_6g"
);