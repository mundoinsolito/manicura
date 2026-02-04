import { useState, useEffect, useCallback } from 'react';
import { supabase, Promotion } from '@/lib/supabase';

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  async function addPromotion(promotion: Omit<Promotion, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert(promotion)
        .select()
        .single();

      if (error) throw error;
      if (data) setPromotions([data, ...promotions]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding promotion:', error);
      return { success: false, error };
    }
  }

  async function updatePromotion(id: string, updates: Partial<Promotion>) {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPromotions(promotions.map(p => p.id === id ? data : p));
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating promotion:', error);
      return { success: false, error };
    }
  }

  async function deletePromotion(id: string) {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPromotions(promotions.filter(p => p.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting promotion:', error);
      return { success: false, error };
    }
  }

  const activePromotions = promotions.filter(p => {
    if (!p.is_active) return false;
    const now = new Date();
    const validFrom = new Date(p.valid_from);
    const validUntil = new Date(p.valid_until);
    return now >= validFrom && now <= validUntil;
  });

  return { 
    promotions, 
    activePromotions,
    loading, 
    addPromotion, 
    updatePromotion, 
    deletePromotion, 
    refetch: fetchPromotions 
  };
}
