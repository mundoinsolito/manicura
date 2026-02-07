import { useState, useEffect } from 'react';
import { supabase, Settings } from '@/lib/supabase';

const defaultFeatureTags = [
  { id: '1', title: 'Calidad Premium', description: 'Productos de primera calidad para el mejor resultado', enabled: true },
  { id: '2', title: 'Atención Personalizada', description: 'Cada clienta es única, cada servicio es especial', enabled: true },
  { id: '3', title: 'Reserva Fácil', description: 'Agenda tu cita en segundos desde tu celular', enabled: true },
];

const defaultSettings: Settings = {
  id: '1',
  business_name: 'Nails Clara',
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
  feature_tags: defaultFeatureTags,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) {
        console.log('Settings not found, using defaults');
        setSettings(defaultSettings);
      } else if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          schedule_mode: data.schedule_mode || 'interval',
          manual_hours: data.manual_hours || [],
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
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          id: '1',
          ...settings,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setSettings({
        ...defaultSettings,
        ...data,
        schedule_mode: data.schedule_mode || 'interval',
        manual_hours: data.manual_hours || [],
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  }

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
