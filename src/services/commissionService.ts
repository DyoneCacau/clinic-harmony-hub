import { CommissionRule, CommissionCalculation, CalculationType } from '@/types/commission';
import { Transaction } from '@/types/financial';
import { AgendaAppointment } from '@/types/agenda';
import { mockCommissionRules, mockProcedurePrices } from '@/data/mockCommissions';

export interface CompleteAppointmentResult {
  commission: CommissionCalculation | null;
  incomeTransaction: Transaction;
  commissionTransaction: Transaction | null;
}

/**
 * Finds the best matching commission rule for an appointment
 */
export function findApplicableRule(
  rules: CommissionRule[],
  professionalId: string,
  clinicId: string,
  procedure: string,
  date: Date
): CommissionRule | null {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    date.getDay()
  ] as CommissionRule['dayOfWeek'];

  // Filter applicable rules and sort by priority (higher first)
  const applicableRules = rules
    .filter((rule) => {
      if (!rule.isActive) return false;
      if (rule.clinicId !== clinicId) return false;

      // Check professional match
      if (rule.professionalId !== 'all' && rule.professionalId !== professionalId) return false;

      // Check procedure match
      if (rule.procedure !== 'all' && rule.procedure !== procedure) return false;

      // Check day of week match
      if (rule.dayOfWeek !== 'all' && rule.dayOfWeek !== dayOfWeek) return false;

      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  return applicableRules[0] || null;
}

/**
 * Calculates commission amount based on the rule
 */
export function calculateCommissionAmount(
  rule: CommissionRule,
  serviceValue: number
): number {
  if (rule.calculationType === 'percentage') {
    return (serviceValue * rule.value) / 100;
  }
  return rule.value;
}

/**
 * Gets the price for a procedure from the price table
 */
export function getProcedurePrice(
  procedure: string,
  clinicId: string
): number {
  const priceEntry = mockProcedurePrices.find(
    (p) => p.name === procedure && p.clinicId === clinicId && p.isActive
  );
  
  if (priceEntry) {
    return priceEntry.price;
  }
  
  // Fallback: try to find by similar name
  const similarEntry = mockProcedurePrices.find(
    (p) => p.name.toLowerCase().includes(procedure.toLowerCase()) && p.isActive
  );
  
  // Return default price if not found
  return similarEntry?.price || 150;
}

/**
 * Completes an appointment and generates all related financial entries
 */
export function completeAppointment(
  appointment: AgendaAppointment,
  serviceValue: number,
  paymentMethod: Transaction['paymentMethod'],
  rules: CommissionRule[] = mockCommissionRules
): CompleteAppointmentResult {
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);

  // Find applicable commission rule
  const rule = findApplicableRule(
    rules,
    appointment.professional.id,
    appointment.clinic.id,
    appointment.procedure,
    appointmentDate
  );

  // Create income transaction
  const incomeTransaction: Transaction = {
    id: `tr${Date.now()}`,
    type: 'income',
    description: `${appointment.procedure} - ${appointment.patientName}`,
    amount: serviceValue,
    paymentMethod,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    appointmentId: appointment.id,
    category: 'Procedimento',
    date: dateStr,
    time: timeStr,
    userId: 'user1',
    userName: 'Recepcionista Ana',
  };

  let commission: CommissionCalculation | null = null;
  let commissionTransaction: Transaction | null = null;

  if (rule) {
    const commissionAmount = calculateCommissionAmount(rule, serviceValue);

    // Create commission calculation record
    commission = {
      id: `calc${Date.now()}`,
      appointmentId: appointment.id,
      professionalId: appointment.professional.id,
      professionalName: appointment.professional.name,
      clinicId: appointment.clinic.id,
      clinicName: appointment.clinic.name,
      procedure: appointment.procedure,
      serviceValue,
      commissionRuleId: rule.id,
      calculationType: rule.calculationType,
      ruleValue: rule.value,
      commissionAmount,
      date: dateStr,
      status: 'pending',
    };

    // Create commission expense transaction (to be paid to professional)
    commissionTransaction = {
      id: `tr${Date.now() + 1}`,
      type: 'expense',
      description: `Comissão ${appointment.professional.name} - ${appointment.procedure}`,
      amount: commissionAmount,
      paymentMethod: 'cash', // Default, will be paid later
      category: 'Comissão',
      date: dateStr,
      time: timeStr,
      userId: 'user1',
      userName: 'Sistema',
      notes: `Ref. atendimento ${appointment.id} | Regra: ${rule.calculationType === 'percentage' ? `${rule.value}%` : `R$ ${rule.value}`}`,
    };
  }

  return {
    commission,
    incomeTransaction,
    commissionTransaction,
  };
}

/**
 * Formats commission info for display
 */
export function formatCommissionInfo(rule: CommissionRule | null): string {
  if (!rule) {
    return 'Sem regra de comissão aplicável';
  }

  if (rule.calculationType === 'percentage') {
    return `${rule.value}% do valor`;
  }
  return `R$ ${rule.value.toFixed(2)} fixo`;
}
