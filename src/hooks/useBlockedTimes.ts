import { useState, useEffect, useCallback } from 'react';
import { supabase, BlockedTime } from '@/lib/supabase';

export function useBlockedTimes() {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedTimes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setBlockedTimes(data || []);
    } catch (error) {
      console.error('Error fetching blocked times:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedTimes();
  }, [fetchBlockedTimes]);

  async function addBlockedTime(blockedTime: Omit<BlockedTime, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .insert(blockedTime)
        .select()
        .single();

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
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBlockedTimes(blockedTimes.filter(bt => bt.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting blocked time:', error);
      return { success: false, error };
    }
  }

  function isTimeBlocked(date: string, time: string): boolean {
    return blockedTimes.some(bt => {
      if (bt.date !== date) return false;
      return time >= bt.start_time && time < bt.end_time;
    });
  }

  return { 
    blockedTimes, 
    loading, 
    addBlockedTime, 
    deleteBlockedTime, 
    isTimeBlocked,
    refetch: fetchBlockedTimes 
  };
}
