import { useState, useEffect, useCallback } from 'react';
import { supabase, CustomSchedule } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

export function useCustomSchedules() {
  const { tenantId } = useTenant();
  const [customSchedules, setCustomSchedules] = useState<CustomSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomSchedules = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase
        .from('custom_schedules')
        .select('*') as any)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: true });
      if (error) {
        setCustomSchedules([]);
      } else {
        setCustomSchedules((data || []) as CustomSchedule[]);
      }
    } catch (error) {
      console.error('Error fetching custom schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchCustomSchedules(); }, [fetchCustomSchedules]);

  async function setScheduleForDate(date: string, hours: string[]) {
    try {
      const existing = customSchedules.find(cs => cs.date === date);
      if (hours.length === 0) {
        if (existing) {
          const { error } = await supabase.from('custom_schedules').delete().eq('id', existing.id);
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
        if (data) setCustomSchedules(customSchedules.map(cs => cs.id === existing.id ? (data as CustomSchedule) : cs));
      } else {
        const { data, error } = await (supabase
          .from('custom_schedules')
          .insert({ date, hours, tenant_id: tenantId } as any)
          .select()
          .single() as any);
        if (error) throw error;
        if (data) setCustomSchedules([...customSchedules, data as CustomSchedule]);
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

  return { customSchedules, loading, setScheduleForDate, getScheduleForDate, refetch: fetchCustomSchedules };
}
