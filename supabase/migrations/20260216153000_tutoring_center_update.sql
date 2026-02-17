-- Migration for Tutoring Center Update

-- 1. Create Levels Table
CREATE TABLE IF NOT EXISTS public.levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Modify Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected'));

-- 4. Modify Materials Table
ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'pdf', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 5. Seed Initial Data for Levels
INSERT INTO public.levels (name, slug) VALUES 
('Elementary School (SD)', 'sd'),
('Junior High School (SMP)', 'smp'),
('Senior High School (SMA)', 'sma')
ON CONFLICT (slug) DO NOTHING;

-- 6. Enable RLS
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Levels: Public read, Admin write
CREATE POLICY "Anyone can view levels" ON public.levels
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage levels" ON public.levels
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Subjects: Public read, Admin write
CREATE POLICY "Anyone can view subjects" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage subjects" ON public.subjects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
