import { useEffect } from 'react';

const EnvTest = () => {
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('=== Environment Variables Test ===');
    console.log('VITE_SUPABASE_URL:', supabaseUrl);
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[KEY HIDDEN]' : 'undefined');
    console.log('=================================');
  }, []);

  return (
    <div>
      <h1>Environment Variables Test</h1>
      <p>Check the browser console for environment variable values.</p>
    </div>
  );
};

export default EnvTest;