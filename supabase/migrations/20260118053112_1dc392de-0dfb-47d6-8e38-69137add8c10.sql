-- Create lessons table for course modules
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Lessons policies (anyone can view, only admins can modify)
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins can insert lessons" ON public.lessons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update lessons" ON public.lessons FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE USING (is_admin());

-- Lesson progress policies
CREATE POLICY "Users can view own progress" ON public.lesson_progress FOR SELECT 
  USING (user_owns_enrollment(enrollment_id) OR is_admin());
CREATE POLICY "Users can update own progress" ON public.lesson_progress FOR UPDATE 
  USING (user_owns_enrollment(enrollment_id));
CREATE POLICY "Users can insert own progress" ON public.lesson_progress FOR INSERT 
  WITH CHECK (user_owns_enrollment(enrollment_id));
CREATE POLICY "Admins can delete progress" ON public.lesson_progress FOR DELETE USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();