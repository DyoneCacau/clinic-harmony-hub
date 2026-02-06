import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from './useClinic';
import { toast } from 'sonner';
import { DentalChart, ToothRecord, ToothStatus } from '@/types/dental';

// Generate empty dental chart for a patient
export function generateEmptyDentalChart(patientId: string): DentalChart {
  const teeth: Record<number, ToothRecord> = {};
  
  // Adult teeth (permanent): 11-18, 21-28, 31-38, 41-48
  const quadrants = [
    { start: 11, end: 18 }, // Upper right
    { start: 21, end: 28 }, // Upper left
    { start: 31, end: 38 }, // Lower left
    { start: 41, end: 48 }, // Lower right
  ];

  quadrants.forEach(({ start, end }) => {
    for (let i = start; i <= end; i++) {
      teeth[i] = {
        number: i,
        status: 'healthy',
        procedures: [],
        notes: '',
      };
    }
  });

  return {
    patientId,
    teeth,
    lastUpdate: new Date().toISOString(),
  };
}

export function useDentalChart(patientId: string | undefined) {
  const { clinicId } = useClinic();

  const { data: chartData, isLoading, error, refetch } = useQuery({
    queryKey: ['dental-chart', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return null;
      
      const { data, error } = await supabase
        .from('dental_charts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return generateEmptyDentalChart(patientId);
      }

      // Transform database records into DentalChart format
      const teeth: Record<number, ToothRecord> = {};
      data.forEach(record => {
        teeth[record.tooth_number] = {
          number: record.tooth_number,
          status: record.condition as ToothStatus,
          procedures: [],
          notes: record.notes || '',
        };
      });

      // Fill missing teeth with healthy status
      const quadrants = [
        { start: 11, end: 18 },
        { start: 21, end: 28 },
        { start: 31, end: 38 },
        { start: 41, end: 48 },
      ];

      quadrants.forEach(({ start, end }) => {
        for (let i = start; i <= end; i++) {
          if (!teeth[i]) {
            teeth[i] = {
              number: i,
              status: 'healthy',
              procedures: [],
              notes: '',
            };
          }
        }
      });

      return {
        patientId,
        teeth,
        lastUpdate: data[0]?.updated_at || new Date().toISOString(),
      } as DentalChart;
    },
    enabled: !!patientId && !!clinicId,
  });

  return { 
    chart: chartData || (patientId ? generateEmptyDentalChart(patientId) : null), 
    isLoading, 
    error,
    refetch 
  };
}

export function useDentalChartMutations() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  const updateTooth = useMutation({
    mutationFn: async ({ 
      patientId, 
      toothNumber, 
      condition, 
      notes,
      professionalId 
    }: { 
      patientId: string; 
      toothNumber: number; 
      condition: string; 
      notes?: string;
      professionalId?: string;
    }) => {
      if (!clinicId) throw new Error('Clinic ID is required');
      
      // Upsert - update if exists, insert if not
      const { data, error } = await supabase
        .from('dental_charts')
        .upsert({
          patient_id: patientId,
          clinic_id: clinicId,
          tooth_number: toothNumber,
          condition,
          notes: notes || null,
          professional_id: professionalId || null,
          treatment_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'patient_id,tooth_number,clinic_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dental-chart', variables.patientId] });
      toast.success('Odontograma atualizado!');
    },
    onError: (error) => {
      console.error('Error updating tooth:', error);
      toast.error('Erro ao atualizar odontograma');
    },
  });

  const updateChart = useMutation({
    mutationFn: async ({ patientId, chart }: { patientId: string; chart: DentalChart }) => {
      if (!clinicId) throw new Error('Clinic ID is required');
      
      // Update all teeth in the chart that are not healthy or have notes
      const teethArray = Object.values(chart.teeth);
      const updates = teethArray
        .filter(tooth => tooth.status !== 'healthy' || tooth.notes)
        .map(tooth => ({
          patient_id: patientId,
          clinic_id: clinicId,
          tooth_number: tooth.number,
          condition: tooth.status,
          notes: tooth.notes || null,
          updated_at: new Date().toISOString(),
        }));

      if (updates.length === 0) return;

      const { error } = await supabase
        .from('dental_charts')
        .upsert(updates, {
          onConflict: 'patient_id,tooth_number,clinic_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dental-chart', variables.patientId] });
      toast.success('Odontograma salvo!');
    },
    onError: (error) => {
      console.error('Error saving chart:', error);
      toast.error('Erro ao salvar odontograma');
    },
  });

  return { updateTooth, updateChart };
}
