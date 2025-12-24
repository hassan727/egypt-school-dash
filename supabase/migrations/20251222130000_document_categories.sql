-- Migration: Flexible Document Categories System
-- 20251222_flexible_document_categories

-- 1. Create Document Categories Table
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES document_categories(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT false, -- If true, cannot be deleted/renamed by user (except if logic permits renaming)
    is_required BOOLEAN DEFAULT false, -- If true, this category is mandatory for employee completeness
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique names within the same parent level to avoid confusion
    UNIQUE(parent_id, name)
);

-- 2. Update Employee Documents Table
-- Add new columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_documents' AND column_name = 'category_id') THEN
        ALTER TABLE employee_documents ADD COLUMN category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_documents' AND column_name = 'tags') THEN
        ALTER TABLE employee_documents ADD COLUMN tags TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_documents' AND column_name = 'expiry_date') THEN
        ALTER TABLE employee_documents ADD COLUMN expiry_date DATE;
    END IF;
    
    -- Drop old document_type if we are replacing it with category_id largely. 
    -- We'll keep it for now for backward compatibility or migration, but make it nullable.
    ALTER TABLE employee_documents ALTER COLUMN document_type DROP NOT NULL;
END $$;


-- 3. Seed Mandatory Categories (Egyptian Labor Law Requirements)
DO $$
DECLARE
    -- Root Categories
    cat_identity UUID;
    cat_education UUID;
    cat_military UUID;
    cat_financial UUID;
    cat_health UUID;
    cat_security UUID;
    cat_professional UUID;
    cat_contract UUID;
BEGIN
    -- 3.1 Identity & Personal (الهوية والشخصية)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('الهوية والشخصية', true, true) 
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_identity;
    
    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('بطاقة الرقم القومي', cat_identity, true, true),
        ('شهادة الميلاد المميكنة', cat_identity, true, true),
        ('جواز السفر', cat_identity, true, false)
    ON CONFLICT DO NOTHING;

    -- 3.2 Education (المستندات التعليمية)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('المستندات التعليمية', true, true)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_education;
    
    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('الشهادات الدراسية', cat_education, true, true),
        ('كشوف الدرجات', cat_education, true, false),
        ('شهادات الخبرة السابقة', cat_education, true, false),
        ('شهادات الدورات التدريبية', cat_education, true, false)
    ON CONFLICT (parent_id, name) DO NOTHING;

    -- Sub-categories for 'الشهادات الدراسية' need to be inserted carefully by fetching ID first, 
    -- but for simplicity in this block we'll skip deep nested seeding unless we fetch IDs.
    -- Let's just do top-levels + direct children as requested in prompt mostly.
    
    -- 3.3 Military (المستندات العسكرية)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('المستندات العسكرية', true, true)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_military;

    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('بطاقة الخدمة العسكرية', cat_military, true, true),
        ('شهادة الإعفاء', cat_military, true, false),
        ('شهادة إنهاء الخدمة العسكرية', cat_military, true, false)
    ON CONFLICT DO NOTHING;

    -- 3.4 Financial (المستندات المالية والبنكية)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('المستندات المالية والبنكية', true, true)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_financial;

    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('الشهادة الضريبية', cat_financial, true, false),
        ('بطاقة التأمينات الاجتماعية', cat_financial, true, true),
        ('شهادة عدم التعطل', cat_financial, true, false),
        ('كشف حساب بنكي', cat_financial, true, true),
        ('شهادة عدم ممانعة', cat_financial, true, false)
    ON CONFLICT DO NOTHING;

    -- 3.5 Health (المستندات الصحية)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('المستندات الصحية', true, true)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_health;

    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('الشهادة الطبية', cat_health, true, true),
        ('فحوصات فيروس سي وفيروس بي', cat_health, true, false),
        ('شهادة خلو من الأمراض المعدية', cat_health, true, true)
    ON CONFLICT DO NOTHING;

    -- 3.6 Security (الأمن والسلامة)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('الأمن والسلامة', true, true)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_security;

    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('الفيش والتشبيه', cat_security, true, true)
    ON CONFLICT DO NOTHING;

    -- 3.7 Professional (المستندات المهنية الخاصة)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('المستندات المهنية الخاصة', true, false)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_professional;

    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('شهادة تأهيل تربوي', cat_professional, true, false),
        ('شهادات التدريب المهني', cat_professional, true, false),
        ('رخص القيادة', cat_professional, true, false),
        ('شهادات الأمن والسلامة', cat_professional, true, false)
    ON CONFLICT DO NOTHING;

    -- 3.8 Contract & Admin (مستندات التعاقد والإدارة)
    INSERT INTO document_categories (name, is_system, is_required) VALUES ('مستندات التعاقد والإدارة', true, true)
    ON CONFLICT (parent_id, name) DO UPDATE SET is_system = true RETURNING id INTO cat_contract;

    INSERT INTO document_categories (name, parent_id, is_system, is_required) VALUES 
        ('إقرارات السرية', cat_contract, true, true),
        ('نماذج التأمينات', cat_contract, true, true),
        ('النماذج الضريبية', cat_contract, true, true),
        ('بطاقات التأمين الصحي', cat_contract, true, false)
    ON CONFLICT DO NOTHING;

END $$;

-- 4. Enable RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to document_categories" ON document_categories FOR ALL USING (true) WITH CHECK (true);
