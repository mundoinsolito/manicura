import { useState, useEffect, useCallback } from 'react';
import { supabase, Appointment } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

export function useAppointments() {
  const { tenantId } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase
        .from('appointments')
        .select('*, client:clients(*), service:services(*)') as any)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function addAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'client' | 'service'>) {
    try {
      const { data, error } = await (supabase
        .from('appointments')
        .insert({ ...appointment, tenant_id: tenantId } as any)
        .select('*, client:clients(*), service:services(*)')
        .single() as any);
      if (error) throw error;
      if (data) setAppointments([...appointments, data as Appointment]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding appointment:', error);
      return { success: false, error };
    }
  }

  async function updateAppointment(id: string, updates: Partial<Appointment>) {
    try {
      const { data, error } = await (supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select('*, client:clients(*), service:services(*)')
        .single() as any);
      if (error) throw error;
      if (data) setAppointments(appointments.map(a => a.id === id ? (data as Appointment) : a));
      return { success: true, data };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { success: false, error };
    }
  }

  async function deleteAppointment(id: string) {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      setAppointments(appointments.filter(a => a.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { success: false, error };
    }
  }

  async function getAppointmentsForDate(date: string) {
    const { data, error } = await (supabase
      .from('appointments')
      .select('*, client:clients(*), service:services(*)') as any)
      .eq('date', date)
      .eq('tenant_id', tenantId)
      .order('time', { ascending: true });
    if (error) return [];
    return data || [];
  }

  return { appointments, loading, addAppointment, updateAppointment, deleteAppointment, getAppointmentsForDate, refetch: fetchAppointments };
}
