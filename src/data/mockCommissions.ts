import { CommissionRule, CommissionCalculation, ProcedurePrice, CommissionSummary } from '@/types/commission';

export const mockProcedurePrices: ProcedurePrice[] = [
  { id: 'proc1', clinicId: 'clinic1', name: 'Consulta Geral', price: 150, category: 'Consulta', isActive: true },
  { id: 'proc2', clinicId: 'clinic1', name: 'Retorno', price: 80, category: 'Consulta', isActive: true },
  { id: 'proc3', clinicId: 'clinic1', name: 'Exame de Sangue', price: 120, category: 'Exame', isActive: true },
  { id: 'proc4', clinicId: 'clinic1', name: 'Ecocardiograma', price: 350, category: 'Exame', isActive: true },
  { id: 'proc5', clinicId: 'clinic2', name: 'Limpeza Dental', price: 200, category: 'Procedimento', isActive: true },
  { id: 'proc6', clinicId: 'clinic2', name: 'Clareamento', price: 800, category: 'Procedimento', isActive: true },
  { id: 'proc7', clinicId: 'clinic2', name: 'Extração', price: 250, category: 'Procedimento', isActive: true },
  { id: 'proc8', clinicId: 'clinic2', name: 'Avaliação Ortodôntica', price: 180, category: 'Consulta', isActive: true },
  { id: 'proc9', clinicId: 'clinic3', name: 'Consulta Pré-Natal', price: 200, category: 'Consulta', isActive: true },
  { id: 'proc10', clinicId: 'clinic3', name: 'Ultrassom', price: 280, category: 'Exame', isActive: true },
  { id: 'proc11', clinicId: 'clinic3', name: 'Avaliação Diabética', price: 180, category: 'Consulta', isActive: true },
];

