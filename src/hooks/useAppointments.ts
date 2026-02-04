import { useState, useEffect, useCallback } from 'react';
import { supabase, Appointment } from '@/lib/supabase';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          service:services(*)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function addAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'client' | 'service'>) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select(`
          *,
          client:clients(*),
          service:services(*)
        `)
        .single();

      if (error) throw error;
      if (data) setAppointments([...appointments, data]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding appointment:', error);
      return { success: false, error };
    }
  }

  async function updateAppointment(id: string, updates: Partial<Appointment>) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          service:services(*)
        `)
        .single();

      if (error) throw error;
      if (data) {
        setAppointments(appointments.map(a => a.id === id ? data : a));
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { success: false, error };
    }
  }

  async function deleteAppointment(id: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAppointments(appointments.filter(a => a.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { success: false, error };
    }
  }

  async function getAppointmentsForDate(date: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        service:services(*)
      `)
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments for date:', error);
      return [];
    }
    return data || [];
  }

  return { 
    appointments, 
    loading, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    getAppointmentsForDate,
    refetch: fetchAppointments 
  };
}
