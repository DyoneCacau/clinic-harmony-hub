import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Play,
  Coffee,
  Square,
  CheckCircle,
  AlertCircle,
  Calendar,
  Timer,
} from 'lucide-react';
import { mockTimeClockEntries, calculateTotalHours, mockEmployees } from '@/data/mockTimeClock';
import { TimeClockEntry, userRoleLabels } from '@/types/timeclock';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Simulated current user
const currentUser = {
  id: 'prof1',
  name: 'Dr. Carlos Oliveira',
  role: 'professional' as const,
};

export default function TimeClock() {
  const [entries, setEntries] = useState<TimeClockEntry[]>(mockTimeClockEntries);
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), 'HH:mm');

  const todayEntry = useMemo(() => {
    return entries.find(e => e.userId === currentUser.id && e.date === today);
  }, [entries, today]);

  const userEntries = useMemo(() => {
    return entries
      .filter(e => e.userId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const weekStats = useMemo(() => {
    const weekEntries = userEntries.filter(e => e.status === 'completed').slice(0, 5);
    const totalHours = weekEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
    return {
      days: weekEntries.length,
      hours: totalHours,
      average: weekEntries.length > 0 ? totalHours / weekEntries.length : 0,
    };
  }, [userEntries]);

  const handleClockIn = () => {
    if (todayEntry) {
      toast.error('Você já registrou entrada hoje');
      return;
    }

    const newEntry: TimeClockEntry = {
      id: `tc${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      clinicId: 'clinic1',
      clinicName: 'Odonto Premium Centro',
      date: today,
      clockIn: currentTime,
      status: 'working',
    };

    setEntries(prev => [newEntry, ...prev]);
    toast.success(`Entrada registrada às ${currentTime}!`);
  };

  const handleLunchStart = () => {
    if (!todayEntry || todayEntry.status !== 'working' || todayEntry.lunchStart) {
      toast.error('Não é possível iniciar intervalo agora');
      return;
    }

    setEntries(prev => prev.map(e => 
      e.id === todayEntry.id 
        ? { ...e, lunchStart: currentTime, status: 'lunch' as const }
        : e
    ));
    toast.success(`Intervalo iniciado às ${currentTime}`);
  };

  const handleLunchEnd = () => {
    if (!todayEntry || todayEntry.status !== 'lunch') {
      toast.error('Não é possível finalizar intervalo agora');
      return;
    }

    setEntries(prev => prev.map(e => 
      e.id === todayEntry.id 
        ? { ...e, lunchEnd: currentTime, status: 'working' as const }
        : e
    ));
    toast.success(`Intervalo finalizado às ${currentTime}`);
  };

  const handleClockOut = () => {
    if (!todayEntry || todayEntry.status === 'completed' || todayEntry.status === 'lunch') {
      toast.error('Não é possível registrar saída agora');
      return;
    }

    const updatedEntry = {
      ...todayEntry,
      clockOut: currentTime,
      status: 'completed' as const,
    };
    updatedEntry.totalHours = calculateTotalHours(updatedEntry);

    setEntries(prev => prev.map(e => e.id === todayEntry.id ? updatedEntry : e));
    toast.success(`Saída registrada às ${currentTime}! Total: ${updatedEntry.totalHours.toFixed(2)}h`);
  };

  const getStatusBadge = (status: TimeClockEntry['status']) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-emerald-500">Trabalhando</Badge>;
      case 'lunch':
        return <Badge className="bg-amber-500">Em Intervalo</Badge>;
      case 'completed':
        return <Badge variant="secondary">Finalizado</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            Registro de Ponto
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Current Status */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-4xl font-bold text-primary">
                <Timer className="h-10 w-10" />
                {format(new Date(), 'HH:mm:ss')}
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{currentUser.name}</span>
                <Badge variant="outline">{userRoleLabels[currentUser.role]}</Badge>
              </div>

              {todayEntry && (
                <div className="flex items-center justify-center gap-2">
                  {getStatusBadge(todayEntry.status)}
                  <span className="text-muted-foreground">
                    Entrada: {todayEntry.clockIn}
                    {todayEntry.lunchStart && ` | Intervalo: ${todayEntry.lunchStart}`}
                    {todayEntry.lunchEnd && ` - ${todayEntry.lunchEnd}`}
                    {todayEntry.clockOut && ` | Saída: ${todayEntry.clockOut}`}
                  </span>
                </div>
              )}

              <Separator className="my-4" />

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                {!todayEntry && (
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleClockIn}>
                    <Play className="mr-2 h-5 w-5" />
                    Registrar Entrada
                  </Button>
                )}

                {todayEntry?.status === 'working' && !todayEntry.lunchStart && (
                  <Button size="lg" variant="outline" onClick={handleLunchStart}>
                    <Coffee className="mr-2 h-5 w-5" />
                    Iniciar Intervalo
                  </Button>
                )}

                {todayEntry?.status === 'lunch' && (
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700" onClick={handleLunchEnd}>
                    <Play className="mr-2 h-5 w-5" />
                    Finalizar Intervalo
                  </Button>
                )}

                {todayEntry?.status === 'working' && (
                  <Button size="lg" variant="destructive" onClick={handleClockOut}>
                    <Square className="mr-2 h-5 w-5" />
                    Registrar Saída
                  </Button>
                )}

                {todayEntry?.status === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-lg font-medium">
                      Jornada concluída - {todayEntry.totalHours?.toFixed(2)}h trabalhadas
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias Trabalhados (Semana)</p>
                  <p className="text-2xl font-bold">{weekStats.days}</p>
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
                  <p className="text-sm text-muted-foreground">Horas Totais (Semana)</p>
                  <p className="text-2xl font-bold">{weekStats.hours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Diária</p>
                  <p className="text-2xl font-bold">{weekStats.average.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Registros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userEntries.slice(0, 7).map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), 'EEE', { locale: ptBR })}
                      </p>
                      <p className="font-bold">{format(new Date(entry.date), 'dd/MM')}</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span><strong>Entrada:</strong> {entry.clockIn}</span>
                        {entry.lunchStart && (
                          <span className="text-muted-foreground">
                            Intervalo: {entry.lunchStart} - {entry.lunchEnd || '...'}
                          </span>
                        )}
                        {entry.clockOut && (
                          <span><strong>Saída:</strong> {entry.clockOut}</span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.totalHours && (
                      <span className="font-medium">{entry.totalHours.toFixed(2)}h</span>
                    )}
                    {getStatusBadge(entry.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
