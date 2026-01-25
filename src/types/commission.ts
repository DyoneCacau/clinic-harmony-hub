export type CalculationType = 'percentage' | 'fixed';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'all';

export interface CommissionRule {
  id: string;
  clinicId: string;
  professionalId: string | 'all';
  procedure: string | 'all';
  dayOfWeek: DayOfWeek;
  calculationType: CalculationType;
  value: number; // percentage (0-100) or fixed amount
  isActive: boolean;
  priority: number; // higher priority rules are applied first
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface CommissionCalculation {
  id: string;
  appointmentId: string;
  professionalId: string;
  professionalName: string;
  clinicId: string;
  clinicName: string;
  procedure: string;
  serviceValue: number;
  commissionRuleId: string;
  calculationType: CalculationType;
  ruleValue: number;
  commissionAmount: number;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  transactionId?: string;
}

export interface CommissionSummary {
  professionalId: string;
  professionalName: string;
  totalServices: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  averageCommissionRate: number;
}

export interface ProcedurePrice {
  id: string;
  clinicId: string;
  name: string;
  price: number;
  category: string;
  isActive: boolean;
}

export const daysOfWeekLabels: Record<DayOfWeek, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
  all: 'Todos os dias',
};

export const calculationTypeLabels: Record<CalculationType, string> = {
  percentage: 'Percentual (%)',
  fixed: 'Valor Fixo (R$)',
};
