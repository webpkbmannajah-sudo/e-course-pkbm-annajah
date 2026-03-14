-- Add level_id to exams table
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL;
