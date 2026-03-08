
-- 1. Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  logo_url text,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Owners can read their own tenant
CREATE POLICY "Owners can read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Super admins can do everything
CREATE POLICY "Super admins full access" ON public.tenants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Anyone can read tenants by slug (public pages)
CREATE POLICY "Public can read active tenants" ON public.tenants
  FOR SELECT TO anon, authenticated
  USING (status IN ('trial', 'active'));

-- 2. Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  trial_days integer NOT NULL DEFAULT 14,
  max_clients integer,
  max_appointments_month integer,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. Create tenant_subscriptions table
CREATE TABLE public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trial',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  approved_by uuid,
  payment_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owners can read own subscriptions" ON public.tenant_subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Super admins manage subscriptions" ON public.tenant_subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 4. Add tenant_id to all existing tables
ALTER TABLE public.services ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.blocked_times ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.custom_schedules ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.promotions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.push_subscriptions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.notification_logs ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 5. Helper function: get tenant_id for current user
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE owner_id = auth.uid() LIMIT 1
$$;

-- 6. Drop old RLS policies and create tenant-aware ones

-- SERVICES
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Anyone can read services" ON public.services;

CREATE POLICY "Tenant admin manages own services" ON public.services
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public reads tenant services" ON public.services
  FOR SELECT USING (true);

-- CLIENTS
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can read clients" ON public.clients;

CREATE POLICY "Tenant admin manages own clients" ON public.clients
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public can insert clients" ON public.clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read clients" ON public.clients
  FOR SELECT USING (true);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Admins can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can read appointments" ON public.appointments;

CREATE POLICY "Tenant admin manages own appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read appointments" ON public.appointments
  FOR SELECT USING (true);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;

CREATE POLICY "Tenant admin manages own transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

-- SETTINGS
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;

CREATE POLICY "Tenant admin manages own settings" ON public.settings
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public reads tenant settings" ON public.settings
  FOR SELECT USING (true);

-- BLOCKED_TIMES
DROP POLICY IF EXISTS "Admins can manage blocked_times" ON public.blocked_times;
DROP POLICY IF EXISTS "Anyone can read blocked_times" ON public.blocked_times;

CREATE POLICY "Tenant admin manages own blocked_times" ON public.blocked_times
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public reads blocked_times" ON public.blocked_times
  FOR SELECT USING (true);

-- CUSTOM_SCHEDULES
DROP POLICY IF EXISTS "Admins can manage custom_schedules" ON public.custom_schedules;
DROP POLICY IF EXISTS "Anyone can read custom_schedules" ON public.custom_schedules;

CREATE POLICY "Tenant admin manages own custom_schedules" ON public.custom_schedules
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public reads custom_schedules" ON public.custom_schedules
  FOR SELECT USING (true);

-- PROMOTIONS
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Anyone can read promotions" ON public.promotions;

CREATE POLICY "Tenant admin manages own promotions" ON public.promotions
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public reads promotions" ON public.promotions
  FOR SELECT USING (true);

-- PUSH_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Admins can manage push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can insert push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can read push_subscriptions" ON public.push_subscriptions;

CREATE POLICY "Tenant admin manages own push_subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Public can insert push_subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (true);

-- NOTIFICATION_LOGS
DROP POLICY IF EXISTS "Admins can manage notification_logs" ON public.notification_logs;

CREATE POLICY "Tenant admin manages own notification_logs" ON public.notification_logs
  FOR ALL TO authenticated
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

-- 7. Register tenant function (called during registration)
CREATE OR REPLACE FUNCTION public.register_tenant(_slug text, _business_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  -- Check if user already has a tenant
  SELECT id INTO _tenant_id FROM public.tenants WHERE owner_id = _user_id;
  IF _tenant_id IS NOT NULL THEN
    RETURN _tenant_id;
  END IF;
  
  -- Check slug availability
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = _slug) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;
  
  -- Create tenant
  INSERT INTO public.tenants (owner_id, slug, business_name)
  VALUES (_user_id, _slug, _business_name)
  RETURNING id INTO _tenant_id;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create default settings for tenant
  INSERT INTO public.settings (id, tenant_id, business_name)
  VALUES (_tenant_id::text, _tenant_id, _business_name);
  
  RETURN _tenant_id;
END;
$$;

-- 8. Insert default subscription plans
INSERT INTO public.subscription_plans (name, price, trial_days, max_clients, max_appointments_month, features) VALUES
  ('Básico', 9.99, 14, 50, 100, '["Página pública", "Gestión de citas", "Gestión de clientes"]'::jsonb),
  ('Pro', 19.99, 14, 200, 500, '["Todo en Básico", "Promociones", "Finanzas", "Notificaciones push"]'::jsonb),
  ('Premium', 29.99, 14, NULL, NULL, '["Todo en Pro", "Clientes ilimitados", "Citas ilimitadas", "Soporte prioritario"]'::jsonb);
