import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useClinic() {
  const { user } = useAuth();

  const { data: clinic, isLoading, error } = useQuery({
    queryKey: ['clinic', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: clinicUser, error: clinicUserError } = await supabase
        .from('clinic_users')
        .select('clinic_id, is_owner, clinics(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clinicUserError) throw clinicUserError;
      if (!clinicUser) return null;

      return {
        ...clinicUser.clinics,
        isOwner: clinicUser.is_owner,
      };
    },
    enabled: !!user?.id,
  });

  return {
    clinic,
    clinicId: clinic?.id,
    isOwner: clinic?.isOwner,
    isLoading,
    error,
  };
}

export function useClinics() {
  const { data: clinics, isLoading, error } = useQuery({
    queryKey: ['all-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  return { clinics: clinics || [], isLoading, error };
}