export const mockCommissionRules: CommissionRule[] = [
  // Regra geral da clínica 1 - 30% para todos
  {
    id: 'cr1',
    clinicId: 'clinic1',
    professionalId: 'all',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    value: 30,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    notes: 'Comissão padrão para todos os profissionais',
  },
  // Regra específica para Dr. Carlos - 40% em exames
  {
    id: 'cr2',
    clinicId: 'clinic1',
    professionalId: 'prof1',
    procedure: 'Exame de Sangue',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    value: 40,
    isActive: true,
    priority: 10,
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
    notes: 'Comissão especial para exames de sangue',
  },
  // Regra para sábados - valor fixo R$50 por atendimento
  {
    id: 'cr3',
    clinicId: 'clinic1',
    professionalId: 'all',
    procedure: 'all',
    dayOfWeek: 'saturday',
    calculationType: 'fixed',
    value: 50,
    isActive: true,
    priority: 5,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
    notes: 'Adicional fixo para plantões aos sábados',
  },
  // Clínica odontológica - 35% para procedimentos
  {
    id: 'cr4',
    clinicId: 'clinic2',
    professionalId: 'all',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    value: 35,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  // Dra. Ana Costa - 45% em clareamento
  {
    id: 'cr5',
    clinicId: 'clinic2',
    professionalId: 'prof2',
    procedure: 'Clareamento',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    value: 45,
    isActive: true,
    priority: 10,
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
    notes: 'Comissão especial para clareamentos',
  },
  // Centro Médico Jardins - 25% padrão
  {
    id: 'cr6',
    clinicId: 'clinic3',
    professionalId: 'all',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    value: 25,
    isActive: true,
    priority: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  // Regra desativada de exemplo
  {
    id: 'cr7',
    clinicId: 'clinic1',
    professionalId: 'prof3',
    procedure: 'Ecocardiograma',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    value: 50,
    isActive: false,
    priority: 10,
    createdAt: '2025-01-12T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Regra suspensa temporariamente',
  },
];

export const mockCommissionCalculations: CommissionCalculation[] = [
  {
    id: 'calc1',
    appointmentId: 'ag1',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Consulta Geral',
    serviceValue: 150,
    commissionRuleId: 'cr1',
    calculationType: 'percentage',
    ruleValue: 30,
    commissionAmount: 45,
    date: '2025-01-20',
    status: 'paid',
    paidAt: '2025-01-20T18:00:00Z',
    transactionId: 'tr1',
  },
  {
    id: 'calc2',
    appointmentId: 'ag2',
    professionalId: 'prof2',
    professionalName: 'Dra. Ana Costa',
    clinicId: 'clinic2',
    clinicName: 'Consultório Odontológico Sorriso',
    procedure: 'Limpeza Dental',
    serviceValue: 200,
    commissionRuleId: 'cr4',
    calculationType: 'percentage',
    ruleValue: 35,
    commissionAmount: 70,
    date: '2025-01-20',
    status: 'pending',
  },
  {
    id: 'calc3',
    appointmentId: 'ag3',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Retorno',
    serviceValue: 80,
    commissionRuleId: 'cr1',
    calculationType: 'percentage',
    ruleValue: 30,
    commissionAmount: 24,
    date: '2025-01-20',
    status: 'paid',
    paidAt: '2025-01-20T18:00:00Z',
    transactionId: 'tr2',
  },
  {
    id: 'calc4',
    appointmentId: 'ag4',
    professionalId: 'prof2',
    professionalName: 'Dra. Ana Costa',
    clinicId: 'clinic2',
    clinicName: 'Consultório Odontológico Sorriso',
    procedure: 'Clareamento',
    serviceValue: 800,
    commissionRuleId: 'cr5',
    calculationType: 'percentage',
    ruleValue: 45,
    commissionAmount: 360,
    date: '2025-01-21',
    status: 'pending',
  },
  {
    id: 'calc5',
    appointmentId: 'ag5',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Exame de Sangue',
    serviceValue: 120,
    commissionRuleId: 'cr2',
    calculationType: 'percentage',
    ruleValue: 40,
    commissionAmount: 48,
    date: '2025-01-22',
    status: 'pending',
  },
];

// Função para calcular comissão baseada nas regras
export function calculateCommission(
  rules: CommissionRule[],
  professionalId: string,
  procedure: string,
  serviceValue: number,
  date: Date
): { rule: CommissionRule | null; amount: number } {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as CommissionRule['dayOfWeek'];

  // Filtra regras aplicáveis e ordena por prioridade (maior primeiro)
  const applicableRules = rules
    .filter(rule => {
      if (!rule.isActive) return false;
      
      // Verifica profissional
      if (rule.professionalId !== 'all' && rule.professionalId !== professionalId) return false;
      
      // Verifica procedimento
      if (rule.procedure !== 'all' && rule.procedure !== procedure) return false;
      
      // Verifica dia da semana
      if (rule.dayOfWeek !== 'all' && rule.dayOfWeek !== dayOfWeek) return false;
      
      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  if (applicableRules.length === 0) {
    return { rule: null, amount: 0 };
  }

  const rule = applicableRules[0];
  let amount: number;

  if (rule.calculationType === 'percentage') {
    amount = (serviceValue * rule.value) / 100;
  } else {
    amount = rule.value;
  }

  return { rule, amount };
}

// Função para gerar resumo de comissões por profissional
export function generateCommissionSummary(calculations: CommissionCalculation[]): CommissionSummary[] {
  const summaryMap = new Map<string, CommissionSummary>();

  calculations.forEach(calc => {
    const existing = summaryMap.get(calc.professionalId);
    
    if (existing) {
      existing.totalServices++;
      existing.totalRevenue += calc.serviceValue;
      existing.totalCommission += calc.commissionAmount;
      if (calc.status === 'pending') {
        existing.pendingCommission += calc.commissionAmount;
      } else if (calc.status === 'paid') {
        existing.paidCommission += calc.commissionAmount;
      }
    } else {
      summaryMap.set(calc.professionalId, {
        professionalId: calc.professionalId,
        professionalName: calc.professionalName,
        totalServices: 1,
        totalRevenue: calc.serviceValue,
        totalCommission: calc.commissionAmount,
        pendingCommission: calc.status === 'pending' ? calc.commissionAmount : 0,
        paidCommission: calc.status === 'paid' ? calc.commissionAmount : 0,
        averageCommissionRate: 0,
      });
    }
  });

  // Calcula taxa média
  summaryMap.forEach(summary => {
    if (summary.totalRevenue > 0) {
      summary.averageCommissionRate = (summary.totalCommission / summary.totalRevenue) * 100;
    }
  });

  return Array.from(summaryMap.values());
}
