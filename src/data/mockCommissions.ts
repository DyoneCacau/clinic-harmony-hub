import { CommissionRule, CommissionCalculation, ProcedurePrice, CommissionSummary, StaffMember } from '@/types/commission';

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
  { id: 'proc12', clinicId: 'clinic2', name: 'Aplicação de Botox (ml)', price: 150, category: 'Estética', isActive: true },
  { id: 'proc13', clinicId: 'clinic2', name: 'Alinhadores (arcada)', price: 2500, category: 'Ortodontia', isActive: true },
];

// Staff members (sellers and receptionists)
export const mockStaffMembers: StaffMember[] = [
  { id: 'staff1', name: 'Ana Souza', role: 'reception', clinicId: 'clinic1', isActive: true },
  { id: 'staff2', name: 'Carlos Vendas', role: 'seller', clinicId: 'clinic1', isActive: true },
  { id: 'staff3', name: 'Mariana Atendimento', role: 'reception', clinicId: 'clinic2', isActive: true },
  { id: 'staff4', name: 'João Comercial', role: 'seller', clinicId: 'clinic2', isActive: true },
  { id: 'staff5', name: 'Patrícia Recepção', role: 'reception', clinicId: 'clinic3', isActive: true },
];

export const mockCommissionRules: CommissionRule[] = [
  // Regra geral da clínica 1 - 30% para todos os profissionais
  {
    id: 'cr1',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    procedure: 'Exame de Sangue',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 40,
    isActive: true,
    priority: 36, // Auto: 20 (prof) + 15 (proc) + 1 base
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
    notes: 'Comissão especial para exames de sangue',
  },
  // Regra para sábados - valor fixo R$50 por atendimento
  {
    id: 'cr3',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'saturday',
    calculationType: 'fixed',
    calculationUnit: 'appointment',
    value: 50,
    isActive: true,
    priority: 11, // Auto: 10 (day) + 1 base
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
    notes: 'Adicional fixo para plantões aos sábados',
  },
  // Clínica odontológica - 35% para procedimentos
  {
    id: 'cr4',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    procedure: 'Clareamento',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 45,
    isActive: true,
    priority: 36, // Auto: 20 (prof) + 15 (proc) + 1 base
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
    notes: 'Comissão especial para clareamentos',
  },
  // Centro Médico Jardins - 25% padrão
  {
    id: 'cr6',
    clinicId: 'clinic3',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    procedure: 'Ecocardiograma',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 50,
    isActive: false,
    priority: 36,
    createdAt: '2025-01-12T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Regra suspensa temporariamente',
  },
  // Comissão para recepção por agendamento
  {
    id: 'cr8',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'reception',
    beneficiaryId: 'staff1',
    beneficiaryName: 'Ana Souza',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'fixed',
    calculationUnit: 'appointment',
    value: 5,
    isActive: true,
    priority: 6, // Auto: 5 (beneficiary) + 1 base
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'R$5 por atendimento finalizado para recepção',
  },
  // Comissão para vendedor - 3% do valor da venda
  {
    id: 'cr9',
    clinicId: 'clinic1',
    professionalId: 'all',
    beneficiaryType: 'seller',
    beneficiaryId: 'staff2',
    beneficiaryName: 'Carlos Vendas',
    procedure: 'all',
    dayOfWeek: 'all',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    value: 3,
    isActive: true,
    priority: 6,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    notes: 'Comissão de venda para pacientes novos',
  },
  // Regra por mL (Botox)
  {
    id: 'cr10',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'Aplicação de Botox (ml)',
    dayOfWeek: 'all',
    calculationType: 'fixed',
    calculationUnit: 'ml',
    value: 25,
    isActive: true,
    priority: 16, // Auto: 15 (proc) + 1 base
    createdAt: '2025-01-18T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z',
    notes: 'R$25 por ml aplicado',
  },
  // Regra por arcada (Alinhadores)
  {
    id: 'cr11',
    clinicId: 'clinic2',
    professionalId: 'all',
    beneficiaryType: 'professional',
    procedure: 'Alinhadores (arcada)',
    dayOfWeek: 'all',
    calculationType: 'fixed',
    calculationUnit: 'arch',
    value: 300,
    isActive: true,
    priority: 16,
    createdAt: '2025-01-18T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z',
    notes: 'R$300 por arcada tratada',
  },
];

