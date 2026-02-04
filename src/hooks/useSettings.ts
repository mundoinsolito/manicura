import { useState, useEffect } from 'react';
import { supabase, Settings } from '@/lib/supabase';

const defaultSettings: Settings = {
  id: '1',
  business_name: 'Manicura Elegante',
  cover_image_url: null,
  whatsapp_number: '+58412000000',
  reservation_amount: 10,
  opening_time: '09:00',
  closing_time: '18:00',
  primary_color: '#d4768f',
  accent_color: '#d4a574',
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
        setSettings(data);
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
      if (data) setSettings(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  }

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
