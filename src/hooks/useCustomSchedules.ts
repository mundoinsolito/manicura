import { useState, useEffect, useCallback } from 'react';
import { supabase, CustomSchedule } from '@/lib/supabase';

export function useCustomSchedules() {
  const [customSchedules, setCustomSchedules] = useState<CustomSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomSchedules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_schedules')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        // Table might not exist yet
        console.log('Custom schedules table not available yet');
        setCustomSchedules([]);
      } else {
        setCustomSchedules(data || []);
      }
    } catch (error) {
      console.error('Error fetching custom schedules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomSchedules();
  }, [fetchCustomSchedules]);

  async function setScheduleForDate(date: string, hours: string[]) {
    try {
      // Check if schedule exists for this date
      const existing = customSchedules.find(cs => cs.date === date);

      if (hours.length === 0) {
        // Remove custom schedule
        if (existing) {
          const { error } = await supabase
            .from('custom_schedules')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
          setCustomSchedules(customSchedules.filter(cs => cs.id !== existing.id));
        }
        return { success: true };
      }

      if (existing) {
        const { data, error } = await supabase
          .from('custom_schedules')
          .update({ hours })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        if (data) setCustomSchedules(customSchedules.map(cs => cs.id === existing.id ? data : cs));
      } else {
        const { data, error } = await supabase
          .from('custom_schedules')
          .insert({ date, hours })
          .select()
          .single();
        if (error) throw error;
        if (data) setCustomSchedules([...customSchedules, data]);
      }
      return { success: true };
    } catch (error) {
      console.error('Error setting custom schedule:', error);
      return { success: false, error };
    }
  }

  function getScheduleForDate(date: string): string[] | null {
    const schedule = customSchedules.find(cs => cs.date === date);
    return schedule ? schedule.hours : null;
  }

  return {
    customSchedules,
    loading,
    setScheduleForDate,
    getScheduleForDate,
    refetch: fetchCustomSchedules,
  };
}
