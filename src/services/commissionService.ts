import { CommissionRule, CommissionCalculation, CalculationType, BeneficiaryType, calculateAutoPriority } from '@/types/commission';
import { Transaction } from '@/types/financial';
import { AgendaAppointment } from '@/types/agenda';
import { mockCommissionRules, mockProcedurePrices, mockStaffMembers } from '@/data/mockCommissions';

export interface CompleteAppointmentResult {
  commissions: CommissionCalculation[];
  incomeTransaction: Transaction;
  commissionTransactions: Transaction[];
}

/**
 * Finds all applicable commission rules for an appointment (professional + staff)
 */
export function findApplicableRules(
  rules: CommissionRule[],
  professionalId: string,
  clinicId: string,
  procedure: string,
  date: Date
): CommissionRule[] {
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

  // Group by beneficiary type and get best rule for each
  const rulesByBeneficiary = new Map<string, CommissionRule>();
  
  applicableRules.forEach(rule => {
    const key = `${rule.beneficiaryType}-${rule.beneficiaryId || 'general'}`;
    if (!rulesByBeneficiary.has(key)) {
      rulesByBeneficiary.set(key, rule);
    }
  });

  return Array.from(rulesByBeneficiary.values());
}

/**
 * Legacy function for backward compatibility
 */
export function findApplicableRule(
  rules: CommissionRule[],
  professionalId: string,
  clinicId: string,
  procedure: string,
  date: Date
): CommissionRule | null {
  const allRules = findApplicableRules(rules, professionalId, clinicId, procedure, date);
  // Return the professional rule
  return allRules.find(r => r.beneficiaryType === 'professional') || null;
}

/**
 * Calculates commission amount based on the rule and quantity
 */
export function calculateCommissionAmount(
  rule: CommissionRule,
  serviceValue: number,
  quantity: number = 1
): number {
  if (rule.calculationType === 'percentage') {
    return (serviceValue * rule.value) / 100;
  }
  
  // Fixed value - multiply by quantity for unit-based calculations
  if (rule.calculationUnit !== 'appointment') {
    return rule.value * quantity;
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
 * Now supports multiple commissions (professional + seller + reception)
 */
export function completeAppointment(
  appointment: AgendaAppointment,
  serviceValue: number,
  paymentMethod: Transaction['paymentMethod'],
  rules: CommissionRule[] = mockCommissionRules,
  quantity: number = 1,
  sellerId?: string,
  receptionistId?: string
): CompleteAppointmentResult {
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);

  // Find all applicable commission rules
  const applicableRules = findApplicableRules(
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

  const commissions: CommissionCalculation[] = [];
  const commissionTransactions: Transaction[] = [];

  applicableRules.forEach((rule, index) => {
    // Skip staff rules if no staff is assigned
    if (rule.beneficiaryType === 'seller' && !sellerId && !rule.beneficiaryId) return;
    if (rule.beneficiaryType === 'reception' && !receptionistId && !rule.beneficiaryId) return;

    const commissionAmount = calculateCommissionAmount(rule, serviceValue, quantity);
    
    // Determine beneficiary info
    let beneficiaryId = rule.beneficiaryId;
    let beneficiaryName = rule.beneficiaryName;
    
    if (rule.beneficiaryType === 'seller' && sellerId) {
      const seller = mockStaffMembers.find(s => s.id === sellerId);
      beneficiaryId = sellerId;
      beneficiaryName = seller?.name || 'Vendedor';
    } else if (rule.beneficiaryType === 'reception' && receptionistId) {
      const receptionist = mockStaffMembers.find(s => s.id === receptionistId);
      beneficiaryId = receptionistId;
      beneficiaryName = receptionist?.name || 'Recepcionista';
    }

    // Create commission calculation record
    const commission: CommissionCalculation = {
      id: `calc${Date.now()}_${index}`,
      appointmentId: appointment.id,
      professionalId: appointment.professional.id,
      professionalName: appointment.professional.name,
      beneficiaryType: rule.beneficiaryType,
      beneficiaryId,
      beneficiaryName,
      clinicId: appointment.clinic.id,
      clinicName: appointment.clinic.name,
      procedure: appointment.procedure,
      serviceValue,
      quantity,
      commissionRuleId: rule.id,
      calculationType: rule.calculationType,
      calculationUnit: rule.calculationUnit,
      ruleValue: rule.value,
      commissionAmount,
      date: dateStr,
      status: 'pending',
    };
    
    commissions.push(commission);

    // Create commission expense transaction
    const displayName = beneficiaryName || appointment.professional.name;
    const unitLabel = rule.calculationUnit !== 'appointment' ? ` (${quantity}x)` : '';
    
    const commissionTransaction: Transaction = {
      id: `tr${Date.now() + index + 1}`,
      type: 'expense',
      description: `Comissão ${displayName} - ${appointment.procedure}${unitLabel}`,
      amount: commissionAmount,
      paymentMethod: 'cash',
      category: 'Comissão',
      date: dateStr,
      time: timeStr,
      userId: 'user1',
      userName: 'Sistema',
      notes: `Ref. atendimento ${appointment.id} | Tipo: ${rule.beneficiaryType} | Regra: ${rule.calculationType === 'percentage' ? `${rule.value}%` : `R$ ${rule.value}/${rule.calculationUnit}`}`,
    };
    
    commissionTransactions.push(commissionTransaction);
  });

  return {
    commissions,
    incomeTransaction,
    commissionTransactions,
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
  
  const unitLabel = rule.calculationUnit === 'appointment' ? '' : `/${rule.calculationUnit}`;
  return `R$ ${rule.value.toFixed(2)}${unitLabel}`;
}

/**
 * Gets available staff members by role
 */
export function getStaffByRole(role: BeneficiaryType, clinicId?: string): typeof mockStaffMembers {
  return mockStaffMembers.filter(s => 
    s.role === role && 
    s.isActive && 
    (!clinicId || s.clinicId === clinicId)
  );
}
