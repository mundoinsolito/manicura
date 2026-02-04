import { useState, useEffect, useCallback } from 'react';
import { supabase, Service } from '@/lib/supabase';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  async function addService(service: Omit<Service, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();

      if (error) throw error;
      if (data) setServices([...services, data]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding service:', error);
      return { success: false, error };
    }
  }

  async function updateService(id: string, updates: Partial<Service>) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setServices(services.map(s => s.id === id ? data : s));
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating service:', error);
      return { success: false, error };
    }
  }

  async function deleteService(id: string) {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServices(services.filter(s => s.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error };
    }
  }

  return { 
    services, 
    loading, 
    addService, 
    updateService, 
    deleteService, 
    refetch: fetchServices 
  };
}
