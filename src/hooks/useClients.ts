import { useState, useEffect, useCallback } from 'react';
import { supabase, Client } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

export function useClients() {
  const { tenantId } = useTenant();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase
        .from('clients')
        .select('*') as any)
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function addClient(client: Omit<Client, 'id' | 'created_at'>) {
    try {
      const { data, error } = await (supabase
        .from('clients')
        .insert({ ...client, tenant_id: tenantId } as any)
        .select()
        .single() as any);
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
      if (data) setClients(clients.map(c => c.id === id ? data : c));
      return { success: true, data };
    } catch (error) {
      console.error('Error updating client:', error);
      return { success: false, error };
    }
  }

  async function deleteClient(id: string) {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(clients.filter(c => c.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  }

  async function findClientByPhone(phone: string): Promise<Client | null> {
    const { data, error } = await (supabase
      .from('clients')
      .select('*') as any)
      .eq('phone', phone)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return null;
    return data;
  }

  async function findClientByCedula(cedula: string): Promise<Client | null> {
    const { data, error } = await (supabase
      .from('clients')
      .select('*') as any)
      .eq('cedula', cedula)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return null;
    return data;
  }

  return { clients, loading, addClient, updateClient, deleteClient, findClientByPhone, findClientByCedula, refetch: fetchClients };
}
