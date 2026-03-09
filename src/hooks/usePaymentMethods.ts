import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  details: Record<string, string>;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
}

export function usePaymentMethods(onlyActive = false) {
  return useQuery({
    queryKey: ['payment_methods', onlyActive],
    queryFn: async () => {
      let q = (supabase as any).from('payment_methods').select('*').order('sort_order');
      if (onlyActive) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (method: Omit<PaymentMethod, 'id' | 'created_at'>) => {
      const { error } = await (supabase as any).from('payment_methods').insert(method);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_methods'] }),
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const { error } = await (supabase as any).from('payment_methods').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_methods'] }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('payment_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_methods'] }),
  });
}
