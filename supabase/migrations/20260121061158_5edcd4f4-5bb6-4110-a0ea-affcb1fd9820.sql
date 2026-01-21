-- Add center_id to user_roles for center-specific admins
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id);

-- Create function to check if user is center admin
CREATE OR REPLACE FUNCTION public.is_center_admin(_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND (center_id IS NULL OR center_id = _center_id)
  )
$$;

-- Create function to get admin's center_id (NULL means super admin)
CREATE OR REPLACE FUNCTION public.get_admin_center_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT center_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND role = 'admin'
  LIMIT 1
$$;