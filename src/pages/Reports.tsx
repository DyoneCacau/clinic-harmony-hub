import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileBarChart, DollarSign, Calendar, Users, TrendingUp, Percent, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFeatureAccess } from '@/components/subscription/FeatureAction';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/hooks/useClinic';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { useProfessionals } from '@/hooks/useProfessionals';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const { canAccess: canExport } = useFeatureAccess('relatorios');
  const { clinicId } = useClinic();
  const { professionals } = useProfessionals();
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [financialData, setFinancialData] = useState<any>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    byPaymentMethod: [],
    byCategory: [],
    dailyTrend: [],
  });
  
  const [appointmentData, setAppointmentData] = useState<any>({
    total: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    byStatus: [],
    byProfessional: [],
  });
  
  const [patientData, setPatientData] = useState<any>({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    if (clinicId) {
      fetchReportData();
    }
  }, [clinicId, startDate, endDate, selectedProfessional]);

  const fetchReportData = async () => {
    if (!clinicId) return;
    setIsLoading(true);

    try {
      // Fetch financial transactions
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (transactions) {
        const incomeTotal = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        
        const byMethod = new Map<string, number>();
        transactions.filter(t => t.type === 'income').forEach(t => {
          const method = t.payment_method || 'Outros';
          byMethod.set(method, (byMethod.get(method) || 0) + Number(t.amount));
        });

        const byCategory = new Map<string, number>();
        transactions.forEach(t => {
          const cat = t.category || 'Sem categoria';
          byCategory.set(cat, (byCategory.get(cat) || 0) + Number(t.amount));
        });

        setFinancialData({
          totalIncome: incomeTotal,
          totalExpense: expenseTotal,
          netBalance: incomeTotal - expenseTotal,
          byPaymentMethod: Array.from(byMethod.entries()).map(([name, value]) => ({ name, value })),
          byCategory: Array.from(byCategory.entries()).map(([name, value]) => ({ name, value })),
          dailyTrend: [],
        });
      }

      // Fetch appointments
      let appointmentsQuery = supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedProfessional !== 'all') {
        appointmentsQuery = appointmentsQuery.eq('professional_id', selectedProfessional);
      }

      const { data: appointments } = await appointmentsQuery;

      if (appointments) {
        const byStatus = new Map<string, number>();
        const byProf = new Map<string, number>();
        
        appointments.forEach(a => {
          byStatus.set(a.status, (byStatus.get(a.status) || 0) + 1);
          byProf.set(a.professional_id, (byProf.get(a.professional_id) || 0) + 1);
        });

        setAppointmentData({
          total: appointments.length,
          completed: appointments.filter(a => a.status === 'completed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          pending: appointments.filter(a => a.status === 'pending').length,
          byStatus: Array.from(byStatus.entries()).map(([name, value]) => ({ 
            name: name === 'completed' ? 'Concluído' : name === 'cancelled' ? 'Cancelado' : name === 'pending' ? 'Pendente' : name === 'confirmed' ? 'Confirmado' : name,
            value 
          })),
          byProfessional: Array.from(byProf.entries()).map(([id, value]) => {
            const prof = professionals.find(p => p.id === id);
            return { name: prof?.name || 'Profissional', value };
          }),
        });
      }

      // Fetch patients
      const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId);

      if (patients) {
        const thisMonth = format(new Date(), 'yyyy-MM');
        const newPatients = patients.filter(p => p.created_at.startsWith(thisMonth)).length;
        
        setPatientData({
          total: patients.length,
          active: patients.filter(p => p.status === 'active').length,
          inactive: patients.filter(p => p.status === 'inactive').length,
          newThisMonth: newPatients,
        });
      }

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!canExport) {
      toast.error('Exportação não disponível no seu plano');
      return;
    }
    toast.info('Exportação PDF em desenvolvimento');
  };
  
  const handleExportExcel = () => {
    if (!canExport) {
      toast.error('Exportação não disponível no seu plano');
      return;
    }
    toast.info('Exportação Excel em desenvolvimento');
  };
  
  const handlePrint = () => window.print();

  const clinics = clinicId ? [{ id: clinicId, name: 'Minha Clínica', address: '', phone: '', cnpj: '' }] : [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-primary" />
            Relatórios Gerenciais
          </h1>
          <p className="text-muted-foreground">Análise completa do desempenho da clínica</p>
        </div>

        <ReportFilters
          startDate={startDate} endDate={endDate} selectedClinic={selectedClinic} selectedProfessional={selectedProfessional}
          onStartDateChange={setStartDate} onEndDateChange={setEndDate} onClinicChange={setSelectedClinic} onProfessionalChange={setSelectedProfessional}
          clinics={clinics} professionals={professionals.map(p => ({ id: p.id, name: p.name, specialty: p.specialty, cro: p.cro }))}
          onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} onPrint={handlePrint}
        />

        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial" className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Financeiro</TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2"><Calendar className="h-4 w-4" />Agendamentos</TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2"><Users className="h-4 w-4" />Pacientes</TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Produtividade</TabsTrigger>
          </TabsList>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Receitas</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    R$ {financialData.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {financialData.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                  <p className={`text-2xl font-bold ${financialData.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {financialData.netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Receitas por Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {financialData.byPaymentMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={financialData.byPaymentMethod}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`}
                        >
                          {financialData.byPaymentMethod.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível para o período
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {financialData.byCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financialData.byCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível para o período
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{appointmentData.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-emerald-600">{appointmentData.completed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">{appointmentData.pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                  <p className="text-2xl font-bold text-red-600">{appointmentData.cancelled}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentData.byStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={appointmentData.byStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {appointmentData.byStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentData.byProfessional.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={appointmentData.byProfessional}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Consultas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                  <p className="text-2xl font-bold">{patientData.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600">{patientData.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Inativos</p>
                  <p className="text-2xl font-bold text-muted-foreground">{patientData.inactive}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Novos este mês</p>
                  <p className="text-2xl font-bold text-blue-600">{patientData.newThisMonth}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="productivity" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Relatórios de produtividade serão baseados nos dados de agendamentos e transações.</p>
                  <p className="text-sm mt-2">Período: {format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
