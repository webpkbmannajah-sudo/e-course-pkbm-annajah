-- Supabase SQL Schema for Course Management System
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'questions')),
  pdf_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  order_number INTEGER NOT NULL DEFAULT 0
);

-- Choices table
CREATE TABLE IF NOT EXISTS public.choices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- Exam attempts table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  answers JSONB DEFAULT '{}',
  score INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profile on signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Materials policies
CREATE POLICY "Anyone authenticated can view materials" ON public.materials
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can create materials" ON public.materials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update materials" ON public.materials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete materials" ON public.materials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Exams policies
CREATE POLICY "Anyone authenticated can view exams" ON public.exams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can create exams" ON public.exams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update exams" ON public.exams
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete exams" ON public.exams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions policies
CREATE POLICY "Anyone authenticated can view questions" ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage questions" ON public.questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Choices policies
CREATE POLICY "Anyone authenticated can view choices" ON public.choices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage choices" ON public.choices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Exam attempts policies
CREATE POLICY "Users can view their own attempts" ON public.exam_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts" ON public.exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" ON public.exam_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts" ON public.exam_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
-- Note: Run these in the Supabase Dashboard under Storage

-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exams', 'exams', true);

-- Storage policies
-- CREATE POLICY "Anyone can view materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
-- CREATE POLICY "Admins can upload materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- CREATE POLICY "Anyone can view exams" ON storage.objects FOR SELECT USING (bucket_id = 'exams');
-- CREATE POLICY "Admins can upload exams" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exams' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==========================================
-- PHASE 1: Authentication & User Management
-- ==========================================

-- Login history tracking
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failed')),
  failure_reason TEXT
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Enable RLS for new tables
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Login History Policies
CREATE POLICY "Users can view their own login history" ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history" ON public.login_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can insert login history" ON public.login_history
  FOR INSERT WITH CHECK (true); -- Usually inserted by backend/middleware

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- PHASE 3: Penilaian Otomatis MCQ
-- ==========================================

-- Scores table with breakdown
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100,
  percentage DECIMAL(5,2),
  is_passed BOOLEAN DEFAULT FALSE,
  grading_type TEXT CHECK (grading_type IN ('auto', 'manual', 'mixed')),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  breakdown JSONB DEFAULT '[]',
  UNIQUE(attempt_id)
);

-- Add weight and question_type to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'mcq'
  CHECK (question_type IN ('mcq', 'essay'));

-- Enable RLS for scores
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Scores RLS Policies
CREATE POLICY "Users can view their own scores" ON public.scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scores" ON public.scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage scores" ON public.scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can manage scores" ON public.scores
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- PHASE 4: Reporting & Analytics
-- ==========================================

-- Function: Get exam statistics summary
CREATE OR REPLACE FUNCTION get_exam_statistics(p_exam_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_attempts', COUNT(s.id),
    'avg_score', ROUND(AVG(s.percentage), 2),
    'max_score', MAX(s.percentage),
    'min_score', MIN(s.percentage),
    'pass_count', COUNT(*) FILTER (WHERE s.is_passed = TRUE),
    'fail_count', COUNT(*) FILTER (WHERE s.is_passed = FALSE),
    'pass_rate', ROUND(
      COUNT(*) FILTER (WHERE s.is_passed = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
    )
  )
  FROM scores s
  WHERE s.exam_id = p_exam_id;
$$ LANGUAGE SQL STABLE;

-- Function: Get score distribution for an exam (for histogram)
CREATE OR REPLACE FUNCTION get_score_distribution(p_exam_id UUID)
RETURNS TABLE(score_range TEXT, count BIGINT) AS $$
  SELECT
    CASE
      WHEN percentage < 10 THEN '0-9'
      WHEN percentage < 20 THEN '10-19'
      WHEN percentage < 30 THEN '20-29'
      WHEN percentage < 40 THEN '30-39'
      WHEN percentage < 50 THEN '40-49'
      WHEN percentage < 60 THEN '50-59'
      WHEN percentage < 70 THEN '60-69'
      WHEN percentage < 80 THEN '70-79'
      WHEN percentage < 90 THEN '80-89'
      ELSE '90-100'
    END AS score_range,
    COUNT(*) AS count
  FROM scores
  WHERE exam_id = p_exam_id
  GROUP BY score_range
  ORDER BY score_range;
$$ LANGUAGE SQL STABLE;

-- Function: Get student performance summary
CREATE OR REPLACE FUNCTION get_student_performance(p_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_exams_taken', COUNT(s.id),
    'avg_score', ROUND(AVG(s.percentage), 2),
    'highest_score', MAX(s.percentage),
    'lowest_score', MIN(s.percentage),
    'pass_count', COUNT(*) FILTER (WHERE s.is_passed = TRUE),
    'fail_count', COUNT(*) FILTER (WHERE s.is_passed = FALSE),
    'total_exams_available', (SELECT COUNT(*) FROM exams WHERE type = 'questions')
  )
  FROM scores s
  WHERE s.user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function: Get platform-wide overview stats
CREATE OR REPLACE FUNCTION get_platform_overview()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_students', (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
    'total_exams', (SELECT COUNT(*) FROM exams),
    'total_question_exams', (SELECT COUNT(*) FROM exams WHERE type = 'questions'),
    'total_attempts', (SELECT COUNT(*) FROM exam_attempts),
    'total_graded', (SELECT COUNT(*) FROM scores),
    'avg_platform_score', (SELECT ROUND(AVG(percentage), 2) FROM scores),
    'overall_pass_rate', (
      SELECT ROUND(
        COUNT(*) FILTER (WHERE is_passed = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
      ) FROM scores
    ),
    'total_materials', (SELECT COUNT(*) FROM materials)
  );
$$ LANGUAGE SQL STABLE;

