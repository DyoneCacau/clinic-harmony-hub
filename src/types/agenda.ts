import { Clinic } from './clinic';

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  crm?: string;
  cro?: string;
}

export interface AgendaAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  patientId: string;
  patientName: string;
  professional: Professional;
  procedure: string;
  status: 'confirmed' | 'pending' | 'return' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes?: string;
  clinic: Clinic;
}

export type AgendaView = 'day' | 'week' | 'month';
