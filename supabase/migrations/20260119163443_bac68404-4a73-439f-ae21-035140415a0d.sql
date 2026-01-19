
-- Create centers table
CREATE TABLE public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on centers
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Anyone can view centers
CREATE POLICY "Anyone can view centers" ON public.centers FOR SELECT USING (true);

-- Admins can manage centers
CREATE POLICY "Admins can insert centers" ON public.centers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update centers" ON public.centers FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete centers" ON public.centers FOR DELETE USING (is_admin());

-- Insert default centers
INSERT INTO public.centers (name, address, phone) VALUES 
    ('Hatisala', 'Hatisala Branch, Main Road', '+91-XXXXXXXXXX'),
    ('Satulia', 'Satulia Branch, Market Area', '+91-XXXXXXXXXX');

-- Add center_id to enrollments
ALTER TABLE public.enrollments ADD COLUMN center_id UUID REFERENCES public.centers(id);

-- Create payment_history table
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    payment_method TEXT DEFAULT 'cash',
    receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history" ON public.payment_history FOR SELECT 
    USING (user_owns_enrollment(enrollment_id) OR is_admin());
CREATE POLICY "Admins can insert payment history" ON public.payment_history FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update payment history" ON public.payment_history FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete payment history" ON public.payment_history FOR DELETE USING (is_admin());

-- Create videos table for coaching
CREATE TABLE public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    center_id UUID REFERENCES public.centers(id),
    duration_minutes INTEGER,
    order_index INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public videos" ON public.videos FOR SELECT 
    USING (is_public = true OR is_admin());
CREATE POLICY "Admins can insert videos" ON public.videos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update videos" ON public.videos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete videos" ON public.videos FOR DELETE USING (is_admin());

-- Create achievements table with backend
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    student_name TEXT,
    course_name TEXT,
    center_id UUID REFERENCES public.centers(id),
    achievement_date DATE,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can insert achievements" ON public.achievements FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update achievements" ON public.achievements FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete achievements" ON public.achievements FOR DELETE USING (is_admin());

-- Add center_id to profiles for center-specific users
ALTER TABLE public.profiles ADD COLUMN center_id UUID REFERENCES public.centers(id);

-- Update triggers for updated_at
CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON public.centers 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
