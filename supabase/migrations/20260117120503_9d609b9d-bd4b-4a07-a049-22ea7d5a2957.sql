-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  duration TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  is_popular BOOLEAN DEFAULT false,
  discount_percent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  batch_timing TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_due_date TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, session_date)
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  certificate_number TEXT NOT NULL UNIQUE,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Create function to get user enrollment
CREATE OR REPLACE FUNCTION public.user_owns_enrollment(_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE id = _enrollment_id
      AND user_id = auth.uid()
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Allow insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- User roles policies (only admins can manage roles)
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_admin());

-- Courses policies (public read, admin write)
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON public.courses
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update courses" ON public.courses
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE USING (public.is_admin());

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own enrollment" ON public.enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update enrollments" ON public.enrollments
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete enrollments" ON public.enrollments
  FOR DELETE USING (public.is_admin());

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON public.attendance
  FOR SELECT USING (public.user_owns_enrollment(enrollment_id) OR public.is_admin());

CREATE POLICY "Admins can insert attendance" ON public.attendance
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update attendance" ON public.attendance
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete attendance" ON public.attendance
  FOR DELETE USING (public.is_admin());

-- Certificates policies
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT USING (public.user_owns_enrollment(enrollment_id) OR public.is_admin());

CREATE POLICY "Admins can insert certificates" ON public.certificates
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update certificates" ON public.certificates
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete certificates" ON public.certificates
  FOR DELETE USING (public.is_admin());

-- Testimonials policies
CREATE POLICY "Anyone can view published testimonials" ON public.testimonials
  FOR SELECT USING (is_published = true OR user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own testimonials" ON public.testimonials
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can delete testimonials" ON public.testimonials
  FOR DELETE USING (public.is_admin());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE USING (public.is_admin());

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup (first user becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- First user becomes admin, rest become students
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'student';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Storage policies for certificates bucket
CREATE POLICY "Users can view own certificates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload certificates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'certificates' AND public.is_admin());

CREATE POLICY "Admins can update certificates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'certificates' AND public.is_admin());

CREATE POLICY "Admins can delete certificates" ON storage.objects
  FOR DELETE USING (bucket_id = 'certificates' AND public.is_admin());