import { useState, useEffect, useCallback } from 'react';
import { supabase, Client } from '@/lib/supabase';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function addClient(client: Omit<Client, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      if (data) setClients([...clients, data]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding client:', error);
      return { success: false, error };
    }
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setClients(clients.map(c => c.id === id ? data : c));
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating client:', error);
      return { success: false, error };
    }
  }

  async function deleteClient(id: string) {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setClients(clients.filter(c => c.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  }

  async function findClientByPhone(phone: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) return null;
    return data;
  }

  async function findClientByCedula(cedula: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('cedula', cedula)
      .single();

    if (error) return null;
    return data;
  }

  return { 
    clients, 
    loading, 
    addClient, 
    updateClient, 
    deleteClient, 
    findClientByPhone,
    findClientByCedula,
    refetch: fetchClients 
  };
}
