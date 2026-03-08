import { useState, useEffect, useCallback } from 'react';
import { supabase, BlockedTime } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

export function useBlockedTimes() {
  const { tenantId } = useTenant();
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedTimes = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase
        .from('blocked_times')
        .select('*') as any)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: true });
      if (error) throw error;
      setBlockedTimes(data || []);
    } catch (error) {
      console.error('Error fetching blocked times:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchBlockedTimes(); }, [fetchBlockedTimes]);

  async function addBlockedTime(bt: Omit<BlockedTime, 'id' | 'created_at'>) {
    try {
      const { data, error } = await (supabase
        .from('blocked_times')
        .insert({ ...bt, tenant_id: tenantId } as any)
        .select()
        .single() as any);
      if (error) throw error;
      if (data) setBlockedTimes([...blockedTimes, data]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding blocked time:', error);
      return { success: false, error };
    }
  }

  async function deleteBlockedTime(id: string) {
    try {
      const { error } = await supabase.from('blocked_times').delete().eq('id', id);
      if (error) throw error;
      setBlockedTimes(blockedTimes.filter(bt => bt.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting blocked time:', error);
      return { success: false, error };
    }
  }

  function isTimeBlocked(date: string, time: string): boolean {
    return blockedTimes.some(bt => bt.date === date && time >= bt.start_time && time < bt.end_time);
  }

  return { blockedTimes, loading, addBlockedTime, deleteBlockedTime, isTimeBlocked, refetch: fetchBlockedTimes };
}
