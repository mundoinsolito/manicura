import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformSettings {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  cta_text: string;
  footer_text: string;
  whatsapp_support: string | null;
  support_email: string | null;
  faq_items: { question: string; answer: string }[] | null;
  updated_at: string | null;
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await (supabase as any)
      .from('platform_settings')
      .select('*')
      .limit(1)
      .single();
    if (data) {
      // Parse faq_items if string
      if (typeof data.faq_items === 'string') {
        try { data.faq_items = JSON.parse(data.faq_items); } catch { data.faq_items = []; }
      }
      setSettings(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const update = async (updates: Partial<PlatformSettings>) => {
    if (!settings) return;
    const { data, error } = await (supabase as any)
      .from('platform_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
      .select()
      .single();
    if (data) {
      if (typeof data.faq_items === 'string') {
        try { data.faq_items = JSON.parse(data.faq_items); } catch { data.faq_items = []; }
      }
      setSettings(data);
    }
    return { data, error };
  };

  const uploadImage = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('platform')
      .upload(path, file, { upsert: true });
    if (error) return { url: null, error };
    const { data: urlData } = supabase.storage.from('platform').getPublicUrl(data.path);
    return { url: urlData.publicUrl, error: null };
  };

  return { settings, loading, update, uploadImage, refetch: fetch };
}
