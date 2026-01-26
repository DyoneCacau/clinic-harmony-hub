import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Shield,
  Users,
  Clock,
  Calendar as CalendarIcon,
  Download,
  Search,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Timer,
  FileSpreadsheet,
} from 'lucide-react';
import { mockTimeClockEntries, mockEmployees } from '@/data/mockTimeClock';
import { mockClinics } from '@/data/mockClinics';
import { TimeClockEntry, userRoleLabels } from '@/types/timeclock';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Administration() {
  const [entries] = useState<TimeClockEntry[]>(mockTimeClockEntries);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const matchesEmployee = selectedEmployee === 'all' || entry.userId === selectedEmployee;
      const matchesClinic = selectedClinic === 'all' || entry.clinicId === selectedClinic;
      const matchesDate = entryDate >= dateRange.from && entryDate <= dateRange.to;
      const matchesSearch = entry.userName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesEmployee && matchesClinic && matchesDate && matchesSearch;
    });
  }, [entries, selectedEmployee, selectedClinic, dateRange, searchTerm]);

  const stats = useMemo(() => {
    const completedEntries = filteredEntries.filter(e => e.status === 'completed');
    const totalHours = completedEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
    const uniqueEmployees = new Set(filteredEntries.map(e => e.userId)).size;
    const lateArrivals = completedEntries.filter(e => {
      const [hour] = e.clockIn.split(':').map(Number);
      return hour >= 9; // Consider 9:00 as late
    }).length;
    
    return {
      totalEntries: completedEntries.length,
      totalHours,
      uniqueEmployees,
      lateArrivals,
      averageHours: completedEntries.length > 0 ? totalHours / completedEntries.length : 0,
    };
  }, [filteredEntries]);

  // Employee summary
  const employeeSummary = useMemo(() => {
    const summary = new Map<string, { name: string; role: string; days: number; hours: number; lates: number }>();
    
    filteredEntries.forEach(entry => {
      const existing = summary.get(entry.userId) || {
        name: entry.userName,
        role: entry.userRole,
        days: 0,
        hours: 0,
        lates: 0,
      };
      
      if (entry.status === 'completed') {
        existing.days++;
        existing.hours += entry.totalHours || 0;
        const [hour] = entry.clockIn.split(':').map(Number);
        if (hour >= 9) existing.lates++;
      }
      
      summary.set(entry.userId, existing);
    });
    
    return Array.from(summary.entries()).map(([id, data]) => ({ id, ...data }));
  }, [filteredEntries]);

  // Chart data
  const hoursChartData = employeeSummary.map(emp => ({
    name: emp.name.split(' ').slice(0, 2).join(' '),
    horas: Math.round(emp.hours * 10) / 10,
  }));

  const roleDistribution = useMemo(() => {
    const roles = new Map<string, number>();
    mockEmployees.forEach(emp => {
      const current = roles.get(emp.role) || 0;
      roles.set(emp.role, current + 1);
    });
    return Array.from(roles.entries()).map(([role, count]) => ({
      name: userRoleLabels[role as keyof typeof userRoleLabels] || role,
      value: count,
    }));
  }, []);

  const handleExport = () => {
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Administração
            </h1>
            <p className="text-muted-foreground">Painel administrativo e folha de ponto</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        <Tabs defaultValue="timesheet" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timesheet" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Folha de Ponto
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funcionários
            </TabsTrigger>
          </TabsList>

          {/* Timesheet Tab */}
          <TabsContent value="timesheet" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar funcionário..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {mockEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Clínicas</SelectItem>
                      {mockClinics.map(clinic => (
                        <SelectItem key={clinic.id} value={clinic.id}>{clinic.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <CalendarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dias Registrados</p>
                      <p className="text-2xl font-bold">{stats.totalEntries}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <Timer className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Horas</p>
                      <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Funcionários</p>
                      <p className="text-2xl font-bold">{stats.uniqueEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Atrasos</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.lateArrivals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timesheet Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registros de Ponto</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => {
                      const isLate = entry.clockIn >= '09:00';
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.userName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{userRoleLabels[entry.userRole]}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <span className={isLate ? 'text-amber-600 font-medium' : ''}>
                              {entry.clockIn}
                              {isLate && <AlertTriangle className="inline ml-1 h-3 w-3" />}
                            </span>
                          </TableCell>
                          <TableCell>
                            {entry.lunchStart && entry.lunchEnd
                              ? `${entry.lunchStart} - ${entry.lunchEnd}`
                              : entry.lunchStart || '-'}
                          </TableCell>
                          <TableCell>{entry.clockOut || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.totalHours ? `${entry.totalHours.toFixed(2)}h` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.status === 'completed' ? (
                              <Badge className="bg-emerald-500">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Concluído
                              </Badge>
                            ) : entry.status === 'working' ? (
                              <Badge className="bg-blue-500">Trabalhando</Badge>
                            ) : (
                              <Badge className="bg-amber-500">Intervalo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Horas por Funcionário</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hoursChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="horas" name="Horas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Função</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {roleDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo por Funcionário</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-center">Dias Trabalhados</TableHead>
                      <TableHead className="text-right">Horas Totais</TableHead>
                      <TableHead className="text-right">Média/Dia</TableHead>
                      <TableHead className="text-center">Atrasos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeSummary.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {userRoleLabels[emp.role as keyof typeof userRoleLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{emp.days}</TableCell>
                        <TableCell className="text-right font-medium">
                          {emp.hours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          {emp.days > 0 ? (emp.hours / emp.days).toFixed(1) : 0}h
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.lates > 0 ? (
                            <Badge variant="destructive">{emp.lates}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
