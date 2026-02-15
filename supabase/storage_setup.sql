-- ==========================================
-- Storage Buckets & Policies Setup
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exams', 'exams', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies for 'materials' bucket

-- Anyone can view/download materials
CREATE POLICY "Anyone can view materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials');

-- Only admins can upload materials
CREATE POLICY "Admins can upload materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update materials
CREATE POLICY "Admins can update materials"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete materials
CREATE POLICY "Admins can delete materials"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Policies for 'exams' bucket

-- Anyone can view/download exams
CREATE POLICY "Anyone can view exams"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exams');

-- Only admins can upload exams
CREATE POLICY "Admins can upload exams"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exams'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update exams
CREATE POLICY "Admins can update exams"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exams'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete exams
CREATE POLICY "Admins can delete exams"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exams'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
