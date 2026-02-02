import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from './useClinic';
import { toast } from 'sonner';

export interface AppointmentData {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  procedure: string;
  status: string;
  payment_status: string;
  notes: string | null;
  seller_id: string | null;
  lead_source: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: {
    id: string;
    name: string;
    phone: string | null;
  };
  professional?: {
    id: string;
    name: string;
    specialty: string;
    cro: string;
  };
}

export function useAppointments(dateFilter?: string) {
  const { clinicId } = useClinic();

  const { data: appointments, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments', clinicId, dateFilter],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, phone),
          professional:professionals(id, name, specialty, cro)
        `)
        .eq('clinic_id', clinicId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (dateFilter) {
        query = query.eq('date', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicId,
  });

  return { 
    appointments: appointments || [], 
    isLoading, 
    error,
    refetch 
  };
}

export function useTodayAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return useAppointments(today);
}

export function useAppointmentMutations() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  const createAppointment = useMutation({
    mutationFn: async (data: Omit<AppointmentData, 'id' | 'clinic_id' | 'created_at' | 'updated_at' | 'patient' | 'professional'>) => {
      if (!clinicId) throw new Error('Clínica não encontrada');

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          ...data,
          clinic_id: clinicId,
        })
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao criar agendamento');
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AppointmentData> & { id: string }) => {
      // Remove joined data before update
      const { patient, professional, ...updateData } = data as any;
      
      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Agendamento atualizado!');
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Agendamento removido!');
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast.error('Erro ao remover agendamento');
    },
  });

  return { createAppointment, updateAppointment, deleteAppointment };
}
