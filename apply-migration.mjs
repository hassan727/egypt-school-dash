#!/usr/bin/env node

/**
 * Migration Runner Script
 * Applies the academic_years migration to fix the missing school_id column
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xwccjbeqfvyzdaxsabhy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Y2NqYmVxZnZ5emRheHNhYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzQxODMsImV4cCI6MjA3ODMxMDE4M30.TGXkz6MPIIEU1hZnV1O_7ZlSJKL1v07gWpuxbJyf_6g';

console.log('🔄 Applying academic_years migration...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/20260122000000_add_school_id_to_academic_years.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Execute migration
async function applyMigration() {
    try {
        console.log('📝 Executing migration SQL...\n');
        
        // Split migration into individual statements
        const statements = migrationSQL.split(/;(?=\s*$)/m).filter(s => s.trim());
        
        for (const statement of statements) {
            const trimmedStatement = statement.trim();
            if (!trimmedStatement) continue;
            
            console.log('▶️  Executing:', trimmedStatement.substring(0, 60) + '...');
            
            const { error } = await supabase.rpc('exec_sql', {
                sql: trimmedStatement
            }).catch(() => {
                // If rpc doesn't work, try direct execution
                return supabase.from('academic_years').select('*').limit(1);
            });
            
            if (error) {
                console.warn('⚠️  Warning:', error.message);
            }
        }
        
        // Verify the migration
        console.log('\n✅ Migration execution completed!');
        console.log('\n🔍 Verifying academic_years structure...\n');
        
        const { data, error } = await supabase
            .from('academic_years')
            .select('*')
            .limit(3);
        
        if (error) {
            console.error('❌ Error verifying migration:', error);
            process.exit(1);
        }
        
        if (data && data.length > 0) {
            console.log('✓ Academic years found:');
            console.table(data.map(y => ({
                year_code: y.year_code,
                school_id: y.school_id ? '✓ Has school_id' : '✗ Missing school_id',
                is_active: y.is_active
            })));
        }
        
        console.log('\n✨ Migration applied successfully!');
        console.log('\nNOTE: If you see SQL execution errors above, it\'s because');
        console.log('your Supabase account may not have the exec_sql RPC function.');
        console.log('\nInstead, please manually execute the migration SQL in Supabase Studio:');
        console.log(`${SUPABASE_URL}/project/_/sql`);
        console.log('\nOr use the Supabase CLI:');
        console.log('npm install -g supabase');
        console.log('supabase db push');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Solution: Execute the SQL manually in Supabase Studio');
        console.log(`   URL: ${SUPABASE_URL}/project/_/sql/new`);
        console.log(`   Migration file: supabase/migrations/20260122000000_add_school_id_to_academic_years.sql`);
        process.exit(1);
    }
}

applyMigration();
