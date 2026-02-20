-- Migration: Fix profiles, materials, and questions schema
-- Date: 2026-02-17

-- ==========================================
-- 1. Profiles: Change default status to 'active' (no approval needed)
-- ==========================================
ALTER TABLE public.profiles 
    ALTER COLUMN status SET DEFAULT 'active';

-- Update any existing 'pending' users to 'active'
UPDATE public.profiles SET status = 'active' WHERE status = 'pending';

-- ==========================================
-- 2. Profiles: Add optional fields
-- ==========================================
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS enrollment_year TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT;

-- ==========================================
-- 3. Materials: Update type constraint (pdf, image only)
-- ==========================================
-- First, migrate any existing 'text' or 'video' materials to 'pdf'
UPDATE public.materials SET type = 'pdf' WHERE type NOT IN ('pdf', 'image');

-- Drop old constraint and add new one
ALTER TABLE public.materials 
    DROP CONSTRAINT IF EXISTS materials_type_check;

ALTER TABLE public.materials 
    ADD CONSTRAINT materials_type_check 
    CHECK (type IN ('pdf', 'image'));

-- Drop video_url column (no longer needed)
ALTER TABLE public.materials 
    DROP COLUMN IF EXISTS video_url;

-- ==========================================
-- 4. Questions: Add image_url for diagrams/images in questions
-- ==========================================
ALTER TABLE public.questions 
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ==========================================
-- 5. Update user trigger to include new fields & active status
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, education_level, status, phone, enrollment_year, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'education_level',
    'active',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'enrollment_year',
    NEW.raw_user_meta_data->>'address'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
