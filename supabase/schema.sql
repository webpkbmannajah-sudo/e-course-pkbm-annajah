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
