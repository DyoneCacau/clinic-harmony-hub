import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from './useClinic';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TransactionData {
  id: string;
  clinic_id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  category: string | null;
  payment_method: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactions(dateFilter?: string) {
  const { clinicId } = useClinic();

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', clinicId, dateFilter],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        const startOfDay = `${dateFilter}T00:00:00`;
        const endOfDay = `${dateFilter}T23:59:59`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicId,
  });

  return { 
    transactions: transactions || [], 
    isLoading, 
    error,
    refetch 
  };
}

export function useTodayTransactions() {
  const today = new Date().toISOString().split('T')[0];
  return useTransactions(today);
}

export function useFinancialSummary() {
  const { clinicId } = useClinic();

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['financial-summary', clinicId],
    queryFn: async () => {
      if (!clinicId) return null;

      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('type, amount, payment_method')
        .eq('clinic_id', clinicId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) throw error;

      const transactions = data || [];
      
      let totalIncome = 0;
      let totalExpense = 0;
      let totalCash = 0;
      let totalCredit = 0;
      let totalDebit = 0;
      let totalPix = 0;

      transactions.forEach((t) => {
        if (t.type === 'income') {
          totalIncome += Number(t.amount);
          switch (t.payment_method) {
            case 'cash': totalCash += Number(t.amount); break;
            case 'credit': totalCredit += Number(t.amount); break;
            case 'debit': totalDebit += Number(t.amount); break;
            case 'pix': totalPix += Number(t.amount); break;
          }
        } else {
          totalExpense += Number(t.amount);
        }
      });

      return {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        totalCash,
        totalCredit,
        totalDebit,
        totalPix,
        transactionCount: transactions.length,
      };
    },
    enabled: !!clinicId,
  });

  return { summary, isLoading, error };
}

export function useTransactionMutations() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();
  const { user } = useAuth();

  const createTransaction = useMutation({
    mutationFn: async (data: Partial<Omit<TransactionData, 'id' | 'clinic_id' | 'user_id' | 'created_at' | 'updated_at'>> & { type: string; amount: number }) => {
      if (!clinicId) throw new Error('Clínica não encontrada');
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: transaction, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...data,
          clinic_id: clinicId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transação registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast.error('Erro ao registrar transação');
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TransactionData> & { id: string }) => {
      const { data: transaction, error } = await supabase
        .from('financial_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transação atualizada!');
    },
    onError: (error) => {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    },
  });

  return { createTransaction, updateTransaction };
}
