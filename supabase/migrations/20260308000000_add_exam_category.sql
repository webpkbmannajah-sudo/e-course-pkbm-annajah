-- Add category column to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS category TEXT;

-- For existing exams without a category, you can optionally set a default
-- UPDATE public.exams SET category = 'Latihan Soal' WHERE category IS NULL;
