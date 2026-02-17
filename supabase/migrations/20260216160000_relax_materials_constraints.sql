-- Make file_url and file_name nullable for non-file materials
ALTER TABLE public.materials ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE public.materials ALTER COLUMN file_name DROP NOT NULL;
