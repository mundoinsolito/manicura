
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- RLS policy for user_roles: only admins can read
CREATE POLICY "Admins can read user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Now update RLS policies for existing tables

-- SERVICES: public read, admin write
DROP POLICY IF EXISTS "Public access" ON public.services;
CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROMOTIONS: public read, admin write
DROP POLICY IF EXISTS "Public access" ON public.promotions;
CREATE POLICY "Anyone can read promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SETTINGS: public read, admin write
DROP POLICY IF EXISTS "Public access" ON public.settings;
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CLIENTS: admin only
DROP POLICY IF EXISTS "Public access" ON public.clients;
CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Allow anon insert for booking (clients register themselves)
CREATE POLICY "Anyone can insert clients" ON public.clients FOR INSERT WITH CHECK (true);
-- Allow anon select by cedula for booking status checker
CREATE POLICY "Anyone can read clients" ON public.clients FOR SELECT USING (true);

-- APPOINTMENTS: public insert (booking), admin manage, public read own by client
DROP POLICY IF EXISTS "Public access" ON public.appointments;
CREATE POLICY "Anyone can insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TRANSACTIONS: admin only
DROP POLICY IF EXISTS "Public access" ON public.transactions;
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- BLOCKED_TIMES: public read (for booking), admin manage
DROP POLICY IF EXISTS "Public access" ON public.blocked_times;
CREATE POLICY "Anyone can read blocked_times" ON public.blocked_times FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked_times" ON public.blocked_times FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CUSTOM_SCHEDULES: public read, admin manage
ALTER TABLE public.custom_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read custom_schedules" ON public.custom_schedules FOR SELECT USING (true);
CREATE POLICY "Admins can manage custom_schedules" ON public.custom_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PUSH_SUBSCRIPTIONS: public insert/read, admin manage
DROP POLICY IF EXISTS "Allow all push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Anyone can insert push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Admins can manage push_subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATION_LOGS: admin only
DROP POLICY IF EXISTS "Allow all notification_logs" ON public.notification_logs;
CREATE POLICY "Admins can manage notification_logs" ON public.notification_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
