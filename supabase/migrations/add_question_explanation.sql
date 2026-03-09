-- Add explanation (pembahasan) column to questions table
-- This stores rich HTML content from the admin's WYSIWYG editor
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation TEXT;
