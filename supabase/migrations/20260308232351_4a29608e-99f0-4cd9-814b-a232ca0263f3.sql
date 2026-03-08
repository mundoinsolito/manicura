
-- Platform settings table (singleton row for landing page content)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'NailsPro',
  brand_logo_url text,
  hero_title text NOT NULL DEFAULT 'Tu negocio de uñas, digitalizado',
  hero_subtitle text NOT NULL DEFAULT 'La plataforma todo-en-uno para manicuristas profesionales. Agenda, clientes, finanzas y tu propia página web en minutos.',
  hero_image_url text,
  cta_text text NOT NULL DEFAULT 'Crear mi cuenta gratis',
  footer_text text NOT NULL DEFAULT '© NailsPro. Todos los derechos reservados.',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public reads platform_settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Super admin can manage
CREATE POLICY "Super admin manages platform_settings"
ON public.platform_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Seed default row
INSERT INTO public.platform_settings (brand_name) VALUES ('NailsPro');

-- Storage bucket for platform images
INSERT INTO storage.buckets (id, name, public) VALUES ('platform', 'platform', true);

-- Storage policies
CREATE POLICY "Public reads platform files"
ON storage.objects FOR SELECT
USING (bucket_id = 'platform');

CREATE POLICY "Super admin uploads platform files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'platform' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin updates platform files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'platform' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin deletes platform files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'platform' AND has_role(auth.uid(), 'super_admin'));
