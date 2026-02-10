import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reaywgxygxnuxoqtegjs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYXl3Z3h5Z3hudXhvcXRlZ2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODMwMTAsImV4cCI6MjA4NTc1OTAxMH0.XtJ9mWvM24Q8P9pW0ocnYZN-yigafDr1ICEVU9dDANg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  cedula: string;
  email: string | null;
  health_alerts: string | null;
  preferences: string | null;
  favorite_colors: string | null;
  nail_shape: string | null;
  notes: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  client_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'full';
  payment_amount: number;
  notes: string | null;
  created_at: string;
  client?: Client;
  service?: Service;
};

export type BlockedTime = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  appointment_id: string | null;
  date: string;
  created_at: string;
};

export type FeatureTag = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type SectionColors = {
  background: string;
  foreground: string;
  card_bg: string;
  card_text: string;
  heading_color: string;
  body_text: string;
  button_bg: string;
  button_text: string;
  accent_bg: string;
  accent_text: string;
};

export type Settings = {
  id: string;
  business_name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  whatsapp_number: string;
  reservation_amount: number;
  opening_time: string;
  closing_time: string;
  time_slot_interval: number;
  schedule_mode: 'interval' | 'manual';
  manual_hours: string[];
  primary_color: string;
  accent_color: string;
  section_colors: SectionColors | null;
  feature_tags: FeatureTag[] | null;
  created_at: string;
  updated_at: string;
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  service_id: string | null;
  original_price: number | null;
  discount_percent: number | null;
  discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  service?: Service;
};

export type CustomSchedule = {
  id: string;
  date: string;
  hours: string[];
  created_at: string;
};
