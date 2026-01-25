import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, DollarSign, Percent, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { CommissionSummary, CommissionCalculation } from '@/types/commission';
import { generateCommissionSummary } from '@/data/mockCommissions';

interface CommissionReportProps {
  calculations: CommissionCalculation[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CommissionReport({ calculations }: CommissionReportProps) {
  const summary = useMemo(() => generateCommissionSummary(calculations), [calculations]);

  const totals = useMemo(() => {
    return {
      totalRevenue: summary.reduce((acc, s) => acc + s.totalRevenue, 0),
      totalCommission: summary.reduce((acc, s) => acc + s.totalCommission, 0),
      pendingCommission: summary.reduce((acc, s) => acc + s.pendingCommission, 0),
      paidCommission: summary.reduce((acc, s) => acc + s.paidCommission, 0),
      totalServices: summary.reduce((acc, s) => acc + s.totalServices, 0),
    };
  }, [summary]);

  const chartData = summary.map((s) => ({
    name: s.professionalName.split(' ').slice(0, 2).join(' '),
    comissao: s.totalCommission,
    pendente: s.pendingCommission,
    pago: s.paidCommission,
  }));

  const pieData = summary.map((s, index) => ({
    name: s.professionalName.split(' ').slice(0, 2).join(' '),
    value: s.totalCommission,
    color: COLORS[index % COLORS.length],
  }));

  const statusData = [
    { name: 'Pago', value: totals.paidCommission, color: '#10b981' },
    { name: 'Pendente', value: totals.pendingCommission, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Percent className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(totals.pendingCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.paidCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comissões por Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1).toFixed(0)}`} />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="pago" name="Pago" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendente" name="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Pago</span>
              </div>
              <span className="font-semibold">{formatCurrency(totals.paidCommission)}</span>
            </div>
            <Progress
              value={(totals.paidCommission / totals.totalCommission) * 100}
              className="h-3 bg-muted"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Pendente</span>
              </div>
              <span className="font-semibold">{formatCurrency(totals.pendingCommission)}</span>
            </div>
            <Progress
              value={(totals.pendingCommission / totals.totalCommission) * 100}
              className="h-3 bg-muted [&>div]:bg-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo por Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-center">Atendimentos</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
                <TableHead className="text-right">Taxa Média</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((s) => (
                <TableRow key={s.professionalId}>
                  <TableCell className="font-medium">{s.professionalName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{s.totalServices}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(s.totalRevenue)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(s.totalCommission)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{s.averageCommissionRate.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {formatCurrency(s.pendingCommission)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatCurrency(s.paidCommission)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{totals.totalServices}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.totalRevenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.totalCommission)}</TableCell>
                <TableCell className="text-right">
                  <Badge>
                    {((totals.totalCommission / totals.totalRevenue) * 100).toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-amber-600">
                  {formatCurrency(totals.pendingCommission)}
                </TableCell>
                <TableCell className="text-right text-emerald-600">
                  {formatCurrency(totals.paidCommission)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
