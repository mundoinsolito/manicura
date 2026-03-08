import { useState, useEffect } from 'react';
import { supabase, Settings, SectionColors } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

const defaultSectionColors: SectionColors = {
  background: '#ffffff',
  foreground: '#3d1a24',
  card_bg: '#fdf5f7',
  card_text: '#3d1a24',
  heading_color: '#3d1a24',
  body_text: '#7a5060',
  button_bg: '#d4768f',
  button_text: '#ffffff',
  accent_bg: '#d4a574',
  accent_text: '#3d1a24',
};

const defaultFeatureTags = [
  { id: '1', title: 'Calidad Premium', description: 'Productos de primera calidad', enabled: true },
  { id: '2', title: 'Atención Personalizada', description: 'Cada clienta es única', enabled: true },
  { id: '3', title: 'Reserva Fácil', description: 'Agenda tu cita en segundos', enabled: true },
];

const defaultSettings: Settings = {
  id: '1',
  business_name: '',
  logo_url: null,
  cover_image_url: null,
  whatsapp_number: '+58412000000',
  reservation_amount: 10,
  opening_time: '09:00',
  closing_time: '18:00',
  time_slot_interval: 30,
  schedule_mode: 'interval',
  manual_hours: [],
  primary_color: '#d4768f',
  accent_color: '#d4a574',
  section_colors: null,
  feature_tags: defaultFeatureTags,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export { defaultSectionColors };

export function useSettings() {
  const { tenantId } = useTenant();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [tenantId]);

  async function fetchSettings() {
    if (!tenantId) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await (supabase
        .from('settings')
        .select('*') as any)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        setSettings(defaultSettings);
      } else if (data) {
        setSettings({
          ...defaultSettings,
          ...(data as any),
          schedule_mode: (data.schedule_mode || 'interval') as Settings['schedule_mode'],
          manual_hours: (data.manual_hours || []) as string[],
          section_colors: (data.section_colors || null) as SectionColors | null,
          feature_tags: (data.feature_tags || null) as Settings['feature_tags'],
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(updates: Partial<Settings>) {
    try {
      const { data, error } = await (supabase
        .from('settings')
        .upsert({
          id: tenantId || '1',
          tenant_id: tenantId,
          ...settings,
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      if (data) setSettings({
        ...defaultSettings,
        ...(data as any),
        schedule_mode: (data.schedule_mode || 'interval') as Settings['schedule_mode'],
        manual_hours: (data.manual_hours || []) as string[],
        section_colors: (data.section_colors || null) as SectionColors | null,
        feature_tags: (data.feature_tags || null) as Settings['feature_tags'],
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  }

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
