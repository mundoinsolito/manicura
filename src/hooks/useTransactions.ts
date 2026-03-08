import { useState, useEffect, useCallback } from 'react';
import { supabase, Transaction } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

export function useTransactions() {
  const { tenantId } = useTenant();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase
        .from('transactions')
        .select('*') as any)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });
      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
    try {
      const { data, error } = await (supabase
        .from('transactions')
        .insert({ ...transaction, tenant_id: tenantId } as any)
        .select()
        .single() as any);
      if (error) throw error;
      if (data) setTransactions([data as Transaction, ...transactions]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error };
    }
  }

  async function deleteTransaction(id: string) {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error };
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return { transactions, loading, addTransaction, deleteTransaction, totalIncome, totalExpenses, netProfit, refetch: fetchTransactions };
}