export const mockCommissionCalculations: CommissionCalculation[] = [
  {
    id: 'calc1',
    appointmentId: 'ag1',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    beneficiaryType: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Consulta Geral',
    serviceValue: 150,
    quantity: 1,
    commissionRuleId: 'cr1',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    clinicId: 'clinic2',
    clinicName: 'Consultório Odontológico Sorriso',
    procedure: 'Limpeza Dental',
    serviceValue: 200,
    quantity: 1,
    commissionRuleId: 'cr4',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Retorno',
    serviceValue: 80,
    quantity: 1,
    commissionRuleId: 'cr1',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    clinicId: 'clinic2',
    clinicName: 'Consultório Odontológico Sorriso',
    procedure: 'Clareamento',
    serviceValue: 800,
    quantity: 1,
    commissionRuleId: 'cr5',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
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
    beneficiaryType: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Exame de Sangue',
    serviceValue: 120,
    quantity: 1,
    commissionRuleId: 'cr2',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 40,
    commissionAmount: 48,
    date: '2025-01-22',
    status: 'pending',
  },
  // Comissão de recepção
  {
    id: 'calc6',
    appointmentId: 'ag1',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    beneficiaryType: 'reception',
    beneficiaryId: 'staff1',
    beneficiaryName: 'Ana Souza',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Consulta Geral',
    serviceValue: 150,
    quantity: 1,
    commissionRuleId: 'cr8',
    calculationType: 'fixed',
    calculationUnit: 'appointment',
    ruleValue: 5,
    commissionAmount: 5,
    date: '2025-01-20',
    status: 'pending',
  },
  // Comissão de vendedor
  {
    id: 'calc7',
    appointmentId: 'ag1',
    professionalId: 'prof1',
    professionalName: 'Dr. Carlos Oliveira',
    beneficiaryType: 'seller',
    beneficiaryId: 'staff2',
    beneficiaryName: 'Carlos Vendas',
    clinicId: 'clinic1',
    clinicName: 'Clínica Central São Paulo',
    procedure: 'Consulta Geral',
    serviceValue: 150,
    quantity: 1,
    commissionRuleId: 'cr9',
    calculationType: 'percentage',
    calculationUnit: 'appointment',
    ruleValue: 3,
    commissionAmount: 4.5,
    date: '2025-01-20',
    status: 'pending',
  },
];

// Função para calcular comissão baseada nas regras
export function calculateCommission(
  rules: CommissionRule[],
  professionalId: string,
  procedure: string,
  serviceValue: number,
  date: Date,
  quantity: number = 1
): { rule: CommissionRule | null; amount: number } {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as CommissionRule['dayOfWeek'];

  // Filtra regras aplicáveis e ordena por prioridade (maior primeiro)
  const applicableRules = rules
    .filter(rule => {
      if (!rule.isActive) return false;
      if (rule.beneficiaryType !== 'professional') return false; // Main calculation is for professionals
      
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
    // Fixed value - multiply by quantity for unit-based calculations
    if (rule.calculationUnit !== 'appointment') {
      amount = rule.value * quantity;
    } else {
      amount = rule.value;
    }
  }

  return { rule, amount };
}

// Função para gerar resumo de comissões por profissional
export function generateCommissionSummary(calculations: CommissionCalculation[]): CommissionSummary[] {
  const summaryMap = new Map<string, CommissionSummary>();

  calculations.forEach(calc => {
    const key = `${calc.beneficiaryType}-${calc.beneficiaryId || calc.professionalId}`;
    const existing = summaryMap.get(key);
    
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
      const displayName = calc.beneficiaryName || calc.professionalName;
      summaryMap.set(key, {
        professionalId: calc.beneficiaryId || calc.professionalId,
        professionalName: displayName,
        beneficiaryType: calc.beneficiaryType,
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
