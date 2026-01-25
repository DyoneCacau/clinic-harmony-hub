import { useState, useMemo } from 'react';
import {
  Plus,
  Settings,
  BarChart3,
  Filter,
  Building2,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { CommissionRulesList } from '@/components/commissions/CommissionRulesList';
import { CommissionRuleForm } from '@/components/commissions/CommissionRuleForm';
import { CommissionReport } from '@/components/commissions/CommissionReport';
import { CommissionRule } from '@/types/commission';
import { mockCommissionRules, mockCommissionCalculations } from '@/data/mockCommissions';
import { mockClinics } from '@/data/mockClinics';
import { toast } from 'sonner';

export default function Commissions() {
  const [rules, setRules] = useState<CommissionRule[]>(mockCommissionRules);
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  const filteredRules = useMemo(() => {
    if (selectedClinic === 'all') return rules;
    return rules.filter((r) => r.clinicId === selectedClinic);
  }, [rules, selectedClinic]);

  const handleSaveRule = (ruleData: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRule) {
      // Update existing rule
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                ...ruleData,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.success('Regra atualizada com sucesso!');
    } else {
      // Create new rule
      const newRule: CommissionRule = {
        ...ruleData,
        id: `cr${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRules((prev) => [...prev, newRule]);
      toast.success('Regra criada com sucesso!');
    }
    setEditingRule(null);
  };

  const handleEditRule = (rule: CommissionRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    toast.success('Regra excluída com sucesso!');
  };

  const handleToggleActive = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() }
          : r
      )
    );
    toast.success('Status da regra atualizado!');
  };

  const handleOpenNewRule = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  // Stats
  const stats = useMemo(() => {
    const activeRules = filteredRules.filter((r) => r.isActive).length;
    const percentageRules = filteredRules.filter((r) => r.calculationType === 'percentage').length;
    const fixedRules = filteredRules.filter((r) => r.calculationType === 'fixed').length;
    
    return {
      total: filteredRules.length,
      active: activeRules,
      inactive: filteredRules.length - activeRules,
      percentage: percentageRules,
      fixed: fixedRules,
    };
  }, [filteredRules]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
            <p className="text-sm text-muted-foreground">
              Configure regras de comissionamento por profissional, procedimento e dia
            </p>
          </div>
          <Button onClick={handleOpenNewRule}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrar por:</span>
              </div>
              <div className="flex flex-1 gap-4">
                <div className="w-full sm:w-64">
                  <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                    <SelectTrigger>
                      <Building2 className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Todas as clínicas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Clínicas</SelectItem>
                      {mockClinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Regras</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Settings className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inativas</p>
                  <p className="text-xl font-bold text-muted-foreground">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Percent className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentuais</p>
                  <p className="text-xl font-bold text-blue-600">{stats.percentage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Fixo</p>
                  <p className="text-xl font-bold text-amber-600">{stats.fixed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules" className="gap-2">
              <Settings className="h-4 w-4" />
              Regras
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatório de Comissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Comissão</CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionRulesList
                  rules={filteredRules}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  onToggleActive={handleToggleActive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <CommissionReport calculations={mockCommissionCalculations} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialog */}
      <CommissionRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSaveRule}
        editingRule={editingRule}
        selectedClinicId={selectedClinic !== 'all' ? selectedClinic : undefined}
      />
    </MainLayout>
  );
}
